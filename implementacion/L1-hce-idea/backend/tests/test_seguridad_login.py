"""Auditoría de seguridad M3 (§5.157 c): el login con una contraseña de más de 72 bytes gasta un bcrypt.

Antes, `verificar_password` devolvía `False` sin correr bcrypt para más de 72 bytes, mientras que un email
inexistente gasta uno (`gastar_verificacion`): un email existente con 100 bytes contestaba en ~13 ms y uno
inexistente en ~290 ms, y el tiempo decía qué emails existen (contra §5.119). Se cuentan las llamadas a
`bcrypt.checkpw`: **una** en cada camino que termina en 401.
"""
import bcrypt
import pytest
from fastapi.testclient import TestClient

from app.core import seguridad
from app.main import app
from tests.conftest import EMAIL_ADMIN, PASSWORD_TEST

LARGA = "ñ" * 50   # 100 bytes en UTF-8


@pytest.fixture
def llamadas(monkeypatch) -> list:
    hechas: list = []
    original = bcrypt.checkpw

    def _contada(*a, **k):
        hechas.append(a)
        return original(*a, **k)

    monkeypatch.setattr(seguridad.bcrypt, "checkpw", _contada)
    return hechas


@pytest.fixture
def sin_token(client) -> TestClient:
    return TestClient(app)


def _login(c: TestClient, email: str, password: str):
    return c.post("/auth/login", json={"email": email, "password": password})


def test_un_email_existente_con_una_contrasena_de_100_bytes_es_401_tras_un_bcrypt(sin_token, llamadas):
    assert len(LARGA.encode()) == 100
    r = _login(sin_token, EMAIL_ADMIN, LARGA)
    assert r.status_code == 401
    assert len(llamadas) == 1


def test_un_email_inexistente_con_100_bytes_tambien_gasta_un_bcrypt(sin_token, llamadas):
    r = _login(sin_token, "nadie@ippu.test", LARGA)
    assert r.status_code == 401
    assert len(llamadas) == 1


def test_los_dos_401_dicen_lo_mismo(sin_token):
    a, b = _login(sin_token, EMAIL_ADMIN, LARGA), _login(sin_token, "nadie@ippu.test", LARGA)
    assert a.status_code == b.status_code == 401 and a.json() == b.json()


def test_la_contrasena_correcta_pasa_y_una_corta_equivocada_es_401_con_un_bcrypt(sin_token, llamadas):
    assert _login(sin_token, EMAIL_ADMIN, PASSWORD_TEST).status_code == 200
    assert len(llamadas) == 1
    llamadas.clear()
    assert _login(sin_token, EMAIL_ADMIN, "otra-clave").status_code == 401
    assert len(llamadas) == 1


def test_verificar_password_nunca_lanza_y_mas_de_72_bytes_es_false(hash_test, llamadas):
    assert seguridad.verificar_password("x" * 73, hash_test) is False
    assert seguridad.verificar_password(PASSWORD_TEST + "x" * 80, hash_test) is False   # un prefijo correcto no alcanza
    assert seguridad.verificar_password(PASSWORD_TEST, hash_test) is True
    assert seguridad.verificar_password(PASSWORD_TEST, "no-es-un-hash") is False
    assert len(llamadas) == 4
