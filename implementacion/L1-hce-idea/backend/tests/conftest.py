"""Fixtures de pytest — base Postgres aislada, con guardia de entorno.

Usa `TEST_DATABASE_URL` (base `ippu_test`, que crea
`docker/initdb/00-crear-base-test.sql`). Nunca la base de desarrollo.

**Requiere el contenedor arriba: `docker compose up -d`. La suite lo verifica
sola** — ver abajo.

── Por qué existe `_entorno_verificado` (2026-08-15) ──────────────────────
Hasta hoy este archivo tenía, dentro de la fixture `engine`, un
`pytest.skip("Postgres de test no disponible…")`. Con el contenedor abajo la
corrida terminaba así:

    34 passed, 89 skipped in 8.81s        ← y **exit code 0**

Los `skip` **no estaban ocultos**: pytest imprime las `s`, el conteo de
salteados y, con `-rs`, el motivo completo de cada uno. El problema es otro y es
peor: **la corrida devuelve 0**, así que para CI, para `if ($?)` y para
cualquier automatización una sesión vacía es indistinguible de una válida; y el
renglón de resumen empieza con «34 passed», que de un vistazo se lee como verde.
El conteo que termina en la bitácora sale de ahí.

Con la guardia no hay término medio: **o la sesión corre entera, o no arranca**.
El `skip` se retiró y **no quedó como fallback a propósito** — convivir con los
dos reproduce el bug, porque el salteo gana cada vez que la guardia no prevé un
caso.

**Dos bases, no una.** Los tests que usan `db` corren contra la base de test, que
esta misma fixture construye con `create_all()` desde los modelos — no necesita
Alembic. Pero `test_la_migracion_coincide_con_los_modelos` compara los modelos
contra la base de **desarrollo**, que sí tiene que estar migrada. Por eso los
chequeos (b) y (c) miran `DATABASE_URL` y no `TEST_DATABASE_URL`. Ése era el
segundo `skip`, en `tests/test_esquema_v2.py`, y también se retiró.

**Sin literales.** El número de tablas y el identificador del head cambian con
cada sub-módulo de M12: el head se deriva de los archivos de migración en tiempo
de ejecución y las tablas se cuentan, no se comparan contra una constante.
"""
from contextlib import contextmanager
from datetime import date
import os
from pathlib import Path

# Clave fija para los JWT de la suite (§5.119 a: sin `SECRET_KEY` la app no arranca). Va **antes**
# de importar `app`, porque `settings` se construye al importar `app.core.config`; la variable de
# entorno le gana al `.env` de cada uno, así que la suite no depende de la clave local.
os.environ["SECRET_KEY"] = "clave-fija-de-la-suite-de-tests-no-usar-fuera-0123456789"
# La documentación (`/docs`, `/openapi.json`) sólo existe con ENVIRONMENT=dev (B12, §5.163 c) y varios tests la leen: un
# `.env` con otro valor no puede romper la suite.
os.environ["ENVIRONMENT"] = "dev"

import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base
import app.models  # noqa: F401  (registra las tablas en Base.metadata)

BACKEND = Path(__file__).resolve().parent.parent
_LINEA = "═" * 74

#: El marcador que **apaga** el atajo de la identidad de la suite (A2, §5.178 f): en un módulo que lo lleva
#: (`pytestmark = pytest.mark.matriz_real`), el `client` por omisión pasa por la matriz como cualquier coordinación.
MARCADOR_MATRIZ_REAL = "matriz_real"


def pytest_configure(config):
    config.addinivalue_line(
        "markers",
        f"{MARCADOR_MATRIZ_REAL}: la identidad por omisión de la suite NO saltea la matriz de acceso ni el registro de "
        "accesos (los módulos de acceso: test_a1_*, test_a1c_*, test_a2_*; §5.178 f).",
    )


def _sin_credenciales(url: str) -> str:
    """La URL como para pegarla en un mensaje: sin la contraseña."""
    return make_url(url).render_as_string(hide_password=True)


