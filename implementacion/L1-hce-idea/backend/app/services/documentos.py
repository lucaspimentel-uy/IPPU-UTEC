"""HCE-DOC · documentos con archivo y autorización de uso de imagen — C5 (`handoff.md` §5.155).

Tablas: `documento` (de un expediente **o** de un ateneo; acá sólo los del expediente: los de ateneo son C6),
`categoria_documento` (12 filas, 4 «Registro histórico — HCE anterior (…)») y `autorizacion_imagen` (0..1 por
expediente). El archivo lo guarda `app/services/archivos.py` (§5.138 b, §5.155 a–b).

## Reglas que implementa

- **Documento (§5.155 c).** Alta con archivo (multipart), lista, descarga y edición de metadatos (`nombre`,
  `categoria_id`, `fecha_original`) **sólo de los no históricos**. `es_registro_historico` se deriva de la
  categoría **al crear** y nunca llega en un cuerpo. **Un histórico es inmutable** (esquema §2.3 `documento`;
  docstring de `Documento`; Documento Técnico §10): su PATCH es **409**; pasar un documento a una categoría
  histórica es **422** (desde una histórica no se llega: el documento ya es histórico y es 409). **No hay
  DELETE** de documentos ni de fotos (405): borrar material clínico no está decidido (posterior al 26/11).
- **`nombre`** = el texto dado, o el *basename* (sin ruta) del nombre de archivo del cliente si viene vacío;
  sin blancos alrededor; ≤ 200 (el dado, si es más largo, es 422; el del archivo se recorta). **Es sólo una
  etiqueta**: nunca llega al sistema de archivos. `fecha_carga` = `fechas.hoy()`. **Sin caracteres invisibles** (B11,
  §5.163 b): los de categoría Cf y Cc se quitan del nombre dado y del derivado, con el aviso «Se quitaron caracteres
  invisibles del nombre.»; si no queda nada, 422 «Es obligatorio».
- **Autorización de imagen (§5.155 d)**, 0..1 (PK `hce_id`), como SEV/INC: GET 404 = no registrada; POST
  `{registrada, fecha?, documento_id?}` (409 si ya existe, también la carrera); PATCH de las claves presentes.
  `documento_id` tiene que ser un documento **del mismo expediente** (si no, 422 en `documento_id`, con un
  mensaje que no dice nada del otro expediente). **No condiciona nada ni avisa** (§5.99): es el registro que
  usará compartir, fuera del 26/11.
- **Auditoría (§5.152):** una fila `carga` por documento y por alta de la autorización; `registrar_cambios`
  por campo en cada PATCH. El `detalle` **nunca** lleva el nombre del documento, el del archivo ni el id
  interno: dice la categoría y la fecha de carga. Los valores de `categoria_id` y `documento_id` se guardan
  legibles (la categoría, no el número), como los técnicos de un grupo (§5.120).
"""
from __future__ import annotations

import re
from collections.abc import Mapping
from typing import Any, BinaryIO

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constantes import DOCUMENTO_NOMBRE_MAX, DOCUMENTO_TIPOS, MODULO_HCE_DOC
from app.models.catalogos import CategoriaDocumento
from app.models.transversales import AutorizacionImagen, Documento
from app.services import archivos, fechas
from app.services.auditoria import registrar_cambios, registrar_carga
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.hce import obtener_hce
from app.services.texto import aviso_invisibles, normalizar_texto, quitar_invisibles

CAMPOS_EDITABLES = ("nombre", "categoria_id", "fecha_original")
CAMPOS_AUTORIZACION = ("registrada", "fecha", "documento_id")


# ── Categorías ───────────────────────────────────────────────────────────────
def listar_categorias(db: Session) -> list[CategoriaDocumento]:
    return list(db.scalars(select(CategoriaDocumento).order_by(CategoriaDocumento.orden, CategoriaDocumento.id)))


# ── Lectura ──────────────────────────────────────────────────────────────────
def vista(doc: Documento) -> dict[str, Any]:
    """El documento como lo devuelve la API; `tipo` sale de `archivo_ref` y `tamano_bytes` del archivo."""
    tamano = archivos.tamano_de(doc.archivo_ref)
    return {
        "id": doc.id, "categoria": {"id": doc.categoria.id, "nombre": doc.categoria.nombre},
        "nombre": doc.nombre, "fecha_original": doc.fecha_original, "fecha_carga": doc.fecha_carga,
        "es_registro_historico": doc.es_registro_historico, "tipo": archivos.tipo_de_ref(doc.archivo_ref),
        "tamano_bytes": tamano, "tiene_archivo": tamano is not None,
    }


