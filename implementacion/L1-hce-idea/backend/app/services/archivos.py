"""Almacenamiento de los archivos de HCE-DOC y de las fotos — C5 (`handoff.md` §5.138 b, §5.155 a–b).

## Dónde y cómo (§5.155 a)

- **Raíz** = `settings.uploads_dir` / <nombre de la base de `DATABASE_URL`> (`core/config.raiz_de_archivos`),
  fuera de git. Adentro, `hce/<hce_id>/<uuid>.<ext>`, `grupo/<grupo_id>/<uuid>.<ext>` o, desde C6 (§5.158 h),
  `ateneo/<ateneo_id>/<uuid>.<ext>`.
- `archivo_ref` guarda **esa ruta relativa a la raíz, con barras `/`** (portable entre Windows y Linux).
- **El servidor genera todo nombre y toda ruta**: el nombre de archivo del cliente nunca llega al sistema de
  archivos (a lo sumo, es la etiqueta `documento.nombre`). Antes de leer o escribir, la ruta se resuelve y se
  verifica que quede **dentro de la raíz**; además `archivo_ref` tiene que tener la forma exacta de arriba.
- Se escribe a un **temporal en la misma carpeta** y se renombra (`os.replace`): nunca queda a la vista un
  archivo a medias. Si el request falla **después** de escribir (el `INSERT`, la auditoría o el `COMMIT`), el
  archivo se borra: la sesión lo anota en `db.info` y un *listener* de `after_rollback` lo quita; un
  `after_commit` olvida la lista. Así **una fila nunca apunta a un archivo que no existe**, y un archivo no
  queda huérfano de su fila.

## Qué se acepta (§5.155 b)

Por **contenido**, nunca por la extensión ni por el `Content-Type` del cliente: PDF (`%PDF-`), JPEG
(`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`). Vacío → 422; más de `ARCHIVO_TAMANO_MAXIMO` → 413 (se lee por
bloques: un archivo grande nunca está entero en memoria); cualquier otra cosa (HTML, SVG, un «.pdf» que no lo
es) → 422. Todos con `campo` = el del archivo. **No hay antivirus ni re-codificación de imágenes** (fuera del
26/11).

**PPTX, sólo en los documentos de un ateneo (C6, §5.158 i).** Un ZIP (`50 4B 03 04`) que, ya escrito entero, tiene un
`[Content_Types].xml` (leído **solo**, con tope de tamaño y sin extraer nada más) que declara la parte principal de una
presentación (`PPTX_TIPO_PRINCIPAL`). Con macros (`presentation.macroEnabled`), una plantilla, un pase de diapositivas, un
.docx, un ZIP sin `[Content_Types].xml` o uno roto → 422. Para un documento del expediente o una foto, un ZIP es 422 de
entrada (no está en `permitidos`).

El servicio no importa FastAPI: recibe un objeto con `.read(n)` (el `UploadFile.file` de Starlette, que ya
está en un temporal en disco a partir de 1 MB).
"""
from __future__ import annotations

import os
import re
import tempfile
import uuid
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO
from xml.etree import ElementTree

from sqlalchemy import event
from sqlalchemy.orm import Session

from app.core.config import raiz_de_archivos
from app.core.constantes import (
    ARCHIVO_FIRMAS, ARCHIVO_TAMANO_MAXIMO, ARCHIVO_TIPOS, PPTX_CONTENT_TYPES_MAXIMO, PPTX_TIPO_PRINCIPAL,
)
from app.services.errores import ArchivoDemasiadoGrande, NotFound, ValidationFailed

#: Forma exacta de un `archivo_ref` válido: lo que no case con esto no se lee ni se escribe.
#: El PPTX sólo puede estar bajo `ateneo/` (es el único dueño que lo acepta).
REF_VALIDA = re.compile(
    r"^(?:(?:hce|grupo)/[1-9][0-9]*/[0-9a-f]{32}\.(?:pdf|jpg|png)|ateneo/[1-9][0-9]*/[0-9a-f]{32}\.(?:pdf|jpg|png|pptx))$"
)
DUENOS = ("hce", "grupo", "ateneo")
_BLOQUE = 64 * 1024
_CABECERA = max(len(f) for _, f in ARCHIVO_FIRMAS)
_INFO_NUEVOS = "archivos_nuevos"
_INFO_ESCUCHA = "archivos_escucha"