def _abortar(problema: str, detalle: str, arreglo: str) -> None:
    """Corta la sesión entera con un mensaje que dice qué hacer.

    `pytest.exit` con `returncode=1` es lo que hace que esto sea distinto de un
    `skip`: la corrida no produce un «passed» ni devuelve 0.
    """
    pytest.exit(
        "\n".join(
            [
                "",
                _LINEA,
                f" La suite NO se corrió: {problema}",
                _LINEA,
                detalle,
                "",
                " Arreglo:",
                *[f"     {linea}" for linea in arreglo.strip().splitlines()],
                "",
                " (Esto aborta en vez de saltear a propósito: una sesión salteada"
                "\n  devolvía exit 0 y se leía como verde. Ver tests/conftest.py.)",
                _LINEA,
                "",
            ]
        ),
        returncode=1,
    )


def _conecta(url: str) -> str | None:
    """Devuelve el error como texto, o `None` si la base responde."""
    eng = create_engine(url, pool_pre_ping=True)
    try:
        with eng.connect() as c:
            c.execute(text("SELECT 1"))
        return None
    except Exception as exc:  # noqa: BLE001
        return str(exc).strip().splitlines()[0]
    finally:
        eng.dispose()


def _head_de_los_archivos() -> str | None:
    """El head según `alembic/versions/`, derivado en tiempo de ejecución.

    Nunca un literal: cambia en cada sub-módulo de M12 (`handoff.md` §5.19
    regenera la migración inicial única al cerrar cada uno), y hardcodearlo acá
    sería deuda que hay que tocar en M12.5, M12.6, M12.7 y M12.8.
    """
    cfg = Config(str(BACKEND / "alembic.ini"))
    cfg.set_main_option("script_location", str(BACKEND / "alembic"))
    return ScriptDirectory.from_config(cfg).get_current_head()


@pytest.fixture(scope="session", autouse=True)
def _entorno_verificado():
    """Corre antes que cualquier test y aborta la sesión si algo no está listo.

    `autouse` + scope de sesión: pytest instancia las autouse de un scope antes
    que las demás, y `engine` además la pide explícitamente, así que no depende
    de ese orden.
    """
    dev, test = settings.database_url, settings.test_database_url

    # Guarda que ya existía: los tests hacen `drop_all`, así que apuntar a la
    # base de desarrollo por un `.env` mal copiado la borraría entera.
    if dev == test:
        _abortar(
            "TEST_DATABASE_URL apunta a la misma base que DATABASE_URL.",
            f" Las dos:  {_sin_credenciales(dev)}\n"
            f"\n"
            f" Los tests corren `drop_all()` sobre la base de test. Con esta\n"
            f" configuración borrarían la base de desarrollo.",
            "Revisar TEST_DATABASE_URL en el .env del backend.",
        )

    # (a) ¿Responde Postgres? Se miran las dos bases: la de test la usan los
    #     tests estructurales, la de desarrollo el test de coincidencia
    #     modelos ↔ migración.
    for etiqueta, url in ((" de test", test), (" de desarrollo", dev)):
        error = _conecta(url)
        if error:
            _abortar(
                f"Postgres no responde (base{etiqueta}).",
                f" Base:   {_sin_credenciales(url)}\n"
                f" Error:  {error}",
                "cd implementacion/L1-hce-idea/backend\n"
                "docker compose up -d",
            )

    # (b) Responde, pero ¿tiene esquema? Sólo aplica a la base de desarrollo:
    #     la de test la construye `engine` con `create_all()` desde los modelos.
    eng = create_engine(dev)
    try:
        with eng.connect() as c:
            tablas = c.execute(
                text(
                    "SELECT count(*) FROM information_schema.tables "
                    "WHERE table_schema = 'public' AND table_name <> 'alembic_version'"
                )
            ).scalar()
            if not tablas:
                _abortar(
                    "la base de desarrollo está vacía (0 tablas).",
                    f" Base:  {_sin_credenciales(dev)}\n"
                    f"\n"
                    f" `test_la_migracion_coincide_con_los_modelos` compara los\n"
                    f" modelos contra esta base: sin esquema aplicado no hay con qué.",
                    "cd implementacion/L1-hce-idea/backend\n"
                    "alembic upgrade head\n"
                    "python -m app.seed_catalogos",
                )

            # (c) Tiene esquema — ¿está en el head actual?
            head = _head_de_los_archivos()
            existe = c.execute(text("SELECT to_regclass('public.alembic_version')")).scalar()
            aplicada = (
                c.execute(text("SELECT version_num FROM alembic_version")).scalar()
                if existe
                else None
            )
            if aplicada != head:
                _abortar(
                    "la base de desarrollo no está en el head actual.",
                    f" Base:      {_sin_credenciales(dev)}\n"
                    f" Aplicada:  {aplicada or '(ninguna — falta alembic_version)'}\n"
                    f" Head:      {head or '(no hay migraciones en alembic/versions/)'}\n"
                    f"\n"
                    f" Con la base atrasada, el test de coincidencia modelos ↔ migración\n"
                    f" reporta diferencias que no son un desfasaje real.",
                    "cd implementacion/L1-hce-idea/backend\n"
                    "alembic upgrade head\n"
                    "python -m app.seed_catalogos",
                )
    finally:
        eng.dispose()

    yield


