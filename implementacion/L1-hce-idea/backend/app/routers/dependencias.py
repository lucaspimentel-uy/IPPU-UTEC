"""Dependencias compartidas por los routers."""
from collections.abc import Callable, Iterator
from typing import Annotated, Any

from fastapi import Depends, Path, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import fabrica_registro, get_db
from app.models.identidad import Profesional
from app.models.modulos import Idea, InformeCierre, Protocolo
from app.services import auth, matriz, registro_accesos


def sesion_transaccional(db: Session = Depends(get_db)) -> Iterator[Session]:
    """**Una transacción por request**: commit al volver el endpoint, rollback si falla.

    Se apoya en `get_db` (que abre y cierra la sesión) y le agrega el único
    `commit` del request. Los servicios no commitean (`app/services/__init__.py`).

    - El endpoint vuelve sin excepción → `commit()`.
    - Cualquier excepción (de dominio, de validación, un bug) → `rollback()` de
      todo lo que el request escribió, y la excepción sigue su camino hacia el
      manejador que arma la respuesta de error.

    Los endpoints tienen que **armar la respuesta antes de volver**
    (`Schema.model_validate(...)` dentro de la función): el commit expira los
    objetos del ORM y no se debe depender de que se serialicen después.

    **Un commit que falla tiene que salir como error, no como 2xx (§5.177, que reemplaza el §5.115 d).**
    Desde FastAPI 0.118 el código de salida de una dependencia con `yield` corre, por omisión
    (`scope="request"`), *después* de enviar la respuesta: un `commit()` fallido sería un 201 con datos
    que no se guardaron y un error sólo en el log. Con `scope="function"` corre al volver el endpoint y
    *antes* de enviarla (FastAPI ≥ 0.121). **Por eso los endpoints no la declaran con
    `Depends(sesion_transaccional)`: usan `SesionTransaccional`** (abajo), el único lugar donde está
    `scope="function"`. `tests/test_m11_3a3_convenciones.py` falla si se pierde (verificado quitándolo).

    Orden de cierre: esta dependencia (`function`) cierra primero, con el `commit`; `get_db` (`request`,
    la sesión compartida con `usuario_actual` y la matriz) cierra después. La regla de FastAPI lo permite:
    una dependencia de scope `function` puede depender de una de scope `request`, no al revés.
    """
    try:
        yield db
        db.commit()
    except BaseException:
        db.rollback()
        raise


#: La sesión de las **mutaciones**: `sesion_transaccional` con `scope="function"` declarado en un solo lugar.
#: `get_db` y `sesion_lectura` quedan con el scope por omisión: no escriben, y que `db.close()` corra después de
#: enviar la respuesta no puede cambiar lo que recibe el cliente.
SesionTransaccional = Annotated[Session, Depends(sesion_transaccional, scope="function")]


def sesion_lectura(db: Session = Depends(get_db)) -> Session:
    """Sesión de los **GET**: nunca commitea (§5.115 d).

    Un GET no escribe, así que no hay nada que confirmar; `get_db` cierra la sesión
    al terminar y eso descarta la transacción implícita. Usar esto en vez de
    `sesion_transaccional` evita un `COMMIT` por cada lectura y deja el `commit`
    como señal de «este request escribió».
    """
    return db


# ── Login mínimo y alcance por grupo (§5.101 · M11.3-d1) ─────────────────────
# `HTTPBearer` y no `OAuth2PasswordBearer`: el login recibe JSON (`{email, password}`),
# no el formulario de OAuth2; en Swagger, «Authorize» pide el token y lo manda en
# `Authorization: Bearer …`. `auto_error=False` para que la falta de token salga con el
# sobre de error de siempre (`unauthorized`, 401) y no con el 403 propio de FastAPI.
_bearer = HTTPBearer(
    auto_error=False,
    description="Token de `POST /auth/login` (`access_token`).",
)


def usuario_actual(
    credenciales: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Session = Depends(get_db),
) -> Profesional:
    """El profesional autenticado, o **401**. `main.py` la pone en **todos** los routers salvo
    `/health`, `/auth/login` y la documentación; los endpoints que escriben la piden además
    para dejar su `id` en `auditoria.usuario_id` (FastAPI la resuelve una sola vez)."""
    return auth.usuario_de_token(db, credenciales.credentials if credenciales else None)


def _es_lectura(request: Request) -> bool:
    return request.method in ("GET", "HEAD")