def listar(db: Session, hce_id: int, *, limit: int, offset: int) -> tuple[list[Documento], int]:
    """Los documentos del expediente, **el de `fecha_carga` más nueva primero** (después `id` descendente)."""
    obtener_hce(db, hce_id)
    condicion = Documento.hce_id == hce_id
    total = db.scalar(select(func.count()).select_from(Documento).where(condicion))
    filas = db.scalars(
        select(Documento).where(condicion)
        .order_by(Documento.fecha_carga.desc(), Documento.id.desc()).limit(limit).offset(offset)
    )
    return list(filas), total


def obtener(db: Session, hce_id: int, doc_id: int, *, para_escribir: bool = False) -> Documento:
    """**404** si no existe el expediente, el documento, o si el documento es de **otro** expediente (o de un
    ateneo): el mismo mensaje en los tres casos."""
    obtener_hce(db, hce_id)
    consulta = select(Documento).where(Documento.id == doc_id, Documento.hce_id == hce_id)
    if para_escribir:
        consulta = consulta.with_for_update()
    doc = db.scalar(consulta)
    if doc is None:
        raise NotFound("No existe el documento en este expediente")
    return doc


# ── Alta ─────────────────────────────────────────────────────────────────────
def _basename(nombre_archivo: str | None) -> str:
    """El último tramo del nombre que mandó el cliente, sin ruta (`/` o `\\`). **Sólo para la etiqueta.**"""
    return re.split(r"[\\/]", nombre_archivo or "")[-1].strip()


def _nombre_de_alta(nombre: str | None, nombre_archivo: str | None, errores: list) -> tuple[str | None, list[dict[str, Any]]]:
    """`(la etiqueta, los avisos)`. **Se quitan los caracteres Cf y Cc** del nombre dado y del derivado del archivo (B11,
    §5.163 b: un U+202E hace que «cod.pdf» se lea «fdp.doc»); si se quitó alguno, el aviso
    `nombre_con_caracteres_invisibles`. Un nombre dado que sólo tenía de esos queda vacío y es el 422 «Es obligatorio»;
    uno derivado del archivo, también."""
    dado = (nombre or "").strip()
    if dado:
        limpio, quitado = quitar_invisibles(dado)
        limpio = limpio.strip()
        if not limpio:
            errores.append(("nombre", "Es obligatorio: escribí un nombre (el que escribiste sólo tenía caracteres invisibles)."))
            return None, []
        if len(limpio) > DOCUMENTO_NOMBRE_MAX:
            errores.append(("nombre", f"Puede tener como máximo {DOCUMENTO_NOMBRE_MAX} caracteres."))
            return None, []
        return limpio, [aviso_invisibles()] if quitado else []
    sin_ruta, quitado = quitar_invisibles(_basename(nombre_archivo))
    derivado = sin_ruta[:DOCUMENTO_NOMBRE_MAX].strip()
    if not derivado:
        errores.append(("nombre", "Es obligatorio: escribí un nombre (el archivo no trae uno)."))
        return None, []
    return derivado, [aviso_invisibles()] if quitado else []


def _categoria(db: Session, categoria_id: Any, errores: list) -> CategoriaDocumento | None:
    if categoria_id is None:
        errores.append(("categoria_id", "Es obligatoria: elegí una categoría."))
        return None
    cat = db.get(CategoriaDocumento, categoria_id) if isinstance(categoria_id, int) and not isinstance(categoria_id, bool) else None
    if cat is None:
        errores.append(("categoria_id", "No es una de las categorías de documento."))
    return cat


def _detalle(categoria: CategoriaDocumento, fecha_carga) -> str:
    """Qué documento es, **sin su nombre ni ningún id** (§5.152): la categoría y la fecha de carga."""
    return f"Documento de la categoría «{categoria.nombre}» cargado el {fecha_carga.isoformat()}"


