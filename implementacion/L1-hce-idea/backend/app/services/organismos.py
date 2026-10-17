"""HCE-ORG · vínculos con INAU y BPS y sus registros (envíos y gestiones). C3.

`organismo_inau` y `organismo_bps` son 0..1 por expediente (PK `hce_id`), con todos los campos
opcionales; `registro_organismo` es 1:N. **El informe a los organismos es el IC** (§5.3) y los documentos
de respaldo van a HCE-DOC: este módulo sólo lleva el vínculo administrativo y la constancia de cada
comunicación.

## Reglas que fija este módulo (§5.144)

- **Alerta AYEX** (recordatorio «ayex»: «avisar 60 y 30 días antes»): sólo si `bps.prestacion` es una de
  las dos AYEX de `BPS_PRESTACIONES`. `{nivel, dias, mensaje}` o `None`: vencida (`dias` < 0), ≤ 30 o ≤ 60
  días, con la misma forma que `alerta_vigencia` de la VF. **No mira `estado`** (no hay regla escrita). Se
  calcula al leer: no se guarda, no bloquea y no deja fila de auditoría.
- **Un vínculo vacío no dice nada**: el alta con todos los campos vacíos es 422 (`campo` null). Un PATCH
  puede vaciar campos —`null` borra— porque no hay regla escrita que lo prohíba.
- **`prestacion` y `estado` son texto libre** en la base (el formulario ofrece `BPS_PRESTACIONES` y
  `BPS_ESTADOS`): se guarda lo que llega, dentro del largo de la columna.
- **Registros: sólo crear y listar.** `fecha` y `detalle` obligatorios (el detalle no en blanco); el autor
  es el usuario del token (`autor_id` no viene en el cuerpo). Sin edición ni baja: es una constancia.
- **Auditoría:** el alta de un vínculo o de un registro es una fila `carga`; cada PATCH, una fila `edicion`
  por campo que cambió de verdad, ninguna si nada cambió. El campo se rotula con su organismo
  (`inau.obs`, `bps.obs`) porque los dos vínculos comparten nombres (`obs`).
"""
from collections.abc import Mapping
from datetime import date
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constantes import (
    AYEX_ALERTA_DIAS, BPS_ESTADOS, BPS_PRESTACIONES, BPS_PRESTACIONES_AYEX, MODULO_HCE_ORG, ORGANISMOS,
)
from app.models.identidad import Profesional
from app.models.transversales import OrganismoBps, OrganismoInau, RegistroOrganismo
from app.services import fechas
from app.services.auditoria import registrar_cambios, registrar_carga
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.hce import obtener_hce
from app.services.texto import normalizar_opcionales, normalizar_texto

CAMPOS_INAU = ("sipi", "convenio", "referente", "ingreso", "obs")
CAMPOS_BPS = ("prestacion", "tramite", "estado", "vencimiento", "obs")
_FECHAS = ("ingreso", "vencimiento")
_ROTULO = {"inau": "INAU", "bps": "BPS"}
_MODELO = {"inau": OrganismoInau, "bps": OrganismoBps}
_CAMPOS = {"inau": CAMPOS_INAU, "bps": CAMPOS_BPS}


# ── Opciones del formulario ──────────────────────────────────────────────────
def opciones() -> dict[str, list[str]]:
    """Lo que ofrece el formulario de BPS: constantes, no tablas (`core/constantes.py`)."""
    return {"bps_prestaciones": list(BPS_PRESTACIONES), "bps_estados": list(BPS_ESTADOS)}


# ── Alerta AYEX ──────────────────────────────────────────────────────────────
def alerta_ayex(prestacion: str | None, vencimiento: date | None, hoy: date | None = None) -> dict[str, Any] | None:
    """`{nivel, dias, mensaje}` o `None`. Sólo para las prestaciones AYEX; vencida, ≤ 30 o ≤ 60 días."""
    if vencimiento is None or prestacion not in BPS_PRESTACIONES_AYEX:
        return None
    dias = (vencimiento - (hoy or fechas.hoy())).days
    if dias < 0:
        return {"nivel": "vencida", "dias": dias, "mensaje": f"La Ayuda Extraordinaria (AYEX) venció hace {_dias(-dias)}"}
    for umbral in sorted(AYEX_ALERTA_DIAS):
        if dias <= umbral:
            cuando = "vence hoy" if dias == 0 else f"vence en {_dias(dias)}"
            return {"nivel": f"{umbral}_dias", "dias": dias, "mensaje": f"La Ayuda Extraordinaria (AYEX) {cuando}: renovar el trámite"}
    return None


def _dias(n: int) -> str:
    return "1 día" if n == 1 else f"{n} días"


# ── Lectura ──────────────────────────────────────────────────────────────────
def vista_inau(inau: OrganismoInau | None) -> dict[str, Any] | None:
    return None if inau is None else {c: getattr(inau, c) for c in CAMPOS_INAU}


def vista_bps(bps: OrganismoBps | None) -> dict[str, Any] | None:
    if bps is None:
        return None
    return {**{c: getattr(bps, c) for c in CAMPOS_BPS}, "alerta": alerta_ayex(bps.prestacion, bps.vencimiento)}


def leer(db: Session, hce_id: int) -> dict[str, Any]:
    """Los dos vínculos del expediente; cada uno `None` mientras no se haya registrado."""
    obtener_hce(db, hce_id)
    return {
        "inau": vista_inau(db.get(OrganismoInau, hce_id)),
        "bps": vista_bps(db.get(OrganismoBps, hce_id)),
    }