@pytest.fixture(autouse=True)
def carpeta_uploads(tmp_path, monkeypatch) -> Path:
    """**pytest nunca escribe en la carpeta real de archivos** (C5, §5.155 a): cada test apunta `uploads_dir` a una
    carpeta temporal propia. La raíz efectiva es `<esto>/<nombre de la base de DATABASE_URL>`."""
    carpeta = tmp_path / "uploads"
    monkeypatch.setattr(settings, "uploads_dir", str(carpeta))
    return carpeta


@pytest.fixture(scope="session")
def engine(_entorno_verificado):
    # `hide_parameters=True`, como el engine de la app (B8): un error de un test no llena el log de valores.
    eng = create_engine(settings.test_database_url, pool_pre_ping=True, hide_parameters=True)
    Base.metadata.drop_all(eng)
    Base.metadata.create_all(eng)
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine):
    """Sesión por test, con rollback al terminar: los tests no se contaminan."""
    conexion = engine.connect()
    trans = conexion.begin()
    sesion = sessionmaker(bind=conexion, autocommit=False, autoflush=False)()
    try:
        yield sesion
    finally:
        sesion.close()
        # Un test que provoca IntegrityError deja la transacción ya abortada por
        # Postgres; sin este chequeo, el rollback explícito emite un SAWarning.
        if trans.is_active:
            trans.rollback()
        conexion.close()


# ── API (M11.3-a) ────────────────────────────────────────────────────────────
# Los tests de la API necesitan que **el router pueda commitear sin que el commit
# escape del test**, y que un request rechazado (409/422) **no deje la sesión
# envenenada** para el siguiente request del mismo test.
#
# La fixture `db` de arriba no sirve para eso: su sesión, atada a una conexión que
# ya está en una transacción, **ignora el `commit()`** y su `rollback()` deshace
# la transacción entera —incluidos los datos que el test preparó—. Acá, en cambio,
# cada sesión usa `join_transaction_mode="create_savepoint"`: su `commit()` libera
# un SAVEPOINT (los datos quedan visibles para las demás sesiones de la misma
# conexión) y su `rollback()` vuelve sólo hasta el SAVEPOINT. Al terminar el test,
# el rollback de la transacción externa lo deshace todo.
#
# `db` y esta familia no se mezclan en un mismo test: `db` tiene su propia conexión.
#: La conexión del escenario **de módulo** que esté abierto (`conexion_modulo`), o `None`. Ver `conexion_api`.
_CONEXION_DE_MODULO: list = []


@pytest.fixture(scope="module")
def conexion_modulo(engine):
    """La conexión de un escenario que dura **todo el módulo** (el `mundo` de `test_a1_matriz.py`): una transacción
    externa que se deshace al final. Mientras está abierta, `conexion_api` no abre otra: usa ésta (ver ahí por qué)."""
    conexion = engine.connect()
    externa = conexion.begin()
    _CONEXION_DE_MODULO.append(conexion)
    try:
        yield conexion
    finally:
        _CONEXION_DE_MODULO.remove(conexion)
        if externa.is_active:
            externa.rollback()
        conexion.close()


