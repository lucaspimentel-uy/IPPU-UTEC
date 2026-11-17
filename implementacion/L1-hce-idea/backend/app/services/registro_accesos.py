"""El registro automático de accesos y de intentos — Fase 4, A2 (`docs/diseno/fase4-acceso.md` d; §5.178).

El Protocolo §7 pide el «registro automático de accesos» y el §8 un registro de cada acceso con fecha, persona, HC
consultada y motivo. A1 dejó la fila del que abre **con** motivo (`POST /hce/{id}/accesos`). Acá está lo que se registra
**sin diálogo**:

- **la apertura** (`registrar_apertura`): el primer pedido de quien trata un expediente —o de coordinación o
  administrativo en lo de gestión— a una ruta suya sin una fila vigente deja **una** fila (`tratante` o `gestion`, sin
  `motivo_codigo`, 120 minutos); los pedidos siguientes de esa ventana no escriben;
- **el ateneo clínico** (`registrar_ateneo`): abrirlo sin tratar el expediente referido deja una fila con
  `motivo_codigo='ateneo'` y `ateneo_id`, que **no abre ventana** (`vence = inicio`) y se deduplica por usuario y ateneo
  dentro de 120 minutos;
- **los intentos** (`registrar_intento`, tabla `acceso_intento`): cada consulta por C.I. y cada C.I. equivocada.

Qué fila le toca a quién lo decide la matriz (`matriz.registro_al_abrir`, `matriz.registro_por_ateneo`). Las listas y los
agregados no pasan por acá: no abren ninguna HC.

## Lo difícil, y cómo quedó resuelto

**1. Transacción propia, y de dónde sale la sesión.** La fila se escribe en **otra sesión**, que se commitea antes de que
el pedido siga: un GET usa `sesion_lectura`, que nunca commitea, y un acceso que ocurrió se registra aunque el GET falle
después. La sesión la da una fábrica que llega **por una dependencia** (`app.core.database.fabrica_registro`): en
producción es `SessionLocal` (otra conexión del pool); un test la reemplaza con `app.dependency_overrides`. Este módulo
**no commitea** (regla de `app/services/__init__.py`): recibe la sesión y hace `flush`; el commit es de
`Registro.escribir` (`app/routers/dependencias.py`), el único lugar con esa excepción a «una transacción por request»
(§5.178).

**2. Antes de registrar, el pedido suelta su transacción.** `Registro.escribir` hace `rollback()` de la sesión del
pedido —que hasta ahí sólo leyó: el token y la matriz— y recién después abre la del registro. Dos razones: (a) nadie
espera una segunda conexión del pool con una en la mano (con N pedidos simultáneos que hicieran eso el pool se traba);
(b) lo que el pedido haga después corre en una transacción que empezó **después** del commit del registro. Por eso los
datos de quien accede viajan como valores (`Quien`), no como el objeto del ORM, que queda expirado.

**3. Candado.** La demo pide `GET /hce/{id}` y `GET /hce/{id}/flujo` en paralelo. El chequeo-e-inserción va bajo
`pg_advisory_xact_lock(<constante>, hashtext('<usuario>:<expediente>'))`, que se suelta en el commit: de N pedidos
simultáneos, uno inserta y los demás, al entrar, ya ven su fila. Un choque del hash sólo hace esperar a dos pares
distintos; no cambia el resultado. Como el correlativo de ateneos (§5.158 b).

**4. Costo.** Un pedido dentro de una ventana vigente agrega **una** consulta (`apertura_registrada`, en la sesión del
pedido) y nada más: ni otra conexión ni el candado.

**5. Qué prueba la suite y qué no.** La suite corre cada pedido sobre **una** conexión dentro de una transacción que se
deshace (`conexion_api`); ahí la fábrica inyectada abre un SAVEPOINT sobre esa misma conexión. Eso **prueba** qué fila
queda, a quién, cuándo se repite y cuándo no, y —gracias al punto 2— que queda aunque el pedido falle después. **No
prueba** que sea otra transacción (no hay otra conexión: un `ROLLBACK` de la transacción externa se la lleva) **ni el
candado** (una conexión nunca se espera a sí misma). Esas dos cosas se prueban con conexiones reales y commits de verdad
(`tests/test_a2_registro_real.py`).

## Un solo lugar

Toda ruta que abre un expediente pasa por `abrir_expediente` (`app/routers/dependencias.py`): la usan la dependencia de
las rutas `/hce/{hce_id}/…` (`acceso_hce`) y la de las 14 rutas por id de módulo (`_visible_por`). No hay otra puerta.

## Qué significa «un pedido que termina en 401, 403 o 404 no registra»

El token (401), el rol y la relación (403) y la existencia (404) se deciden **antes** de registrar: quien no pasa no deja
fila. Un 404 o un 403 que da **después** el módulo, sobre algo de un expediente que el usuario sí abrió (un seguimiento
que no existe, un grupo ajeno en un PATCH), no deshace la fila: la tabla es de sólo inserción y el usuario estuvo
adentro. Si el registro no se puede escribir, el pedido falla (500) **antes** de leer nada: sin registro no hay acceso.
"""
from dataclasses import dataclass
from datetime import timedelta

from sqlalchemy import exists, func, select, text
from sqlalchemy.orm import Session

from app.core.constantes import (
    ACCESO_CANDADO_ATENEO, ACCESO_CANDADO_EXPEDIENTE, ACCESO_GESTION, MOTIVO_ATENEO, VENTANA_ACCESO_MINUTOS,
)
from app.models.acceso import AccesoHce, AccesoIntento
from app.models.identidad import Profesional
from app.services import matriz


