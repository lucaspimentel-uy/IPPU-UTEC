"""Consentimiento informado (HCE-CI) — registro mínimo. M11.3-b.

**No traba nada** (§5.94, A3): ningún paso de la secuencia lo exige, y su falta no produce
aviso ni fila de auditoría; es sólo el estado derivado «CI pendiente»
(`services/flujo.py::estado_ci`). Registrarlo lo pasa a `registrado`. Se hace **una vez por
HCE** (§5.96): la clave primaria es `hce_id`.

Qué se guarda: `firmante` (el referente familiar que firma), `fecha` y `autorizaciones`
(`{evaluacion, registro, comunicacion}`, las tres del CI, cada una verdadero/falso).
**`firmante` y `fecha` son obligatorios al registrar**: sin ellos «registrado» no diría nada
(supuesto de esta rebanada, ver el informe). Crear escribe una fila `carga`; editar, una fila
`edicion` por campo. Un CI ya firmado (`FirmaMixin`) no se edita (409), pero esta rebanada
no expone la firma del CI.
"""
from collections.abc import Mapping
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constantes import MODULO_HCE_CI
from app.models.modulos import Consentimiento
from app.services import firma
from app.services.auditoria import registrar_cambios, registrar_carga
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.hce import obtener_hce
from app.services.texto import normalizar_texto

AUTORIZACIONES = ("evaluacion", "registro", "comunicacion")
CAMPOS = ("firmante", "fecha", "autorizaciones")


def obtener_consentimiento(db: Session, hce_id: int) -> Consentimiento:
    """404 si no existe el expediente o si todavía no tiene CI registrado."""
    obtener_hce(db, hce_id)
    ci = db.get(Consentimiento, hce_id)
    if ci is None:
        raise NotFound(f"El expediente {hce_id} no tiene consentimiento registrado (CI pendiente)")
    return ci


def _preparar(datos: Mapping[str, Any], errores: list[tuple[str | None, str]], *, alta: bool) -> dict[str, Any]:
    """Deja sólo los campos conocidos y normalizados. En el alta, `firmante` y `fecha` son
    obligatorios; en la edición, la ausencia es «no tocar» pero `null`/en blanco es un intento
    de borrarlos y se rechaza."""
    d = {c: datos[c] for c in CAMPOS if c in datos}
    if "firmante" in d:
        d["firmante"] = normalizar_texto(d["firmante"])
    for campo in ("firmante", "fecha"):
        if (alta and campo not in d) or (campo in d and d[campo] is None):
            errores.append((campo, "Es obligatorio"))
    autorizaciones = d.get("autorizaciones")
    if autorizaciones is not None:
        faltan = [a for a in AUTORIZACIONES if a not in autorizaciones]
        sobran = [a for a in autorizaciones if a not in AUTORIZACIONES]
        malas = [a for a, v in autorizaciones.items() if a in AUTORIZACIONES and not isinstance(v, bool)]
        for a in faltan:
            errores.append((f"autorizaciones.{a}", "Es obligatoria: verdadero o falso"))
        for a in sobran:
            errores.append((f"autorizaciones.{a}", f"No es una autorización del CI ({', '.join(AUTORIZACIONES)})"))
        for a in malas:
            errores.append((f"autorizaciones.{a}", "Debe ser verdadero o falso"))
        if not (faltan or sobran or malas):
            d["autorizaciones"] = {a: autorizaciones[a] for a in AUTORIZACIONES}
    return d


def registrar_consentimiento(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> Consentimiento:
    """Registra el CI del expediente (**una vez**): 404 si no existe el expediente, 422 si falta
    `firmante`/`fecha` o `autorizaciones` es inválida, 409 si ya tiene uno."""
    obtener_hce(db, hce_id)
    errores: list[tuple[str | None, str]] = []
    d = _preparar(datos, errores, alta=True)
    if errores:
        raise ValidationFailed(errores)
    if db.get(Consentimiento, hce_id) is not None:
        raise ConflictError(
            f"El expediente {hce_id} ya tiene el consentimiento registrado: se edita, no se vuelve a crear",
            [(None, "Ya existe el consentimiento de este expediente")],
        )
    ci = Consentimiento(hce_id=hce_id, **d)
    db.add(ci)
    try:
        db.flush()
    except IntegrityError as exc:  # carrera: dos altas simultáneas del mismo expediente
        raise ConflictError(
            f"El expediente {hce_id} ya tiene el consentimiento registrado",
            [(None, "Ya existe el consentimiento de este expediente")],
        ) from exc
    registrar_carga(
        db, modulo=MODULO_HCE_CI, hce_id=hce_id, usuario_id=usuario_id,
        detalle=f"Registro del consentimiento informado del expediente {hce_id}",
    )
    return ci


def actualizar_consentimiento(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> Consentimiento:
    """Edición parcial del CI: sólo las claves presentes; una fila `edicion` por campo que
    cambió (ninguna si nada cambió). 404 si no hay CI · 409 si está firmado · 422 si es inválido."""
    obtener_hce(db, hce_id)
    ci = db.get(Consentimiento, hce_id, with_for_update=True)
    if ci is None:
        raise NotFound(f"El expediente {hce_id} no tiene consentimiento registrado (CI pendiente)")
    firma.exigir_no_firmado(ci, MODULO_HCE_CI)
    errores: list[tuple[str | None, str]] = []
    cambios = _preparar(datos, errores, alta=False)
    if errores:
        raise ValidationFailed(errores)
    antes = {c: getattr(ci, c) for c in cambios}
    for campo, valor in cambios.items():
        setattr(ci, campo, valor)
    db.flush()
    registrar_cambios(
        db, modulo=MODULO_HCE_CI, hce_id=hce_id, antes=antes, despues=cambios, usuario_id=usuario_id,
    )
    return ci
