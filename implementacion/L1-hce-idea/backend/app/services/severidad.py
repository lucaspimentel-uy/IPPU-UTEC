"""HCE-SEV · severidad DSM-5-TR: registro, lectura y edición. C2.

Una por expediente (PK `hce_id`), **sin firma, siempre editable**: IPPU confirmó que no hay una
instancia fija de re-evaluación; se corrige cuando el equipo lo ve oportuno (`puntos-a-validar.md`
§1.10, `handoff.md` §5.48). La regla del módulo, verbatim, está en el docstring de `SeveridadDsm`.

## Reglas que fija este módulo

- **El nivel no se calcula ni se deriva** (`esquema-datos-v2.md` §4, «HCE-SEV · entrada»): este
  servicio **no importa** el IDEA, el protocolo, la Escala IPPU-TEA ni sus catálogos (lo verifica un
  test estructural). `nivel_cs` y `nivel_crr` llegan del juicio clínico y se guardan tal cual.
- **Entero o nada** (§5.138 d): al registrar, los dos dominios, `justificacion` y `fecha` son
  obligatorios; al editar, la ausencia es «no tocar» pero `null`/blanco se rechaza. No hay dominio a
  medias.
- **`justificacion` no en blanco** —espacios, tabuladores y saltos de línea cuentan como blanco—,
  igual que el CHECK. «Sustantiva» (esquema §4) no tiene criterio escrito: no se agrega un largo
  mínimo ni otra heurística (decisión del equipo, §5.143).
- **El autor es el usuario del token** (como las addendas, §5.119 b): `profesional_id` no viene en el
  cuerpo. Una edición que cambia algo pasa la autoría a quien edita.
- **Las etiquetas no se guardan**: `vista()` las resuelve por grado contra `severidad_nivel`.
- **Auditoría:** el alta es una fila `carga`; cada PATCH, una fila `edicion` por campo que cambió de
  verdad (incluido `profesional_id`, legible como `"Nombre (id N)"`), ninguna si nada cambió. Es la
  condición que hace correcto el 0..1 (esquema §2.2 y §4): el nivel anterior queda legible.
- **La severidad no sale de acá**: ni la VF, ni el baremo, ni ninguna sugerencia CIF la leen
  (esquema §4, «HCE-SEV · salida (1) y (2)»; test estructural).
"""
from collections.abc import Mapping
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constantes import MODULO_HCE_SEV
from app.models.identidad import Profesional
from app.models.severidad import SeveridadDsm, SeveridadNivel
from app.services.auditoria import registrar_cambios, registrar_carga
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.hce import obtener_hce
from app.services.texto import normalizar_texto

NIVELES = ("nivel_cs", "nivel_crr")
CAMPOS = (*NIVELES, "justificacion", "fecha")
GRADOS = (1, 2, 3)


# ── Catálogo ─────────────────────────────────────────────────────────────────
def listar_niveles(db: Session) -> list[SeveridadNivel]:
    """Los grados DSM-5-TR con sus descriptores, por `grado`."""
    return list(db.scalars(select(SeveridadNivel).order_by(SeveridadNivel.grado)))


# ── Lectura ──────────────────────────────────────────────────────────────────
def obtener_severidad(db: Session, hce_id: int, *, para_escribir: bool = False) -> SeveridadDsm:
    """404 si no existe el expediente o si todavía no tiene severidad registrada."""
    obtener_hce(db, hce_id)
    sev = db.get(SeveridadDsm, hce_id, with_for_update=True if para_escribir else None)
    if sev is None:
        raise NotFound(f"El expediente {hce_id} no tiene severidad DSM-5-TR registrada")
    return sev


def _etiqueta(db: Session, grado: int) -> str | None:
    fila = db.get(SeveridadNivel, grado)
    return fila.etiqueta if fila is not None else None


def vista(db: Session, sev: SeveridadDsm) -> dict[str, Any]:
    """El registro con las etiquetas resueltas **ahora** contra `severidad_nivel` (nunca guardadas)."""
    return {
        "hce_id": sev.hce_id,
        "nivel_cs": sev.nivel_cs,
        "nivel_crr": sev.nivel_crr,
        "etiqueta_cs": _etiqueta(db, sev.nivel_cs),
        "etiqueta_crr": _etiqueta(db, sev.nivel_crr),
        "justificacion": sev.justificacion,
        "fecha": sev.fecha,
        "profesional": {"id": sev.profesional.id, "nombre": sev.profesional.nombre},
    }