# ── El registro de accesos: transacción propia (A2, §5.178) ──────────────────
class Registro:
    """Escribe en el registro de accesos (`acceso_hce`, `acceso_intento`) **en su propia transacción**, commiteada antes
    de que el pedido siga. Es la **única** excepción a «una transacción por request» (§5.178; las razones, en el
    docstring de `app/services/registro_accesos.py`).

    `escribir` **suelta primero la transacción del pedido** (`rollback()`): por eso sólo se llama cuando el pedido
    todavía no escribió nada (la dependencia de acceso, antes del endpoint) o ya no va a escribir (el camino de un 404 y
    una consulta de sólo lectura). Lo que la función necesite del pedido viaja como **valores** (`Quien`, ids): los
    objetos del ORM del pedido quedan expirados.
    """

    def __init__(self, db: Session, fabrica: Callable[[], Session]):
        self._db = db
        self._fabrica = fabrica

    def escribir(self, funcion: Callable[..., Any], *args: Any) -> None:
        """`funcion(sesion_del_registro, *args)` y su `commit`. Si falla, la excepción sigue (el pedido termina en 500
        antes de leer nada: sin registro no hay acceso)."""
        if self._db.new or self._db.dirty or self._db.deleted:
            # Un error de programación, no del usuario: soltar la transacción acá se llevaría esos cambios sin avisar.
            raise RuntimeError("Registro.escribir se llamó con cambios pendientes en la sesión del pedido")
        self._db.rollback()
        sesion = self._fabrica()
        try:
            funcion(sesion, *args)
            sesion.commit()
        except BaseException:
            sesion.rollback()
            raise
        finally:
            sesion.close()


def registro(
    db: Session = Depends(get_db), fabrica: Callable[[], Session] = Depends(fabrica_registro),
) -> Registro:
    """La dependencia que da el `Registro` del pedido: la sesión del pedido y la fábrica de la sesión propia
    (`fabrica_registro`, que un test reemplaza con `app.dependency_overrides`)."""
    return Registro(db, fabrica)


RegistroPropio = Annotated[Registro, Depends(registro)]


def abrir_expediente(
    db: Session, usuario: Profesional, accion: str, hce_id: int | None, registro_: Registro, *,
    no_existe: str = "No existe el expediente",
) -> None:
    """**La única puerta de un expediente** (A2, §5.178): la matriz y, si pasa, el registro automático del acceso. La
    usan las dos dependencias de abajo —las rutas `/hce/{hce_id}/…` y las 14 por id de módulo—, así que una ruta nueva de
    cualquiera de las dos familias registra sin hacer nada.

    1. `matriz.exigir_en_hce`: el rol, la existencia, la relación y la ventana (403 o 404: **nada se registra**).
    2. `matriz.registro_al_abrir`: qué fila le toca (`tratante`, `gestion`) o ninguna (entró por su ventana con motivo).
    3. Si ya hay una fila vigente, nada (**una consulta**, en la sesión del pedido). Si no, la fila, en su transacción.
    """
    hce = matriz.exigir_en_hce(db, usuario, accion, hce_id, no_existe=no_existe)
    relacion = matriz.registro_al_abrir(usuario, accion, hce)
    if relacion is None:
        return
    quien, expediente = registro_accesos.Quien.de(usuario), hce.id
    if not registro_accesos.apertura_registrada(db, quien, expediente, relacion):
        registro_.escribir(registro_accesos.registrar_apertura, quien, expediente, relacion)
        db.refresh(usuario)  # el endpoint recibe al usuario cargado, como siempre (soltar la transacción lo expiró)


def abrir_ateneo_clinico(
    db: Session, usuario: Profesional, ateneo_id: int, hce_referida_id: int | None, registro_: Registro,
) -> None:
    """La otra fila automática (sección d, §5.178 c): **abrir un ateneo clínico sin tratar el expediente referido** deja
    una fila `motivo_codigo='ateneo'` con su `ateneo_id`, sin diálogo y **sin ventana** sobre la HCE; una por usuario y
    ateneo cada 120 minutos. `hce_referida_id` es `None` si el ateneo no es clínico (no registra). La llama la
    dependencia de `/ateneos/{ateneo_id}/…` después de que la matriz dejó pasar; la lista `GET /ateneos` no registra."""
    relacion = matriz.registro_por_ateneo(db, usuario, hce_referida_id)
    if relacion is None:
        return
    quien = registro_accesos.Quien.de(usuario)
    if not registro_accesos.ateneo_registrado(db, quien, ateneo_id):
        registro_.escribir(registro_accesos.registrar_ateneo, quien, hce_referida_id, ateneo_id, relacion)
        db.refresh(usuario)  # ídem `abrir_expediente`


