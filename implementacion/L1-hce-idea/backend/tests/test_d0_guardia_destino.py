"""D0 · guardia de destino de `app.seed_demo` y `app.crear_usuario` (`handoff.md` §5.139).

Sin `IPPU_SEED_DESTINO` igual al nombre de la base de `DATABASE_URL`, la CLI imprime el destino y sale con 1
**sin escribir**. Con la variable igual, corre. Las CLI se llaman por su `main()`; la base a la que escribirían
se apunta a la de test con `SessionLocal` (lo que cuenta es que no llega a abrirse ninguna sesión).
"""
import pytest
from sqlalchemy import func, select

from app.core import destino
from app.core.destino import VARIABLE, base_destino
from app.models.identidad import Profesional
from tests.conftest import _fabrica_sesiones


@pytest.fixture
def entorno(monkeypatch):
    for nombre in (VARIABLE, "IPPU_EMAIL", "IPPU_PASSWORD", "IPPU_DEMO_PASSWORD"):
        monkeypatch.delenv(nombre, raising=False)
    monkeypatch.setenv("IPPU_EMAIL", "nuevo@ippu.test")
    monkeypatch.setenv("IPPU_PASSWORD", "clave-de-prueba")
    return monkeypatch


@pytest.fixture
def sesiones_de_test(entorno, conexion_api):
    """`SessionLocal` apuntada a la base de test (savepoints: nada escapa del test) y bcrypt barato."""
    import bcrypt

    import app.core.database
    import app.crear_usuario

    sesiones = _fabrica_sesiones(conexion_api)
    entorno.setattr(app.core.database, "SessionLocal", sesiones)
    entorno.setattr(
        app.crear_usuario, "hashear_password",
        lambda p: bcrypt.hashpw(p.encode(), bcrypt.gensalt(rounds=4)).decode(),
    )
    return sesiones


def _profesionales(sesiones) -> int:
    with sesiones() as db:
        return db.scalar(select(func.count(Profesional.id)))


# ── el nombre de la base sale de la configuración efectiva ───────────────────
def test_base_destino_es_el_nombre_de_la_base_de_database_url(monkeypatch):
    monkeypatch.setattr(destino.settings, "database_url", "postgresql+psycopg://ippu:secreta@localhost:5440/ippu_presentacion")
    assert base_destino() == "ippu_presentacion"


def test_el_destino_impreso_no_lleva_la_contrasena(entorno, capsys):
    entorno.setattr(destino.settings, "database_url", "postgresql+psycopg://ippu:secreta@localhost:5440/ippu_x")
    assert destino.confirmar_destino(api="http://localhost:8001") is False
    salida = capsys.readouterr()
    assert "ippu_x" in salida.out and "http://localhost:8001" in salida.out
    assert "secreta" not in salida.out + salida.err


# ── crear_usuario ────────────────────────────────────────────────────────────
ARGS_USUARIO = ["--email", "nuevo@ippu.test", "--nombre", "Nuevo", "--rol", "admin"]


@pytest.mark.parametrize("valor", [None, "", "otra_base", "IPPU", "ippu "], ids=["sin definir", "vacía", "otra", "otra caja", "con espacio"])
def test_crear_usuario_sin_la_variable_o_distinta_sale_con_1_y_no_escribe(sesiones_de_test, entorno, capsys, valor):
    from app.crear_usuario import main

    if valor is not None:
        entorno.setenv(VARIABLE, valor)
    antes = _profesionales(sesiones_de_test)
    assert main(ARGS_USUARIO) == 1
    assert _profesionales(sesiones_de_test) == antes
    salida = capsys.readouterr()
    assert f"«{base_destino()}»" in salida.out and "No se escribió nada" in salida.err


def test_crear_usuario_con_la_variable_igual_crea_el_usuario(sesiones_de_test, entorno, capsys):
    from app.crear_usuario import main

    entorno.setenv(VARIABLE, base_destino())
    antes = _profesionales(sesiones_de_test)
    assert main(ARGS_USUARIO) == 0, capsys.readouterr().err
    assert _profesionales(sesiones_de_test) == antes + 1


# ── seed_demo ────────────────────────────────────────────────────────────────
@pytest.fixture
def seed_espiado(entorno):
    """Reemplaza el cliente HTTP y `ejecutar`: registra si la CLI llegó a tocar la red o a ejecutar el seed."""
    import httpx

    import app.seed_demo

    llamadas = []

    class _Cliente:
        def __init__(self, *a, **kw):
            llamadas.append("cliente")

        def __enter__(self):
            return self

        def __exit__(self, *exc):
            return False

        def get(self, ruta):
            class _R:
                def raise_for_status(self):
                    return None
            return _R()

    entorno.setattr(httpx, "Client", _Cliente)
    entorno.setattr(app.seed_demo, "ejecutar", lambda *a, **kw: llamadas.append("ejecutar") or 0)
    return llamadas


@pytest.mark.parametrize("valor", [None, "", "otra_base"], ids=["sin definir", "vacía", "otra"])
def test_seed_demo_sin_la_variable_o_distinta_sale_con_1_sin_red_ni_base(seed_espiado, entorno, capsys, valor):
    from app.seed_demo import main

    if valor is not None:
        entorno.setenv(VARIABLE, valor)
    assert main(["--url", "http://localhost:8001"]) == 1
    assert seed_espiado == []  # ni cliente HTTP ni seed
    salida = capsys.readouterr()
    assert f"«{base_destino()}»" in salida.out and "http://localhost:8001" in salida.out
    assert "No se escribió nada" in salida.err


def test_seed_demo_con_la_variable_igual_corre(seed_espiado, entorno):
    from app.seed_demo import main

    entorno.setenv(VARIABLE, base_destino())
    assert main(["--url", "http://localhost:8001"]) == 0
    assert seed_espiado == ["cliente", "ejecutar"]