# ── Validación ───────────────────────────────────────────────────────────────
def _preparar(datos: Mapping[str, Any], errores: list[tuple[str | None, str]], *, alta: bool) -> dict[str, Any]:
    """Sólo los campos conocidos. En el alta los cuatro son obligatorios; en la edición, la ausencia es
    «no tocar» pero `null`/blanco es un intento de vaciar un campo NOT NULL y se rechaza."""
    d = {c: datos[c] for c in CAMPOS if c in datos}
    if "justificacion" in d:
        d["justificacion"] = normalizar_texto(d["justificacion"])
    for campo in CAMPOS:
        if (alta and campo not in d) or (campo in d and d[campo] is None):
            errores.append((campo, "Es obligatoria" if campo in ("justificacion", "fecha") else "Es obligatorio: 1, 2 o 3"))
    for campo in NIVELES:
        valor = d.get(campo)
        if valor is not None and (isinstance(valor, bool) or valor not in GRADOS):
            errores.append((campo, "Tiene que ser 1, 2 o 3"))
    return d


def _legible(db: Session, profesional_id: int | None) -> str | None:
    """`"Nombre (id N)"`: el autor anterior tiene que poder leerse en la auditoría (como en `grupos.py`)."""
    if profesional_id is None:
        return None
    profesional = db.get(Profesional, profesional_id)
    return f"{profesional.nombre} (id {profesional_id})" if profesional else f"id {profesional_id}"


# ── Escritura ────────────────────────────────────────────────────────────────
def registrar_severidad(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, profesional_id: int,
) -> SeveridadDsm:
    """Registra la severidad del expediente (**una vez**), con `profesional_id` como autor.
    404 si no existe el expediente · 422 si falta o es inválido un campo · 409 si ya tiene una."""
    obtener_hce(db, hce_id)
    errores: list[tuple[str | None, str]] = []
    d = _preparar(datos, errores, alta=True)
    if errores:
        raise ValidationFailed(errores)
    conflicto = ConflictError(
        f"El expediente {hce_id} ya tiene la severidad registrada: se edita, no se vuelve a crear",
        [(None, "Ya existe la severidad de este expediente")],
    )
    if db.get(SeveridadDsm, hce_id) is not None:
        raise conflicto
    sev = SeveridadDsm(hce_id=hce_id, profesional_id=profesional_id, **d)
    db.add(sev)
    try:
        db.flush()
    except IntegrityError as exc:  # carrera: dos altas simultáneas del mismo expediente
        raise conflicto from exc
    registrar_carga(
        db, modulo=MODULO_HCE_SEV, hce_id=hce_id, usuario_id=profesional_id,
        detalle=f"Registro de la severidad DSM-5-TR del expediente {hce_id}",
    )
    return sev


def actualizar_severidad(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, profesional_id: int,
) -> SeveridadDsm:
    """Edición parcial: sólo las claves presentes. Si algo cambia de verdad, `profesional_id` pasa a
    ser quien edita; una fila `edicion` por campo que cambió (ninguna si nada cambió).
    404 si no hay severidad · 422 si un campo es inválido."""
    sev = obtener_severidad(db, hce_id, para_escribir=True)
    errores: list[tuple[str | None, str]] = []
    cambios = _preparar(datos, errores, alta=False)
    if errores:
        raise ValidationFailed(errores)
    cambios = {c: v for c, v in cambios.items() if getattr(sev, c) != v}
    if not cambios:
        return sev
    antes = {c: getattr(sev, c) for c in cambios}
    despues = dict(cambios)
    if sev.profesional_id != profesional_id:
        antes["profesional_id"] = _legible(db, sev.profesional_id)
        despues["profesional_id"] = _legible(db, profesional_id)
        cambios["profesional_id"] = profesional_id
    for campo, valor in cambios.items():
        setattr(sev, campo, valor)
    db.flush()
    db.refresh(sev, ["profesional"])
    registrar_cambios(
        db, modulo=MODULO_HCE_SEV, hce_id=hce_id, antes=antes, despues=despues, usuario_id=profesional_id,
    )
    return sev