@dataclass(frozen=True)
class ArchivoGuardado:
    ref: str
    tipo: str
    tamano: int


def detectar_tipo(cabecera: bytes) -> str | None:
    """`pdf` | `jpg` | `png` | `pptx` según los primeros bytes; `None` si no es ninguno. `pptx` es sólo «es un ZIP»:
    lo confirma `_verificar_pptx` con el archivo entero."""
    for tipo, firma in ARCHIVO_FIRMAS:
        if cabecera.startswith(firma):
            return tipo
    return None


def tipo_de_ref(ref: str | None) -> str | None:
    """El tipo guardado (la extensión que puso el servidor), o `None` sin archivo."""
    if not ref or not REF_VALIDA.match(ref):
        return None
    return ref.rsplit(".", 1)[1]


def ruta_de(ref: str) -> Path:
    """La ruta absoluta de `ref`, **verificada dentro de la raíz**. `ValueError` si no lo está."""
    if not REF_VALIDA.match(ref or ""):
        raise ValueError(f"archivo_ref con forma inválida: {ref!r}")
    raiz = raiz_de_archivos()
    ruta = (raiz / ref).resolve()
    if not ruta.is_relative_to(raiz):
        raise ValueError(f"archivo_ref fuera de la raíz: {ref!r}")
    return ruta


def tamano_de(ref: str | None) -> int | None:
    """Bytes del archivo guardado, o `None` si no hay archivo (o falta en disco)."""
    if not ref:
        return None
    try:
        return ruta_de(ref).stat().st_size
    except (OSError, ValueError):
        return None


def archivo_para_descargar(ref: str | None) -> tuple[Path, str]:
    """(ruta, Content-Type) del archivo de `ref`; **404** si no hay archivo o falta en disco."""
    tipo = tipo_de_ref(ref)
    try:
        ruta = ruta_de(ref) if tipo else None
    except ValueError:
        ruta = None
    if ruta is None or not ruta.is_file():
        raise NotFound("El registro no tiene archivo", [(None, "El registro no tiene archivo para descargar")])
    return ruta, ARCHIVO_TIPOS[tipo]


# ── Limpieza si el request falla después de escribir ─────────────────────────
def _escuchar(db: Session) -> None:
    if db.info.get(_INFO_ESCUCHA):
        return
    db.info[_INFO_ESCUCHA] = True

    @event.listens_for(db, "after_commit")
    def _olvidar(sesion):  # noqa: ANN001 — firma del evento
        sesion.info.pop(_INFO_NUEVOS, None)

    @event.listens_for(db, "after_rollback")
    def _borrar(sesion):  # noqa: ANN001
        for ruta in sesion.info.pop(_INFO_NUEVOS, []):
            try:
                Path(ruta).unlink(missing_ok=True)
            except OSError:
                pass


def _anotar(db: Session, ruta: Path) -> None:
    _escuchar(db)
    db.info.setdefault(_INFO_NUEVOS, []).append(str(ruta))