def crear(
    db: Session, hce_id: int, *, archivo: BinaryIO, nombre_archivo: str | None, categoria_id: Any,
    nombre: str | None, fecha_original, profesional_id: int,
) -> tuple[Documento, list[dict[str, Any]]]:
    """Alta de un documento con su archivo → `(documento, avisos)`. 404 sin expediente · 422 por campo (categoría,
    nombre, archivo vacío o de otro tipo) · 413 si el archivo supera los 10 MB. Primero se validan los datos (sin
    tocar el disco); después se guarda el archivo; si algo falla más tarde, el rollback lo borra. El único aviso es el
    de los caracteres invisibles quitados del nombre (B11)."""
    obtener_hce(db, hce_id)
    errores: list[tuple[str | None, str]] = []
    cat = _categoria(db, categoria_id, errores)
    etiqueta, avisos = _nombre_de_alta(nombre, nombre_archivo, errores)
    if errores:
        raise ValidationFailed(errores)
    guardado = archivos.guardar(db, archivo, dueno="hce", dueno_id=hce_id, permitidos=DOCUMENTO_TIPOS)
    doc = Documento(
        hce_id=hce_id, categoria_id=cat.id, nombre=etiqueta, fecha_original=fecha_original,
        fecha_carga=fechas.hoy(), es_registro_historico=cat.es_registro_historico, archivo_ref=guardado.ref,
    )
    db.add(doc)
    db.flush()
    db.refresh(doc)
    registrar_carga(
        db, modulo=MODULO_HCE_DOC, hce_id=hce_id, usuario_id=profesional_id,
        detalle=("Registro histórico cargado — " if cat.es_registro_historico else "") + _detalle(cat, doc.fecha_carga),
    )
    return doc, avisos


# ── Edición de metadatos ─────────────────────────────────────────────────────
def actualizar(
    db: Session, hce_id: int, doc_id: int, datos: Mapping[str, Any], *, profesional_id: int,
) -> tuple[Documento, list[dict[str, Any]]]:
    """PATCH de `nombre`, `categoria_id` y `fecha_original` (sólo las claves presentes) → `(documento, avisos)`.
    **409** si el documento es un registro histórico (inmutable); **422** si la categoría nueva es histórica o no
    existe, o si el nombre queda vacío o largo. Una fila `edicion` por campo que cambió; ninguna si nada cambió. Del
    nombre se quitan los caracteres Cf y Cc (B11) y, si se quitó alguno, sale el aviso."""
    doc = obtener(db, hce_id, doc_id, para_escribir=True)
    if doc.es_registro_historico:
        raise ConflictError(
            "Es un registro histórico de la HCE anterior: es de sólo lectura",
            [(None, "Los registros históricos de la HCE anterior no se modifican (son de sólo lectura).")],
        )
    errores: list[tuple[str | None, str]] = []
    cambios: dict[str, Any] = {}
    avisos: list[dict[str, Any]] = []
    if "nombre" in datos:
        nombre, quitado = quitar_invisibles(datos["nombre"] or "")
        nombre = normalizar_texto(nombre)
        if nombre is None:
            errores.append(("nombre", "Es obligatorio: un documento necesita un nombre."))
        elif len(nombre.strip()) > DOCUMENTO_NOMBRE_MAX:
            errores.append(("nombre", f"Puede tener como máximo {DOCUMENTO_NOMBRE_MAX} caracteres."))
        else:
            cambios["nombre"] = nombre.strip()
            avisos += [aviso_invisibles()] if quitado else []
    nueva = None
    if "categoria_id" in datos:
        nueva = _categoria(db, datos["categoria_id"], errores)
        if nueva is not None and nueva.es_registro_historico:
            errores.append(("categoria_id", "Una categoría «Registro histórico» se elige sólo al cargar el documento."))
        elif nueva is not None:
            cambios["categoria_id"] = nueva.id
    if "fecha_original" in datos:
        cambios["fecha_original"] = datos["fecha_original"]
    if errores:
        raise ValidationFailed(errores)
    cambios = {c: v for c, v in cambios.items() if getattr(doc, c) != v}
    if not cambios:
        return doc, avisos
    categoria_antes = doc.categoria
    antes = {c: getattr(doc, c) for c in cambios}
    despues = dict(cambios)
    if "categoria_id" in cambios:  # legible: la categoría, no el número
        antes["categoria_id"], despues["categoria_id"] = categoria_antes.nombre, nueva.nombre
    for campo, valor in cambios.items():
        setattr(doc, campo, valor)
    db.flush()
    filas = registrar_cambios(db, modulo=MODULO_HCE_DOC, hce_id=hce_id, antes=antes, despues=despues, usuario_id=profesional_id)
    for fila in filas:
        fila.detalle = _detalle(categoria_antes, doc.fecha_carga)
    db.flush()
    db.refresh(doc)
    return doc, avisos


# ── Autorización de uso de imagen ────────────────────────────────────────────
def _doc_legible(db: Session, documento_id: int | None) -> str | None:
    """Cómo se audita `documento_id`: categoría y fecha de carga del documento (ni su nombre ni el número)."""
    if documento_id is None:
        return None
    doc = db.get(Documento, documento_id)
    return f"documento de la categoría «{doc.categoria.nombre}» cargado el {doc.fecha_carga.isoformat()}" if doc else None


