"""Fotos individuales (de un expediente) y grupales (de un grupo) — C5 (`handoff.md` §5.155 e, §5.99, §5.39).

`foto` tiene `hce_id` **o** `grupo_id` (el `CHECK individual_xor_grupal`). El archivo lo guarda
`app/services/archivos.py`: **sólo JPEG o PNG**, detectado por el contenido (§5.155 b).

## Reglas

- **Guardar una foto nunca requiere autorización y no produce aviso ni bloqueo**, individual o grupal (§5.99,
  §5.39): acá no se lee `autorizacion_imagen` y `warnings` va vacío. La autorización regula **compartir**, que
  está fuera del 26/11.
- **Alcance.** La individual cuelga del expediente (el router pide `hce_visible`). La grupal: sólo el `admin` y
  el técnico 1 o 2 **de ese grupo** la listan, la suben o la descargan; cualquier otro recibe **404**
  (`auth.exigir_grupo_visible`, la regla de los expedientes, §5.101).
- **Orden:** la subida más reciente primero (`id` descendente). `fecha` es opcional (cuándo se tomó) y el
  servidor no la completa: la foto sin fecha también va primera si es la última que se subió.
- **Sin DELETE** (405): borrar material clínico no está decidido.
- **Auditoría:** una fila `carga` por foto. La individual, `modulo='HCE-DOC'` en el expediente; la grupal,
  `hce_id NULL`, `modulo='GRUPO'` y `detalle` «grupo N · nombre año», como la asignación de técnicos (§5.120).
  El `detalle` nunca lleva la descripción ni el nombre de archivo.
"""
from __future__ import annotations

from typing import Any, BinaryIO

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.constantes import FOTO_TIPOS, MODULO_GRUPO, MODULO_HCE_DOC
from app.models.identidad import Grupo
from app.models.transversales import Foto
from app.services import archivos
from app.services.auditoria import registrar_carga
from app.services.errores import NotFound
from app.services.hce import obtener_hce
from app.services.texto import normalizar_texto


def vista(foto: Foto) -> dict[str, Any]:
    return {
        "id": foto.id, "descripcion": foto.descripcion, "fecha": foto.fecha,
        "tipo": archivos.tipo_de_ref(foto.archivo_ref), "tamano_bytes": archivos.tamano_de(foto.archivo_ref),
    }


def _condicion(*, hce_id: int | None, grupo_id: int | None):
    return Foto.hce_id == hce_id if hce_id is not None else Foto.grupo_id == grupo_id


def listar(db: Session, *, hce_id: int | None = None, grupo_id: int | None = None, limit: int, offset: int) -> tuple[list[Foto], int]:
    """Las fotos del expediente **o** del grupo, la última subida primero, y el total."""
    if hce_id is not None:
        obtener_hce(db, hce_id)
    condicion = _condicion(hce_id=hce_id, grupo_id=grupo_id)
    total = db.scalar(select(func.count()).select_from(Foto).where(condicion))
    filas = db.scalars(select(Foto).where(condicion).order_by(Foto.id.desc()).limit(limit).offset(offset))
    return list(filas), total


def obtener(db: Session, *, foto_id: int, hce_id: int | None = None, grupo_id: int | None = None) -> Foto:
    """**404** si la foto no existe o es de otro dueño (otro expediente, otro grupo, o individual ↔ grupal)."""
    if hce_id is not None:
        obtener_hce(db, hce_id)
    foto = db.scalar(select(Foto).where(Foto.id == foto_id, _condicion(hce_id=hce_id, grupo_id=grupo_id)))
    if foto is None:
        raise NotFound("No existe la foto")
    return foto


def crear(
    db: Session, *, archivo: BinaryIO, descripcion: str | None, fecha, profesional_id: int,
    hce_id: int | None = None, grupo: Grupo | None = None,
) -> Foto:
    """Guarda la foto (JPEG o PNG) del expediente **o** del grupo. **No consulta la autorización de imagen y no
    avisa** (§5.99). 422 si el archivo está vacío o no es una imagen aceptada; 413 si supera los 10 MB."""
    if (hce_id is None) == (grupo is None):
        raise ValueError("una foto es de un expediente o de un grupo, nunca de los dos ni de ninguno")
    if hce_id is not None:
        obtener_hce(db, hce_id)
    guardado = archivos.guardar(
        db, archivo, dueno="hce" if hce_id is not None else "grupo",
        dueno_id=hce_id if hce_id is not None else grupo.id, permitidos=FOTO_TIPOS,
    )
    foto = Foto(
        hce_id=hce_id, grupo_id=grupo.id if grupo is not None else None, descripcion=normalizar_texto(descripcion),
        fecha=fecha, archivo_ref=guardado.ref,
    )
    db.add(foto)
    db.flush()
    db.refresh(foto)
    if hce_id is not None:
        registrar_carga(db, modulo=MODULO_HCE_DOC, hce_id=hce_id, usuario_id=profesional_id, detalle="Foto individual cargada")
    else:
        registrar_carga(
            db, modulo=MODULO_GRUPO, hce_id=None, usuario_id=profesional_id,
            detalle=f"Grupo {grupo.nombre} {grupo.anio} · foto grupal cargada",
        )
    return foto
