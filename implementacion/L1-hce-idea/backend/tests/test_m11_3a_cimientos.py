"""M11.3-a · cimientos de la capa de servicios.

Cubre lo que no es de un dominio: normalización de texto, auditoría de campo,
modelo de errores y su traducción a HTTP, y las dos reglas de arquitectura
(los servicios no importan FastAPI y no commitean). Cada rechazo va emparejado
con el caso que pasa.
"""
import ast
from datetime import date
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel
from sqlalchemy import select

from app.core import constantes
from app.models.identidad import HceDiurna, Persona
from app.models.transversales import Auditoria
from app.routers.errores import registrar_manejadores
from app.services.auditoria import registrar_cambios, valor_a_texto
from app.services.errores import (
    ConflictError, ForbiddenAction, NotFound, SignedModuleError, ValidationFailed,
)
from app.services.texto import normalizar_opcionales, normalizar_texto

SERVICIOS = Path(__file__).resolve().parent.parent / "app" / "services"


# ── Texto: '' y NULL son lo mismo; NULL es la forma canónica ─────────────────
@pytest.mark.parametrize("vacio", [None, "", "   ", "\t\n", " ", "  \t\r\n "])
def test_el_vacio_y_el_blanco_se_guardan_como_null(vacio):
    assert normalizar_texto(vacio) is None


@pytest.mark.parametrize("texto", ["texto", " texto ", "a", "0", "línea 1\nlínea 2 "])
def test_un_texto_con_contenido_se_guarda_sin_tocar(texto):
    assert normalizar_texto(texto) == texto


def test_normalizar_opcionales_solo_toca_las_claves_presentes():
    # En un PATCH, la ausencia de una clave es «no modificar»: agregarla con None la borraría.
    salida = normalizar_opcionales({"a": "  ", "b": "x"}, ("a", "b", "c"))
    assert salida == {"a": None, "b": "x"}
    assert "c" not in salida


# ── Auditoría de campo ───────────────────────────────────────────────────────
def _expediente(db_api) -> HceDiurna:
    p = Persona(nombre="Ana", apellido="Paz", ci="1.111.111-1", fecha_nac=date(2015, 1, 1))
    h = HceDiurna(persona=p)
    db_api.add_all([p, h])
    db_api.commit()
    return h


def test_dos_campos_cambiados_dejan_exactamente_dos_filas(db_api):
    h = _expediente(db_api)
    filas = registrar_cambios(
        db_api, modulo=constantes.MODULO_HCE_00, hce_id=h.id,
        antes={"diagnostico": "TEA", "cie11": "6A02", "alerta": None},
        despues={"diagnostico": "TEA nivel 2", "cie11": "6A02", "alerta": "alergia"},
    )
    assert len(filas) == 2
    por_campo = {f.campo: f for f in filas}
    assert (por_campo["diagnostico"].valor_ant, por_campo["diagnostico"].valor_nuevo) == ("TEA", "TEA nivel 2")
    assert (por_campo["alerta"].valor_ant, por_campo["alerta"].valor_nuevo) == (None, "alergia")
    assert all(f.tipo == "edicion" and f.modulo == "HCE-00" and f.hce_id == h.id for f in filas)
    assert db_api.scalar(select(Auditoria.id).where(Auditoria.hce_id == h.id).limit(1)) is not None


def test_sin_cambios_no_escribe_ninguna_fila(db_api):
    h = _expediente(db_api)
    filas = registrar_cambios(
        db_api, modulo=constantes.MODULO_HCE_00, hce_id=h.id,
        antes={"diagnostico": "TEA", "alerta": None}, despues={"diagnostico": "TEA", "alerta": None},
    )
    assert filas == []
    assert db_api.scalars(select(Auditoria).where(Auditoria.hce_id == h.id)).all() == []


def test_el_usuario_es_opcional_y_si_viene_se_guarda(db_api, crear_profesional):
    h = _expediente(db_api)
    sin = registrar_cambios(db_api, modulo="HCE-00", hce_id=h.id, antes={"a": 1}, despues={"a": 2})
    assert sin[0].usuario_id is None
    prof = crear_profesional()
    con = registrar_cambios(
        db_api, modulo="HCE-00", hce_id=h.id, antes={"a": 2}, despues={"a": 3}, usuario_id=prof.id,
    )
    assert con[0].usuario_id == prof.id


def test_un_evento_institucional_va_sin_expediente(db_api):
    filas = registrar_cambios(db_api, modulo="grupo", hce_id=None, antes={"x": "a"}, despues={"x": "b"})
    assert filas[0].hce_id is None


def test_los_valores_se_guardan_como_texto_legible():
    assert valor_a_texto(None) is None
    assert valor_a_texto(3) == "3"
    assert valor_a_texto(date(2020, 3, 1)) == "2020-03-01"
    assert valor_a_texto({"b": 1, "a": "ñ"}) == '{"a": "ñ", "b": 1}'


