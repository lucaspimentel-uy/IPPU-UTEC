"""Firma = bloqueo, y corrección por addenda — genérico para todo módulo con `FirmaMixin`. M11.3-b.

**Firma = bloqueo es otra regla que la secuencia y SIGUE devolviendo 409** (§5.95;
Documento Técnico §4.1): un módulo firmado no se edita más; se corrige por addenda con
fecha, profesional y texto. La secuencia, en cambio, sólo avisa (`services/flujo.py`).

Acá no hay nada específico del IDEA: cada módulo trae sus validaciones y su cálculo de
totales y se los pasa a `firmar_modulo` como funciones. Todo corre en la transacción del
request (sólo `flush`, ver `app/services/__init__.py`): **firma + totales + auditoría
entran juntas o no entra ninguna** — si algo falla después de escribir, el rollback del
request deja el módulo sin firmar y sin fila de auditoría.
"""
from collections.abc import Callable
from typing import Any

from sqlalchemy.orm import Session

from app.core.constantes import AUDITORIA_TIPO_ADDENDA, AUDITORIA_TIPO_FIRMA, CADENA_FLUJO
from app.models.identidad import Profesional
from app.models.modulos import FirmaMixin
from app.services import auditoria, fechas, flujo
from app.services.errores import ConflictError, SignedModuleError, ValidationFailed
from app.services.texto import normalizar_texto


def exigir_no_firmado(modulo: FirmaMixin, nombre: str) -> None:
    """409 `signed_module` si el módulo está firmado: se corrige por addenda, no se edita."""
    if modulo.firmado:
        raise SignedModuleError(
            f"{nombre} está firmado y no se edita: la corrección va por addenda",
            [(None, "Módulo firmado: agregá una addenda")],
        )


def firma_de(profesional: Profesional) -> dict[str, Any]:
    """Una entrada de `firmas`: `{profesional_id, rol, fecha}`.

    `rol` es la **especialidad** del profesional (`EvaluadoresMixin`: «el rol ya viaja en
    `firmas` y en `profesional.especialidad`»); queda `None` si no la tiene cargada.
    """
    return {
        "profesional_id": profesional.id,
        "rol": profesional.especialidad,
        "fecha": fechas.hoy().isoformat(),
    }


def firmar_modulo(
    db: Session,
    modulo: FirmaMixin,
    *,
    codigo: str,
    hce_id: int,
    anio: int | None,
    firmantes: list[Profesional],
    congelar: Callable[[], None] | None = None,
    usuario_id: int | None = None,
) -> list[dict[str, Any]]:
    """Firma `modulo` y devuelve los avisos de `warnings[]`.

    En orden, todo dentro de la transacción del request:
    1. **409** `signed_module` si ya estaba firmado (firmar dos veces).
    2. Avisos de secuencia (sólo si `codigo` es un eslabón de la cadena y hay `anio`):
       se acepta y se escribe la fila `excepcion` (§5.95).
    3. `congelar()` — el módulo calcula y deja fijos sus totales (y lo que firme con él,
       como la versión del manual del IDEA).
    4. Escribe `firmado` y `firmas` (`{profesional_id, rol, fecha}` de cada firmante).
    5. Fila `auditoria` `tipo='firma'`.

    Las validaciones de integridad las corre el módulo **antes** de llamar acá.
    """
    exigir_no_firmado(modulo, codigo)
    avisos = (
        flujo.avisos_de_secuencia(
            db, hce_id=hce_id, anio=anio, modulo=codigo, accion="firma", usuario_id=usuario_id
        )
        if codigo in CADENA_FLUJO and anio is not None
        else []
    )
    if congelar is not None:
        congelar()
    modulo.firmas = [firma_de(p) for p in firmantes]
    modulo.firmado = True
    db.flush()
    auditoria.registrar_evento(
        db, modulo=codigo, hce_id=hce_id, tipo=AUDITORIA_TIPO_FIRMA, usuario_id=usuario_id,
        detalle=f"Firma de {codigo}" + (f" ({anio})" if anio is not None else ""),
    )
    return avisos


def agregar_addenda(
    db: Session,
    modulo: FirmaMixin,
    *,
    codigo: str,
    hce_id: int,
    texto: str | None,
    profesional_id: int | None,
    usuario_id: int | None = None,
) -> dict[str, Any]:
    """Agrega `{texto, profesional_id, fecha}` a `addendas` de un módulo **firmado**.

    - **409** si el módulo no está firmado (mientras no lo esté, se edita directo).
    - **422** si el texto está en blanco o el profesional no existe.
    - Escribe **una** fila `auditoria` `tipo='addenda'` (el texto queda en la addenda, no
      en el rastro).
    """
    if not modulo.firmado:
        raise ConflictError(
            f"{codigo} no está firmado: una addenda corrige un módulo firmado; mientras no lo esté se edita directamente",
            [(None, "El módulo no está firmado")],
        )
    errores: list[tuple[str | None, str]] = []
    texto = normalizar_texto(texto)
    if texto is None:
        errores.append(("texto", "Es obligatorio"))
    profesional = db.get(Profesional, profesional_id) if profesional_id is not None else None
    if profesional is None:
        errores.append(("profesional_id", "Es obligatorio y debe existir" if profesional_id is None else f"No existe el profesional {profesional_id}"))
    if errores:
        raise ValidationFailed(errores)

    nueva = {"texto": texto, "profesional_id": profesional.id, "fecha": fechas.hoy().isoformat()}
    modulo.addendas = [*(modulo.addendas or []), nueva]  # reasignar: el JSONB no detecta el append in situ
    db.flush()
    auditoria.registrar_evento(
        db, modulo=codigo, hce_id=hce_id, tipo=AUDITORIA_TIPO_ADDENDA, usuario_id=usuario_id,
        detalle=f"Addenda {len(modulo.addendas)} de {codigo}",
    )
    return nueva
