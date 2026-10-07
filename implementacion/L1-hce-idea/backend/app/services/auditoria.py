"""Auditoría de campo (HCE-LOG) — `esquema-datos-v2.md` §4, fila «Auditoría de campo».

Una fila de `auditoria` **por campo que cambió de verdad**: `campo`, `valor_ant`,
`valor_nuevo`, `modulo`, `hce_id`, `tipo='edicion'`. Es lo que hace legible, por
ejemplo, quién era el técnico antes del cambio, o qué había en `alerta` antes de
que lo pisaran.

Corre **en la transacción del que llama** (sólo `flush`, ver
`app/services/__init__.py`): si el request falla, el cambio y su rastro se
deshacen juntos.
"""
import json
from collections.abc import Mapping
from datetime import date, datetime
from typing import Any

from sqlalchemy.orm import Session

from app.core.constantes import AUDITORIA_TIPO_CARGA, AUDITORIA_TIPO_EDICION
from app.models.transversales import Auditoria


def valor_a_texto(valor: Any) -> str | None:
    """Representación guardada en `valor_ant`/`valor_nuevo` (la columna es `Text`).

    `None` → `NULL`. Fechas en ISO. `dict`/`list` (JSONB) como JSON con claves
    ordenadas, para que dos valores iguales den el mismo texto. Lo demás, `str()`.
    El tipado real vive en la tabla de origen (docstring de `Auditoria`).
    """
    if valor is None:
        return None
    if isinstance(valor, (dict, list)):
        return json.dumps(valor, sort_keys=True, ensure_ascii=False)
    if isinstance(valor, (date, datetime)):
        return valor.isoformat()
    return str(valor)


def registrar_cambios(
    db: Session,
    *,
    modulo: str,
    hce_id: int | None,
    antes: Mapping[str, Any],
    despues: Mapping[str, Any],
    usuario_id: int | None = None,
) -> list[Auditoria]:
    """Escribe una fila por cada campo de `despues` cuyo valor difiere del de `antes`.

    - Compara **valores**, no textos: `3` y `3` no cambian; `None` y `None` tampoco.
      Si nada cambió devuelve `[]` y no escribe **ninguna** fila.
    - Sólo mira las claves de `despues`: en un PATCH, lo que no vino no cambió.
    - `usuario_id` es el usuario del token (los routers lo pasan desde M11.3-d1, §5.118 d); `None`
      sólo para quien llama sin HTTP (scripts, tests de servicio).
    - `hce_id=None` es válido para eventos institucionales (cambio de técnico de un
      grupo, retiro de un taller del catálogo).
    """
    filas = [
        Auditoria(
            hce_id=hce_id,
            usuario_id=usuario_id,
            modulo=modulo,
            tipo=AUDITORIA_TIPO_EDICION,
            campo=campo,
            valor_ant=valor_a_texto(antes.get(campo)),
            valor_nuevo=valor_a_texto(nuevo),
        )
        for campo, nuevo in despues.items()
        if antes.get(campo) != nuevo
    ]
    if filas:
        db.add_all(filas)
        db.flush()
    return filas


def registrar_evento(
    db: Session,
    *,
    modulo: str,
    hce_id: int | None,
    tipo: str,
    detalle: str,
    usuario_id: int | None = None,
) -> Auditoria:
    """Escribe **una** fila de un evento que no es la edición de un campo: `carga`,
    `firma`, `addenda` o `excepcion` (el CHECK de la tabla admite además `alerta` y
    `acceso`, de otras rebanadas).

    `campo`, `valor_ant` y `valor_nuevo` quedan `NULL`; `detalle` nombra el registro.
    **Sin datos personales** en el texto: el rastro dice *qué* pasó, no *a quién* (la
    persona se lee en la propia HCE). Es el único punto por el que pasan esos eventos
    —firma y addenda lo usan a través de él—, así que un test puede interceptarlo.
    """
    fila = Auditoria(
        hce_id=hce_id, usuario_id=usuario_id, modulo=modulo, tipo=tipo, detalle=detalle,
    )
    db.add(fila)
    db.flush()
    return fila


def registrar_carga(
    db: Session,
    *,
    modulo: str,
    hce_id: int | None,
    detalle: str,
    usuario_id: int | None = None,
) -> Auditoria:
    """Escribe **una** fila `tipo='carga'`: se creó un registro (§5.112)."""
    return registrar_evento(
        db, modulo=modulo, hce_id=hce_id, tipo=AUDITORIA_TIPO_CARGA,
        detalle=detalle, usuario_id=usuario_id,
    )