def _obtener(db: Session, organismo: str, hce_id: int, *, para_escribir: bool = False):
    obtener_hce(db, hce_id)
    fila = db.get(_MODELO[organismo], hce_id, with_for_update=True if para_escribir else None)
    if fila is None:
        raise NotFound(f"El expediente {hce_id} no tiene vínculo con {_ROTULO[organismo]} registrado")
    return fila


# ── Validación ───────────────────────────────────────────────────────────────
def _preparar(organismo: str, datos: Mapping[str, Any]) -> dict[str, Any]:
    """Sólo los campos del vínculo; los textos en blanco pasan a `None` (la ausencia sigue siendo «no tocar»)."""
    campos = _CAMPOS[organismo]
    d = normalizar_opcionales({c: datos[c] for c in campos if c in datos}, [c for c in campos if c not in _FECHAS])
    return d


# ── Escritura ────────────────────────────────────────────────────────────────
def crear_vinculo(db: Session, organismo: str, hce_id: int, datos: Mapping[str, Any], *, profesional_id: int):
    """Alta del vínculo (**una vez**). 404 si no existe el expediente · 422 si todo viene vacío · 409 si ya existe."""
    obtener_hce(db, hce_id)
    d = _preparar(organismo, datos)
    if all(d.get(c) is None for c in _CAMPOS[organismo]):
        raise ValidationFailed([(None, f"Completá al menos un dato del vínculo con {_ROTULO[organismo]}: un vínculo vacío no dice nada")])
    conflicto = ConflictError(
        f"El expediente {hce_id} ya tiene el vínculo con {_ROTULO[organismo]}: se edita, no se vuelve a crear",
        [(None, f"Ya existe el vínculo con {_ROTULO[organismo]} de este expediente")],
    )
    if db.get(_MODELO[organismo], hce_id) is not None:
        raise conflicto
    fila = _MODELO[organismo](hce_id=hce_id, **d)
    db.add(fila)
    try:
        db.flush()
    except IntegrityError as exc:  # carrera: dos altas simultáneas del mismo expediente
        raise conflicto from exc
    registrar_carga(
        db, modulo=MODULO_HCE_ORG, hce_id=hce_id, usuario_id=profesional_id,
        detalle=f"Alta del vínculo con {_ROTULO[organismo]} del expediente {hce_id}",
    )
    return fila


def actualizar_vinculo(db: Session, organismo: str, hce_id: int, datos: Mapping[str, Any], *, profesional_id: int):
    """Edición parcial: sólo las claves presentes (`null` borra el campo). Una fila `edicion` por campo que
    cambió de verdad, ninguna si nada cambió. 404 si no hay vínculo."""
    fila = _obtener(db, organismo, hce_id, para_escribir=True)
    cambios = {c: v for c, v in _preparar(organismo, datos).items() if getattr(fila, c) != v}
    if not cambios:
        return fila
    antes = {f"{organismo}.{c}": getattr(fila, c) for c in cambios}
    despues = {f"{organismo}.{c}": v for c, v in cambios.items()}
    for campo, valor in cambios.items():
        setattr(fila, campo, valor)
    db.flush()
    registrar_cambios(
        db, modulo=MODULO_HCE_ORG, hce_id=hce_id, antes=antes, despues=despues, usuario_id=profesional_id,
    )
    return fila


# ── Registros (envíos a INAU · gestiones ante BPS) ───────────────────────────
def _exigir_organismo(valor: Any) -> list[tuple[str | None, str]]:
    if valor in ORGANISMOS:
        return []
    return [("organismo", f"Debe ser uno de: {', '.join(ORGANISMOS)}")]


def listar_registros(
    db: Session, hce_id: int, *, organismo: str | None = None, limit: int, offset: int,
) -> tuple[list[tuple[RegistroOrganismo, Profesional | None]], int]:
    """Los registros del expediente, el más nuevo primero (`fecha`, `id` descendentes), y el total."""
    obtener_hce(db, hce_id)
    if organismo is not None and (errores := _exigir_organismo(organismo)):
        raise ValidationFailed(errores)
    condiciones = [RegistroOrganismo.hce_id == hce_id]
    if organismo is not None:
        condiciones.append(RegistroOrganismo.organismo == organismo)
    total = db.scalar(select(func.count()).select_from(RegistroOrganismo).where(*condiciones))
    filas = db.execute(
        select(RegistroOrganismo, Profesional)
        .outerjoin(Profesional, Profesional.id == RegistroOrganismo.autor_id)
        .where(*condiciones)
        .order_by(RegistroOrganismo.fecha.desc(), RegistroOrganismo.id.desc())
        .limit(limit).offset(offset)
    ).all()
    return [(r, p) for r, p in filas], total


def crear_registro(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, profesional_id: int,
) -> tuple[RegistroOrganismo, Profesional | None]:
    """Un envío a INAU o una gestión ante BPS. `fecha` y `detalle` obligatorios; el autor es el usuario del token."""
    obtener_hce(db, hce_id)
    errores = _exigir_organismo(datos.get("organismo"))
    detalle = normalizar_texto(datos.get("detalle"))
    if detalle is None:
        errores.append(("detalle", "Es obligatorio"))
    if datos.get("fecha") is None:
        errores.append(("fecha", "Es obligatoria"))
    if errores:
        raise ValidationFailed(errores)
    registro = RegistroOrganismo(
        hce_id=hce_id, organismo=datos["organismo"], fecha=datos["fecha"], detalle=detalle, autor_id=profesional_id,
    )
    db.add(registro)
    db.flush()
    registrar_carga(
        db, modulo=MODULO_HCE_ORG, hce_id=hce_id, usuario_id=profesional_id,
        detalle=f"{'Envío a INAU' if registro.organismo == 'inau' else 'Gestión ante BPS'} registrado en el expediente {hce_id}",
    )
    return registro, db.get(Profesional, profesional_id)
