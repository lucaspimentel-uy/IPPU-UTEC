"""Abrir una ventana de acceso a una HC con motivo — Fase 4, A1 (`docs/diseno/fase4-acceso.md` c, d, e; §5.164, §5.165).

`POST /hce/{id}/accesos {motivo_codigo, motivo_texto?, ci?}` deja **una fila** de `acceso_hce`:

- el **técnico no tratante** (`no_tratante`) y **coordinación** (`supervision`) abren una ventana de
  `VENTANA_ACCESO_MINUTOS` sobre el expediente (F4-9);
- la **copia de la HC a la familia** (`copia_familia`, del tratante o de coordinación) es un acceso del **titular**
  (`titular`, §5.103): `vence = inicio`, no abre nada.

**Decisión (a) del equipo (§5.165, corrige F4-8 y F4-9):** el técnico no tratante manda además la **C.I. completa** del
NNA, que se compara canónica (§5.110) con la del expediente; si no coincide, la respuesta es el **404 de un expediente
inexistente**. Los ids son correlativos: sin esto, un técnico abriría cualquier expediente recorriéndolos, con el registro
como único control y después del hecho. Coordinación no la manda (si la manda, no se mira).

**Reglas del motivo** (sección e): del catálogo `MOTIVOS_ACCESO` y para la relación de quien lo pide (422 por campo si no);
`motivo_texto` vacío o en blanco → NULL; obligatorio en `copia_familia` y `otro`; hasta `MOTIVO_TEXTO_MAX` caracteres; sin
NUL (lo rechaza la dependencia `sin_caracter_nulo`, §5.163 a); los caracteres Cf y Cc se quitan **salvo** salto de línea,
retorno y tabulación, con el aviso de §5.163 b.

Lo que sigue en A2 (no acá): el registro automático del tratante, de la gestión y del ateneo clínico; los lectores del
registro (`GET /hce/{id}/accesos`, `GET /accesos`).
"""
from collections.abc import Mapping
from datetime import timedelta
from typing import Any

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.constantes import (
    ACCESO_NO_TRATANTE, ACCESO_SUPERVISION, ACCESO_TITULAR, MOTIVO_COPIA_FAMILIA, MOTIVO_QUIEN_COORDINACION,
    MOTIVO_TEXTO_MAX, MOTIVOS_ACCESO, VENTANA_ACCESO_MINUTOS,
)
from app.models.acceso import AccesoHce
from app.models.identidad import Profesional
from app.services import matriz
from app.services.errores import NotFound, ValidationFailed
from app.services.hce import clave_ci
from app.services.texto import aviso_invisibles, normalizar_texto, quitar_invisibles

#: Lo que se conserva de los caracteres de control en el texto del motivo (puede tener varias líneas).
_CONSERVAR = "\n\r\t"


def motivos() -> list[dict[str, Any]]:
    """El catálogo, con quién puede usar cada motivo (`quien`: `tratante` · `no_tratante` · `coordinacion`)."""
    return [
        {"codigo": codigo, "label": m["label"], "quien": list(m["quien"]), "texto_obligatorio": m["texto_obligatorio"]}
        for codigo, m in MOTIVOS_ACCESO.items()
    ]


def _quien(usuario: Profesional, relacion: str | None) -> str:
    """Contra qué `quien` del catálogo se mira el motivo: coordinación es siempre `coordinacion` (trate o no al grupo);
    el técnico, su relación."""
    return MOTIVO_QUIEN_COORDINACION if matriz.es_coordinacion(usuario) else (relacion or "")


def abrir(db: Session, usuario: Profesional, hce_id: int, datos: Mapping[str, Any]) -> tuple[AccesoHce, list[dict]]:
    """La fila de `acceso_hce` y los avisos. El rol y la existencia los miró la dependencia de la ruta."""
    hce = matriz.exigir_en_hce(db, usuario, "accesos.abrir", hce_id)
    relacion = matriz.relacion(usuario, hce)
    errores: list[tuple[str | None, str]] = []
    avisos: list[dict] = []

    # (a) El técnico no tratante prueba que tiene la C.I. de la interconsulta. Antes que el motivo: una C.I. que no
    # coincide no dice nada más (es el 404 de un inexistente).
    if matriz.es_tecnico(usuario) and relacion != matriz.TRATANTE:
        ci = datos.get("ci")
        if not isinstance(ci, str) or normalizar_texto(ci) is None:
            raise ValidationFailed([("ci", "Es obligatoria: escribí la C.I. completa del NNA.")])
        if clave_ci(ci).strip() != hce.persona.ci:
            raise NotFound("No existe el expediente")

    codigo = datos.get("motivo_codigo")
    motivo = MOTIVOS_ACCESO.get(codigo) if isinstance(codigo, str) else None
    if motivo is None:
        errores.append(("motivo_codigo", "Elegí uno de los motivos del catálogo."))
    elif _quien(usuario, relacion) not in motivo["quien"]:
        errores.append(("motivo_codigo", "Ese motivo no corresponde a tu relación con este expediente."))

    texto = datos.get("motivo_texto")
    if texto is not None and not isinstance(texto, str):
        errores.append(("motivo_texto", "Tiene que ser un texto."))
        texto = None
    if isinstance(texto, str):
        texto, quitados = quitar_invisibles(texto, conservar=_CONSERVAR)
        if quitados:
            avisos.append(aviso_invisibles("motivo_texto"))
        texto = normalizar_texto(texto)
    if texto is not None and len(texto) > MOTIVO_TEXTO_MAX:
        errores.append(("motivo_texto", f"Hasta {MOTIVO_TEXTO_MAX} caracteres."))
    if motivo is not None and motivo["texto_obligatorio"] and texto is None:
        errores.append(("motivo_texto", "Es obligatorio para este motivo: escribilo (sin datos clínicos del NNA)."))
    if errores:
        raise ValidationFailed(errores)

    titular = codigo == MOTIVO_COPIA_FAMILIA
    ahora = func.now()
    fila = AccesoHce(
        hce_id=hce.id, usuario_id=usuario.id, rol=usuario.rol,
        relacion=ACCESO_TITULAR if titular else (ACCESO_SUPERVISION if matriz.es_coordinacion(usuario) else ACCESO_NO_TRATANTE),
        motivo_codigo=codigo, motivo_texto=texto, inicio=ahora,
        vence=ahora if titular else ahora + timedelta(minutes=VENTANA_ACCESO_MINUTOS),
        token_version=usuario.token_version,
    )
    db.add(fila)
    db.flush()
    db.refresh(fila)
    return fila, avisos


def vista(fila: AccesoHce) -> dict[str, Any]:
    return {
        "id": fila.id, "hce_id": fila.hce_id, "relacion": fila.relacion, "motivo_codigo": fila.motivo_codigo,
        "motivo_label": MOTIVOS_ACCESO[fila.motivo_codigo]["label"] if fila.motivo_codigo else None,
        "motivo_texto": fila.motivo_texto, "inicio": fila.inicio, "vence": fila.vence,
    }