@dataclass(frozen=True)
class Quien:
    """Lo que el registro guarda de quien accede, **como valores**: la sesión del pedido se suelta antes de escribir y el
    `Profesional` del ORM queda expirado (leerlo ahí volvería a abrir la transacción del pedido)."""

    usuario_id: int
    rol: str
    token_version: int

    @classmethod
    def de(cls, usuario: Profesional) -> "Quien":
        return cls(usuario_id=usuario.id, rol=usuario.rol, token_version=usuario.token_version)


def _ventana() -> timedelta:
    return timedelta(minutes=VENTANA_ACCESO_MINUTOS)


def _candado(sesion: Session, clave: int, quien: Quien, recurso_id: int) -> None:
    """Candado de **transacción** por (usuario, recurso): dos registros simultáneos del mismo par se esperan; se suelta
    en el COMMIT o el ROLLBACK de la sesión del registro."""
    sesion.execute(
        text("SELECT pg_advisory_xact_lock(:clave, hashtext(:par))"),
        {"clave": clave, "par": f"{quien.usuario_id}:{recurso_id}"},
    )


# ── La apertura de un expediente ─────────────────────────────────────────────
def _relaciones_que_cubren(quien: Quien, relacion: str) -> tuple[str, ...]:
    """Las filas vigentes que hacen innecesaria una nueva: la de la misma relación y, para `gestion`, además la ventana
    con motivo del rol (una coordinación que está supervisando el expediente no suma una fila de gestión por mirar la
    identificación: su acceso ya está registrado, con motivo)."""
    de_ventana = matriz.RELACION_DE_VENTANA.get(quien.rol) if relacion == ACCESO_GESTION else None
    return (relacion, de_ventana) if de_ventana else (relacion,)


def apertura_registrada(db: Session, quien: Quien, hce_id: int, relacion: str) -> bool:
    """¿Hay una fila **vigente** de `quien` sobre `hce_id` que cubra este pedido? Vigente: sin vencer y con la
    `token_version` actual del usuario (F4-12: al cerrar sesión o cambiar la contraseña, el pedido siguiente vuelve a
    registrar). Es la única consulta que agrega un pedido dentro de su ventana."""
    return bool(db.scalar(select(exists().where(
        AccesoHce.usuario_id == quien.usuario_id,
        AccesoHce.hce_id == hce_id,
        AccesoHce.vence > func.now(),
        AccesoHce.relacion.in_(_relaciones_que_cubren(quien, relacion)),
        AccesoHce.token_version == quien.token_version,
    ))))


def registrar_apertura(sesion: Session, quien: Quien, hce_id: int, relacion: str) -> AccesoHce | None:
    """Bajo el candado: si otro pedido ya la escribió, nada; si no, **la** fila de la ventana (`relacion` `tratante` o
    `gestion`, sin motivo, `VENTANA_ACCESO_MINUTOS`). `sesion` es la del registro, no la del pedido."""
    _candado(sesion, ACCESO_CANDADO_EXPEDIENTE, quien, hce_id)
    if apertura_registrada(sesion, quien, hce_id, relacion):
        return None
    ahora = func.now()
    fila = AccesoHce(
        hce_id=hce_id, usuario_id=quien.usuario_id, rol=quien.rol, relacion=relacion, motivo_codigo=None,
        inicio=ahora, vence=ahora + _ventana(), token_version=quien.token_version,
    )
    sesion.add(fila)
    sesion.flush()
    return fila


# ── El ateneo clínico ────────────────────────────────────────────────────────
def ateneo_registrado(db: Session, quien: Quien, ateneo_id: int) -> bool:
    """¿`quien` ya dejó su fila por este ateneo en los últimos `VENTANA_ACCESO_MINUTOS`? La fila no es una ventana
    (`vence = inicio`): se deduplica por `inicio`."""
    return bool(db.scalar(select(exists().where(
        AccesoHce.usuario_id == quien.usuario_id,
        AccesoHce.ateneo_id == ateneo_id,
        AccesoHce.inicio > func.now() - _ventana(),
        AccesoHce.token_version == quien.token_version,
    ))))


def registrar_ateneo(sesion: Session, quien: Quien, hce_id: int, ateneo_id: int, relacion: str) -> AccesoHce | None:
    """La fila de abrir un ateneo clínico sin tratar el expediente referido: `motivo_codigo='ateneo'`, el `ateneo_id` y
    **`vence = inicio`** — el ateneo es el canal documentado (Protocolo §6.1), no una ventana sobre la HCE (§5.162 h):
    `GET /hce/{id}` sigue pidiendo el motivo."""
    _candado(sesion, ACCESO_CANDADO_ATENEO, quien, ateneo_id)
    if ateneo_registrado(sesion, quien, ateneo_id):
        return None
    ahora = func.now()
    fila = AccesoHce(
        hce_id=hce_id, usuario_id=quien.usuario_id, rol=quien.rol, relacion=relacion, motivo_codigo=MOTIVO_ATENEO,
        ateneo_id=ateneo_id, inicio=ahora, vence=ahora, token_version=quien.token_version,
    )
    sesion.add(fila)
    sesion.flush()
    return fila


# ── Los intentos ─────────────────────────────────────────────────────────────
def registrar_intento(sesion: Session, quien: Quien, tipo: str, resultado: str, hce_id: int | None) -> AccesoIntento:
    """Una fila de `acceso_intento`. **No recibe la C.I. escrita**: no hay dónde guardarla."""
    fila = AccesoIntento(usuario_id=quien.usuario_id, rol=quien.rol, tipo=tipo, resultado=resultado, hce_id=hce_id)
    sesion.add(fila)
    sesion.flush()
    return fila