def acceso_hce(lectura: str, escritura: str):
    """La dependencia de las rutas `/hce/{hce_id}/…`: la acción de la matriz (`app/services/matriz.py`) es `lectura` en un
    GET y `escritura` en cualquier otro método. Corre antes de leer el cuerpo: el orden de la sección b del diseño (rol →
    existencia → relación y ventana → escritura) vale antes que cualquier 422. Registra el acceso (`abrir_expediente`)."""

    def dependencia(
        hce_id: int,
        request: Request,
        usuario: Annotated[Profesional, Depends(usuario_actual)],
        registro_: RegistroPropio,
        db: Session = Depends(get_db),
    ) -> None:
        abrir_expediente(db, usuario, lectura if _es_lectura(request) else escritura, hce_id, registro_)

    return dependencia


#: Lo clínico y HCE-00: lectura con motivo para quien no trata, escritura sólo del tratante.
hce_visible = acceso_hce("hce.leer", "hce.escribir")
#: El rastro de cambios y las fotos del expediente: además, fuera de la consulta del no tratante (F4-4).
hce_reservado = acceso_hce("hce.reservado", "hce.escribir")
#: ORG: también el personal administrativo (F4-6).
hce_organismos = acceso_hce("org.leer", "org.escribir")
#: `GET|PATCH /hce/{id}/identificacion` (F4-5, F4-6).
hce_identificacion = acceso_hce("identificacion.leer", "identificacion.escribir")


def _visible_por(modelo, parametro: str, nombre: str):
    """Dependencia para las rutas por id de algo que cuelga de un expediente (`/idea/{idea_id}`…), con la acción de
    `hce_visible` sobre su `hce_id`.

    **Un solo id, una sola conversión (S1b, §5.168).** El id llega como parámetro de path *tipado*
    (`int`, con el mismo nombre que en la ruta): FastAPI lo convierte una vez y le da a esta
    dependencia **el mismo valor** que recibe el endpoint. Antes leía la cadena cruda de
    `request.path_params` y salía sin mirar nada si `not crudo.isdigit()` bajo la suposición de que
    «la validación del path ya lo rechaza»: era falso, porque FastAPI/Pydantic igual convierten
    `+1`, `1.0`, ` 1`, `1 ` y `1\\n` a un `int` válido, y el endpoint corría sobre un registro que
    esta dependencia nunca revisó (un técnico de otro grupo lo leía y lo modificaba). Y al revés,
    `isdigit()` acepta dígitos que `int()` convierte a otro valor (`１`, U+FF11) o no convierte (`²`).
    Con el id ya convertido no hay camino que vuelva sin revisar.

    Lee **sólo la columna `hce_id`**, sin cargar la entidad: si la cargara, el `FOR UPDATE`
    que el servicio pide después (PATCH, firma, addenda) traería la fila bloqueada pero el
    mapa de identidad conservaría el estado leído antes del lock, y dos firmas simultáneas
    podrían ver las dos «sin firmar». El rol se mira **antes** que la fila (403 exista o no); si la fila no existe, el
    404 de siempre; si existe, la matriz sobre su expediente, con «No existe <nombre>» como cuerpo del 404. Registra el
    acceso igual que las rutas `/hce/{hce_id}/…` (`abrir_expediente`).
    """
    columna_id = modelo.id

    def dependencia(
        identificador: Annotated[int, Path(alias=parametro)],
        request: Request,
        usuario: Annotated[Profesional, Depends(usuario_actual)],
        registro_: RegistroPropio,
        db: Session = Depends(get_db),
    ) -> None:
        hce_id = db.scalar(select(modelo.hce_id).where(columna_id == identificador))
        accion = "hce.leer" if _es_lectura(request) else "hce.escribir"
        abrir_expediente(db, usuario, accion, hce_id, registro_, no_existe=f"No existe {nombre}")

    return dependencia


def permitido(accion: str):
    """La dependencia de las rutas **sin** expediente: 403 si el rol no puede `accion` (antes del cuerpo); devuelve la
    condición de su celda (`mis_grupos`, `institucion`, `agregado`…), que el servicio aplica."""

    def dependencia(usuario: Annotated[Profesional, Depends(usuario_actual)]) -> str | None:
        return matriz.exigir_rol(usuario, accion)

    return dependencia


idea_visible = _visible_por(Idea, "idea_id", "el IDEA")
protocolo_visible = _visible_por(Protocolo, "protocolo_id", "el protocolo")
informe_visible = _visible_por(InformeCierre, "informe_id", "el informe de cierre")
