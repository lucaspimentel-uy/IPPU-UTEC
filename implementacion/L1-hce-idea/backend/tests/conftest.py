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
from pathlib import Path

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


@pytest.fixture(scope="session")
def engine(_entorno_verificado):
    eng = create_engine(settings.test_database_url, pool_pre_ping=True)
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