@pytest.fixture
def conexion_api(engine):
    """La conexión del test, dentro de una transacción que se deshace al terminar.

    **Si el módulo tiene un escenario abierto (`conexion_modulo`), es esa misma conexión**, con un SAVEPOINT por test
    (A2, §5.178 g). Antes eran dos: el escenario de módulo dejaba los catálogos sembrados en su transacción, sin
    commitear, y una fixture por test (`tramos`) insertaba las mismas claves únicas de `delta_interpretacion` desde la
    otra. Postgres hace esperar al segundo INSERT hasta que termine la primera transacción —para saber si la clave
    quedó o no— y la primera es una fixture del mismo hilo, que no termina hasta el fin del módulo: pytest quedaba
    colgado para siempre (§5.174 f). Con una sola conexión nadie espera a nadie."""
    if _CONEXION_DE_MODULO:
        conexion = _CONEXION_DE_MODULO[-1]
        del_test = conexion.begin_nested()
        try:
            yield conexion
        finally:
            if del_test.is_active:
                del_test.rollback()
        return
    conexion = engine.connect()
    externa = conexion.begin()
    try:
        yield conexion
    finally:
        if externa.is_active:
            externa.rollback()
        conexion.close()


def _fabrica_sesiones(conexion):
    return sessionmaker(
        bind=conexion, autocommit=False, autoflush=False,
        join_transaction_mode="create_savepoint",
    )


@contextmanager
def sesiones_inyectadas(Sesion):
    """Apunta la app a `Sesion` **para las dos sesiones que usa un pedido**: la del pedido (`get_db`, una por request) y
    la del registro de accesos (`fabrica_registro`, A2, §5.178). Al salir deja lo que había (no un `pop`: un `client`
    dentro de un módulo con `mundo` no le saca la inyección al módulo).

    Sobre la conexión única de la suite, la del registro es otro SAVEPOINT de la misma conexión: sirve para ver **qué
    fila queda**; no es otra transacción ni puede esperar un candado. Lo que eso prueba y lo que no: docstring de
    `app/services/registro_accesos.py`; lo demás, en `tests/test_a2_registro_real.py`."""
    from app.core.database import fabrica_registro, get_db
    from app.main import app

    def _get_db():
        sesion = Sesion()
        try:
            yield sesion
        finally:
            sesion.close()

    antes = {d: app.dependency_overrides.get(d) for d in (get_db, fabrica_registro)}
    app.dependency_overrides[get_db] = _get_db
    app.dependency_overrides[fabrica_registro] = lambda: Sesion
    try:
        yield
    finally:
        for dependencia, valor in antes.items():
            if valor is None:
                app.dependency_overrides.pop(dependencia, None)
            else:
                app.dependency_overrides[dependencia] = valor


def _registro_sin_inyectar():
    raise AssertionError(
        "Este test hizo un pedido que escribe en el registro de accesos sin inyectar su sesión: la de producción "
        "(`SessionLocal`) apunta a la base de DATABASE_URL, no a la de test. Usar `client`, `sesiones_inyectadas(Sesion)` "
        "o `app.dependency_overrides[fabrica_registro]` (tests/conftest.py, §5.178)."
    )


@pytest.fixture(autouse=True)
def _registro_de_accesos_nunca_en_la_base_de_desarrollo():
    """**La sesión del registro de accesos de producción no se usa en la suite** (A2, §5.178): `fabrica_registro`
    devuelve `SessionLocal`, que escribe —con commit— en la base de `DATABASE_URL`. Un test que reemplaza `get_db` por
    su cuenta y se olvida de `fabrica_registro` escribiría ahí; con esto falla y dice qué falta."""
    from app.core.database import fabrica_registro
    from app.main import app

    puesta = fabrica_registro not in app.dependency_overrides
    if puesta:
        app.dependency_overrides[fabrica_registro] = lambda: _registro_sin_inyectar
    yield
    if puesta and app.dependency_overrides.get(fabrica_registro) is not None:
        if app.dependency_overrides[fabrica_registro]() is _registro_sin_inyectar:
            app.dependency_overrides.pop(fabrica_registro, None)


@pytest.fixture
def db_api(conexion_api):
    """Sesión del test para **preparar datos y verificar** lo que dejó la API.

    Para leer lo que cambió la API, `db_api.expire_all()` primero o consultar
    columnas (`db_api.scalar(select(Persona.ci)...)`): el mapa de identidad de esta
    sesión no se entera de lo que escribieron las sesiones de los requests.
    """
    sesion = _fabrica_sesiones(conexion_api)()
    try:
        yield sesion
    finally:
        sesion.close()