def test_los_codigos_de_modulo_entran_en_la_columna_y_no_se_repiten():
    codigos = {n: v for n, v in vars(constantes).items() if n.startswith("MODULO_HCE_")}
    assert constantes.MODULO_HCE_00 == "HCE-00"
    assert len(set(codigos.values())) == len(codigos)
    assert all(len(v) <= 20 for v in codigos.values()), "auditoria.modulo es String(20)"


# ── Errores → HTTP ───────────────────────────────────────────────────────────
class _Cuerpo(BaseModel):
    n: int


def _app_de_prueba() -> TestClient:
    app = FastAPI()
    registrar_manejadores(app)

    @app.get("/ok")
    def ok():
        return {"ok": True}

    @app.get("/conflicto")
    def conflicto():
        raise ConflictError("duplicado", [("persona.ci", "ya existe")])

    @app.get("/firmado")
    def firmado():
        raise SignedModuleError("El módulo está firmado")

    @app.get("/invalido")
    def invalido():
        raise ValidationFailed([("a", "mal"), ("b", "peor")])

    @app.get("/prohibido")
    def prohibido():
        raise ForbiddenAction("no")

    @app.get("/nada")
    def nada():
        raise NotFound("no está")

    @app.post("/cuerpo")
    def cuerpo(c: _Cuerpo):
        return c

    return TestClient(app)


def test_cada_error_de_dominio_tiene_su_status_y_un_solo_cuerpo():
    c = _app_de_prueba()
    assert c.get("/ok").status_code == 200  # el camino sin error no se toca
    esperado = {
        "/conflicto": (409, "conflict"),
        "/firmado": (409, "signed_module"),
        "/invalido": (422, "validation_error"),
        "/prohibido": (403, "forbidden"),
        "/nada": (404, "not_found"),
    }
    for ruta, (status, code) in esperado.items():
        r = c.get(ruta)
        assert r.status_code == status, ruta
        cuerpo = r.json()
        assert set(cuerpo) == {"code", "detail"}, ruta
        assert cuerpo["code"] == code
        assert isinstance(cuerpo["detail"], list) and cuerpo["detail"]
        assert all(set(d) == {"campo", "mensaje"} for d in cuerpo["detail"])


def test_validation_failed_lleva_un_detalle_por_campo():
    r = _app_de_prueba().get("/invalido")
    assert r.json()["detail"] == [
        {"campo": "a", "mensaje": "mal"}, {"campo": "b", "mensaje": "peor"},
    ]


def test_un_modulo_firmado_es_un_conflicto_con_codigo_propio():
    assert issubclass(SignedModuleError, ConflictError)
    assert SignedModuleError.code != ConflictError.code


def test_validation_failed_sin_problemas_es_un_error_de_programacion():
    with pytest.raises(ValueError):
        ValidationFailed([])


def test_la_validacion_de_fastapi_y_las_rutas_inexistentes_usan_el_mismo_cuerpo():
    c = _app_de_prueba()
    bien = c.post("/cuerpo", json={"n": 1})
    assert bien.status_code == 200
    mal = c.post("/cuerpo", json={"n": "no es número"})
    assert mal.status_code == 422
    assert mal.json()["code"] == "validation_error"
    assert mal.json()["detail"][0]["campo"] == "n"
    falta = c.get("/no-existe")
    assert falta.status_code == 404
    assert falta.json()["code"] == "http_error" and isinstance(falta.json()["detail"], list)


# ── Arquitectura: la regla de transacción y la de capas ──────────────────────
def _modulos_de_servicios():
    return sorted(p for p in SERVICIOS.glob("*.py"))


def test_los_servicios_no_importan_fastapi():
    for archivo in _modulos_de_servicios():
        arbol = ast.parse(archivo.read_text(encoding="utf-8"))
        for nodo in ast.walk(arbol):
            nombres = []
            if isinstance(nodo, ast.Import):
                nombres = [a.name for a in nodo.names]
            elif isinstance(nodo, ast.ImportFrom):
                nombres = [nodo.module or ""]
            assert not any(n.split(".")[0] in {"fastapi", "starlette"} for n in nombres), archivo.name
            assert not any(n.startswith("app.routers") for n in nombres), archivo.name


def test_los_servicios_no_commitean_ni_hacen_rollback():
    for archivo in _modulos_de_servicios():
        arbol = ast.parse(archivo.read_text(encoding="utf-8"))
        llamadas = {
            n.func.attr for n in ast.walk(arbol)
            if isinstance(n, ast.Call) and isinstance(n.func, ast.Attribute)
        }
        assert not llamadas & {"commit", "rollback"}, archivo.name
    assert _modulos_de_servicios(), "el test no está mirando nada"