# ── Escritura ────────────────────────────────────────────────────────────────
def guardar(
    db: Session, origen: BinaryIO, *, dueno: str, dueno_id: int, permitidos: tuple[str, ...], campo: str = "archivo",
) -> ArchivoGuardado:
    """Copia `origen` a `<raíz>/<dueno>/<dueno_id>/<uuid>.<ext>` y devuelve su `archivo_ref`.

    Lee por bloques; el tipo sale de los primeros bytes y tiene que estar en `permitidos`. Vacío o de un
    tipo no permitido → 422; más de `ARCHIVO_TAMANO_MAXIMO` → 413 (`campo` en los dos). Escribe a un
    temporal de la misma carpeta y lo renombra; si algo falla acá, el temporal se borra. Si el request falla
    **después** (la fila, la auditoría, el commit), el rollback de `db` borra el archivo (`_escuchar`).
    """
    if dueno not in DUENOS or not isinstance(dueno_id, int) or dueno_id < 1:
        raise ValueError("dueño inválido")
    carpeta = raiz_de_archivos() / dueno / str(dueno_id)
    carpeta.mkdir(parents=True, exist_ok=True)
    fd, temporal = tempfile.mkstemp(dir=carpeta, prefix=".subiendo-", suffix=".part")
    try:
        cabecera, total, tipo = b"", 0, None
        with os.fdopen(fd, "wb") as destino:
            while True:
                bloque = origen.read(_BLOQUE)
                if not bloque:
                    break
                total += len(bloque)
                if total > ARCHIVO_TAMANO_MAXIMO:
                    raise ArchivoDemasiadoGrande(
                        "El archivo supera el tamaño máximo",
                        [(campo, "El archivo supera los 10 MB: el máximo es 10 MB.")],
                    )
                if tipo is None:
                    cabecera += bloque[: _CABECERA - len(cabecera)]
                    if len(cabecera) >= _CABECERA:
                        tipo = _aceptar(cabecera, permitidos, campo)
                destino.write(bloque)
        if total == 0:
            raise ValidationFailed([(campo, "El archivo está vacío.")])
        if tipo is None:
            tipo = _aceptar(cabecera, permitidos, campo)
        if tipo == "pptx":
            _verificar_pptx(temporal, permitidos, campo)
        final = carpeta / f"{uuid.uuid4().hex}.{tipo}"
        os.replace(temporal, final)
    except BaseException:
        Path(temporal).unlink(missing_ok=True)
        raise
    ref = f"{dueno}/{dueno_id}/{final.name}"
    if ruta_de(ref) != final.resolve():  # defensa en profundidad: lo escrito es lo que dice la ref
        final.unlink(missing_ok=True)
        raise RuntimeError("La ruta del archivo no coincide con su referencia")
    _anotar(db, final)
    return ArchivoGuardado(ref=ref, tipo=tipo, tamano=total)


def _rechazo(permitidos: tuple[str, ...], campo: str) -> ValidationFailed:
    nombres = [t.upper() for t in permitidos]
    lista = nombres[0] if len(nombres) == 1 else f"{', '.join(nombres[:-1])} o {nombres[-1]}"
    return ValidationFailed([(campo, f"El contenido del archivo no es {lista}: sólo se aceptan archivos {lista}.")])


def _aceptar(cabecera: bytes, permitidos: tuple[str, ...], campo: str) -> str:
    tipo = detectar_tipo(cabecera)
    if tipo is None or tipo not in permitidos:
        raise _rechazo(permitidos, campo)
    return tipo


def _verificar_pptx(ruta: str, permitidos: tuple[str, ...], campo: str) -> None:
    """El ZIP ya escrito es una presentación PowerPoint **sin macros**; si no, 422 (§5.158 i).

    Se abre el índice del ZIP y se lee **sólo** `[Content_Types].xml`, y sólo si su tamaño declarado y el leído no pasan
    de `PPTX_CONTENT_TYPES_MAXIMO` (un ZIP que miente sobre el tamaño se corta en el tope). Nada se extrae a disco. Un XML
    con `<!DOCTYPE` se rechaza antes de parsearlo (sin entidades: nada que expandir). Pasa si alguna `ContentType` es
    exactamente `PPTX_TIPO_PRINCIPAL` y ninguna es de macros."""
    try:
        with zipfile.ZipFile(ruta) as zf:
            info = zf.getinfo("[Content_Types].xml")
            if info.file_size > PPTX_CONTENT_TYPES_MAXIMO:
                raise _rechazo(permitidos, campo)
            with zf.open(info) as f:
                xml = f.read(PPTX_CONTENT_TYPES_MAXIMO + 1)
    except (KeyError, zipfile.BadZipFile, zipfile.LargeZipFile, NotImplementedError, OSError, RuntimeError, EOFError):
        raise _rechazo(permitidos, campo) from None
    if len(xml) > PPTX_CONTENT_TYPES_MAXIMO or b"<!DOCTYPE" in xml.upper() or b"<!ENTITY" in xml.upper():
        raise _rechazo(permitidos, campo)
    try:
        raiz = ElementTree.fromstring(xml)
    except ElementTree.ParseError:
        raise _rechazo(permitidos, campo) from None
    tipos = [e.get("ContentType", "") for e in raiz.iter() if e.get("ContentType") is not None]
    if PPTX_TIPO_PRINCIPAL not in tipos or any("macroenabled" in t.lower() for t in tipos):
        raise _rechazo(permitidos, campo)