# ── Login (M11.3-d1, §5.101) ─────────────────────────────────────────────────
# Toda ruta salvo `/health` y `/auth/login` pide token. Para que la suite anterior al login
# siga diciendo lo mismo, **`client` entra como `admin` por omisión**: un profesional real
# (las filas de `auditoria` lo referencian por FK) con la cabecera `Authorization` ya puesta.
# Los tests de alcance usan `token_de(profesional)` para otra identidad, o `sin_token`.
#
# El hash se calcula **una vez por sesión** y con el costo mínimo de bcrypt: con el costo
# por omisión (12), hashear en cada test sumaría minutos a la corrida.
PASSWORD_TEST = "clave-de-prueba"
EMAIL_ADMIN = "admin@ippu.test"


@pytest.fixture(scope="session")
def hash_test() -> str:
    import bcrypt

    return bcrypt.hashpw(PASSWORD_TEST.encode(), bcrypt.gensalt(rounds=4)).decode()


@pytest.fixture
def admin(conexion_api, hash_test):
    """El `admin` con el que entra `client`. Nombre «Admin de prueba»: va al final de las listas por nombre."""
    from app.models.identidad import Profesional

    sesion = _fabrica_sesiones(conexion_api)()
    try:
        p = Profesional(
            nombre="Zz Admin de prueba", email=EMAIL_ADMIN, rol="coordinacion", activo=True, hashed_password=hash_test,
        )
        sesion.add(p)
        sesion.commit()
        sesion.refresh(p)
        sesion.expunge(p)
        return p
    finally:
        sesion.close()


#: Las otras identidades «como el `admin` de antes» de la suite: las de los tests de concurrencia, que necesitan dos
#: sesiones con el mismo alcance que la por omisión (su email termina así). Ver `_identidad_de_la_suite_sin_matriz`.
SUFIJO_SUITE = "@suite.ippu.test"


def es_identidad_de_la_suite(usuario) -> bool:
    email = getattr(usuario, "email", None) or ""
    return email == EMAIL_ADMIN or email.endswith(SUFIJO_SUITE)


@pytest.fixture(autouse=True)
def _identidad_de_la_suite_sin_matriz(request):
    """**La identidad por omisión de la suite (`EMAIL_ADMIN`) pasa la matriz de acceso** (Fase 4, A1, §5.165).

    Hasta A1 esa identidad era el `admin`, que leía y escribía todo, y ~1000 pedidos de la suite cargan y leen módulos
    clínicos con ella (sobre expedientes sin grupo, que no tienen tratante). Desde A1 su rol es `coordinacion`, que **no**
    escribe lo clínico y lee con motivo: reescribir cada test como tratante no cambiaría lo que prueba (la lógica de cada
    módulo). Así que, **sólo en los tests y sólo para esa identidad**, la única función de la matriz (`matriz.celda`)
    devuelve «permitir en la institución», lo que el `admin` tenía.

    **El acceso se prueba aparte y sin esto:** `tests/test_a1_matriz.py` recorre cada fila del CSV de la matriz con
    usuarios propios (tratante, no tratante, coordinación, administrativo, dirección no técnica), igual que los tests de
    alcance que entran con `token_de(otro)`. Ningún código de la aplicación sabe de esta fixture.

    **Tampoco deja filas automáticas en el registro de accesos** (A2, §5.178 f): quien saltea la matriz no «abre»
    nada que haya que registrar, y esos ~1000 pedidos no tienen que escribir `acceso_hce`.

    **El marcador `matriz_real` la apaga** (A2, §5.178 f): los módulos de acceso (`test_a1_*`, `test_a1c_*`,
    `test_a2_*`) lo llevan en `pytestmark`, así que ahí un test que use el `client` por omisión **ejerce** la matriz
    —como la coordinación sin grupos que es— en vez de saltearla.

    Usa su **propio** `MonkeyPatch`: un test que hace `monkeypatch.undo()` no la deshace."""
    if request.node.get_closest_marker(MARCADOR_MATRIZ_REAL) is not None:
        yield
        return

    from app.services import matriz

    original = matriz.celda
    al_abrir, por_ateneo = matriz.registro_al_abrir, matriz.registro_por_ateneo

    def celda(usuario, accion, **kw):
        if es_identidad_de_la_suite(usuario):
            return "permitir@institucion"
        return original(usuario, accion, **kw)

    def registro_al_abrir(usuario, accion, hce):
        return None if es_identidad_de_la_suite(usuario) else al_abrir(usuario, accion, hce)

    def registro_por_ateneo(db, usuario, hce_referida_id):
        return None if es_identidad_de_la_suite(usuario) else por_ateneo(db, usuario, hce_referida_id)

    parche = pytest.MonkeyPatch()
    parche.setattr(matriz, "celda", celda)
    parche.setattr(matriz, "registro_al_abrir", registro_al_abrir)
    parche.setattr(matriz, "registro_por_ateneo", registro_por_ateneo)
    yield
    parche.undo()