def vista_autorizacion(db: Session, aut: AutorizacionImagen) -> dict[str, Any]:
    doc = db.get(Documento, aut.documento_id) if aut.documento_id is not None else None
    return {
        "registrada": aut.registrada, "fecha": aut.fecha, "documento_id": aut.documento_id,
        "documento": {"id": doc.id, "nombre": doc.nombre, "categoria": doc.categoria.nombre} if doc else None,
    }


def obtener_autorizacion(db: Session, hce_id: int, *, para_escribir: bool = False) -> AutorizacionImagen:
    """404 si no existe el expediente o si la autorización todavía no está registrada."""
    obtener_hce(db, hce_id)
    consulta = select(AutorizacionImagen).where(AutorizacionImagen.hce_id == hce_id)
    if para_escribir:
        consulta = consulta.with_for_update()
    aut = db.scalar(consulta)
    if aut is None:
        raise NotFound("Este expediente no tiene registrada la autorización de uso de imagen")
    return aut


def _documento_del_expediente(db: Session, hce_id: int, documento_id: Any, errores: list) -> None:
    """`documento_id` tiene que ser un documento de **este** expediente. El mensaje es el mismo si no existe o es
    de otro: no se confirma nada de un expediente ajeno."""
    if documento_id is None:
        return
    doc = db.get(Documento, documento_id) if isinstance(documento_id, int) else None
    if doc is None or doc.hce_id != hce_id:
        errores.append(("documento_id", "Tiene que ser uno de los documentos de este expediente."))


def _conflicto_autorizacion(hce_id: int) -> ConflictError:
    return ConflictError(
        "Este expediente ya tiene registrada la autorización de imagen: se edita, no se vuelve a crear",
        [(None, "Ya está registrada la autorización de uso de imagen de este expediente")],
    )


def crear_autorizacion(db: Session, hce_id: int, datos: Mapping[str, Any], *, profesional_id: int) -> AutorizacionImagen:
    """Alta (una vez): `registrada` obligatoria (el schema), `fecha` y `documento_id` opcionales. 422 si el documento
    no es de este expediente; 409 si ya existe. Una fila `carga`. **Sin avisos**: no condiciona nada (§5.99)."""
    obtener_hce(db, hce_id)
    errores: list[tuple[str | None, str]] = []
    _documento_del_expediente(db, hce_id, datos.get("documento_id"), errores)
    if errores:
        raise ValidationFailed(errores)
    if db.get(AutorizacionImagen, hce_id) is not None:
        raise _conflicto_autorizacion(hce_id)
    aut = AutorizacionImagen(hce_id=hce_id, **{c: datos.get(c) for c in CAMPOS_AUTORIZACION})
    db.add(aut)
    try:
        db.flush()
    except IntegrityError as exc:  # carrera: dos altas simultáneas del mismo expediente
        raise _conflicto_autorizacion(hce_id) from exc
    registrar_carga(
        db, modulo=MODULO_HCE_DOC, hce_id=hce_id, usuario_id=profesional_id,
        detalle="Alta del registro de la autorización de uso de imagen",
    )
    return aut


def actualizar_autorizacion(db: Session, hce_id: int, datos: Mapping[str, Any], *, profesional_id: int) -> AutorizacionImagen:
    """PATCH de las claves presentes; `registrada` no admite `null` (422); `fecha` y `documento_id`, sí (borran).
    Una fila `edicion` por campo que cambió."""
    aut = obtener_autorizacion(db, hce_id, para_escribir=True)
    errores: list[tuple[str | None, str]] = []
    if "registrada" in datos and datos["registrada"] is None:
        errores.append(("registrada", "Es obligatorio: indicá si la autorización está registrada."))
    _documento_del_expediente(db, hce_id, datos.get("documento_id"), errores)
    if errores:
        raise ValidationFailed(errores)
    cambios = {c: datos[c] for c in CAMPOS_AUTORIZACION if c in datos and getattr(aut, c) != datos[c]}
    if not cambios:
        return aut
    legible = {"registrada": lambda v: "Sí" if v else "No", "documento_id": lambda v: _doc_legible(db, v)}
    antes = {c: legible.get(c, lambda v: v)(getattr(aut, c)) for c in cambios}
    despues = {c: legible.get(c, lambda v: v)(v) for c, v in cambios.items()}
    for campo, valor in cambios.items():
        setattr(aut, campo, valor)
    db.flush()
    filas = registrar_cambios(db, modulo=MODULO_HCE_DOC, hce_id=hce_id, antes=antes, despues=despues, usuario_id=profesional_id)
    for fila in filas:
        fila.detalle = "Autorización de uso de imagen"
    db.flush()
    return aut
