"""Asignación de técnicos a un grupo: `PATCH /grupos/{id}` — M11.5-a (`handoff.md` §5.120).

**Sólo** `tecnico1_id`, `tecnico2_id`, `tecnico1_rol`, `tecnico2_rol`. Crear, renombrar o archivar
grupos sigue siendo el sub-módulo de administración (§5.90): este servicio no toca `nombre` ni `anio`.

- La fuente de verdad son las columnas de `grupo` (§5.100: no hay historial de asignaciones). El
  cambio se rastrea por la **auditoría de campo**: una fila `edicion` por campo que cambió, con
  `hce_id NULL` (evento institucional), `modulo='GRUPO'` y `detalle` = qué grupo. Para que el valor
  anterior sea **legible** (esquema §4, fila «Auditoría de campo»), los `tecnicoN_id` se guardan como
  `"Nombre (id N)"` y no como el número pelado.
- Un profesional asignado tiene que **existir y estar activo**; los dos técnicos, **distintos**
  (contra el estado final: mandar sólo `tecnico2_id` igual al `tecnico1_id` vigente también es 422).
- `null` en un `tecnicoN_id` lo desasigna; `''`/blanco en un rol → `NULL` (`services/texto.py`).
- Quién puede llamarlo (sólo `admin`) lo decide el router: el servicio no conoce roles.
"""
from collections.abc import Mapping
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constantes import MODULO_GRUPO
from app.models.identidad import Grupo, Profesional
from app.services.auditoria import registrar_cambios
from app.services.errores import NotFound, ValidationFailed
from app.services.texto import normalizar_opcionales

CAMPOS_TECNICO = ("tecnico1_id", "tecnico2_id")
CAMPOS_ROL = ("tecnico1_rol", "tecnico2_rol")


def _legible(db: Session, profesional_id: int | None) -> str | None:
    if profesional_id is None:
        return None
    profesional = db.get(Profesional, profesional_id)
    return f"{profesional.nombre} (id {profesional_id})" if profesional else f"id {profesional_id}"


def _foto(db: Session, grupo: Grupo, campos) -> dict[str, Any]:
    """Valores de `campos` en forma legible, para comparar y auditar."""
    return {
        campo: _legible(db, getattr(grupo, campo)) if campo in CAMPOS_TECNICO else getattr(grupo, campo)
        for campo in campos
    }


def asignar_tecnicos(
    db: Session, grupo_id: int, cambios: Mapping[str, Any], *, usuario_id: int | None = None,
) -> Grupo:
    """Aplica `cambios` (sólo las claves presentes, semántica PATCH) y audita cada campo que cambió."""
    grupo = db.scalars(select(Grupo).where(Grupo.id == grupo_id).with_for_update()).first()
    if grupo is None:
        raise NotFound(f"No existe el grupo {grupo_id}")

    cambios = normalizar_opcionales(cambios, CAMPOS_ROL)
    errores: list[tuple[str | None, str]] = []
    for campo in CAMPOS_TECNICO:
        profesional_id = cambios.get(campo)
        if profesional_id is None:
            continue
        profesional = db.get(Profesional, profesional_id)
        if profesional is None:
            errores.append((campo, f"No existe el profesional {profesional_id}"))
        elif not profesional.activo:
            errores.append((campo, "Tiene que ser un profesional activo"))

    t1 = cambios.get("tecnico1_id", grupo.tecnico1_id)
    t2 = cambios.get("tecnico2_id", grupo.tecnico2_id)
    if t1 is not None and t1 == t2:
        # Se marca el campo que vino en el cuerpo (si vinieron los dos, el segundo).
        campo = "tecnico2_id" if "tecnico2_id" in cambios else "tecnico1_id"
        errores.append((campo, "El técnico 1 y el técnico 2 tienen que ser personas distintas"))
    if errores:
        raise ValidationFailed(errores)

    antes = _foto(db, grupo, cambios.keys())
    for campo, valor in cambios.items():
        setattr(grupo, campo, valor)
    db.flush()
    filas = registrar_cambios(
        db, modulo=MODULO_GRUPO, hce_id=None, usuario_id=usuario_id,
        antes=antes, despues=_foto(db, grupo, cambios.keys()),
    )
    if filas:
        # Sin `hce_id`, `detalle` es lo único que dice a qué grupo apunta la fila (sin datos personales).
        for fila in filas:
            fila.detalle = f"grupo {grupo.id} · {grupo.nombre} {grupo.anio}"
        db.flush()
    return grupo