@pytest.fixture
def token_de():
    """`token_de(profesional)` → cabeceras `{"Authorization": "Bearer …"}` de ese profesional."""
    from app.core.seguridad import crear_token

    def _cabeceras(profesional) -> dict[str, str]:
        return {"Authorization": f"Bearer {crear_token(profesional.id)}"}

    return _cabeceras


@pytest.fixture
def client(conexion_api, admin, token_de):
    """`TestClient` con `get_db` apuntando a la conexión del test (una sesión por request),
    autenticado como `admin` (cabecera por omisión; un request la pisa con `headers=`)."""
    from fastapi.testclient import TestClient

    from app.main import app

    with sesiones_inyectadas(_fabrica_sesiones(conexion_api)):
        yield TestClient(app, headers=token_de(admin))


# La base de test se arma con `create_all()`: **no tiene catálogos sembrados**. Los
# tests que necesitan un grupo o un profesional lo crean con estas fábricas.
@pytest.fixture
def crear_profesional(db_api):
    contador = iter(range(1, 10_000))

    def _crear(**campos):
        from app.models.identidad import Profesional

        n = next(contador)
        datos = {"nombre": f"Profesional {n}", "email": f"prof{n}@ippu.test", "rol": "tecnico"}
        datos.update(campos)
        p = Profesional(**datos)
        db_api.add(p)
        db_api.commit()
        return p

    return _crear


@pytest.fixture
def crear_grupo(db_api):
    contador = iter(range(1, 10_000))

    def _crear(**campos):
        from app.models.identidad import Grupo

        n = next(contador)
        datos = {"nombre": f"Grupo {n}", "anio": date.today().year}  # el año en curso: es el que la búsqueda asume
        datos.update(campos)
        g = Grupo(**datos)
        db_api.add(g)
        db_api.commit()
        return g

    return _crear


#: Piso, no cifra exacta: la app tiene 95 rutas (2026-11-16); una ruta más o menos no debe romper esto.
RUTAS_MINIMAS = 60


def rutas_api():
    """Cada ruta real de la app (un `RouteContext`: `.path` completo, `.methods`, `.endpoint`), sin las de Starlette
    (`/docs`, `/openapi.json`).

    **No recorrer `app.routes`** (§5.177): desde FastAPI 0.16x los routers incluidos son `_IncludedRouter` perezosos y
    `app.routes` ya no trae las rutas: un barrido sobre él ve 0 y pasa en vacío (o falla con «0 > 60»). Lo mismo que usa
    FastAPI para armar `openapi.json`."""
    from fastapi.routing import APIRoute, iter_route_contexts

    from app.main import app

    rutas = [c for c in iter_route_contexts(app.routes) if isinstance(c.original_route, APIRoute)]
    if len(rutas) < RUTAS_MINIMAS:
        raise AssertionError(
            f"rutas_api() encontró {len(rutas)} rutas (la app tiene más de {RUTAS_MINIMAS}): cambió la forma de recorrer "
            f"las rutas de FastAPI (`app.routes` / `iter_route_contexts`). Un barrido sobre 0 rutas pasaría en vacío: "
            f"ajustar esta función (§5.177 f)."
        )
    return rutas
