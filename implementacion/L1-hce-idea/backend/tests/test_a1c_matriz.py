"""A1c (§5.174) · lo que la auditoría dinámica del 2026-11-13 encontró en la matriz de A1 y la suite no atrapaba.

Todo con **usuarios reales** (no la identidad de la suite, que pasa la matriz: `conftest._identidad_de_la_suite_sin_matriz`)
y cada rechazo junto al caso que pasa.

1. **El orden de `POST /hce/{id}/accesos`** (hallazgo 2). Se valida *todo* el cuerpo y recién después se compara la C.I.:
   con un motivo inválido, la C.I. correcta y la equivocada reciben **el mismo 422**; con un motivo válido y una C.I.
   equivocada, el 404 de un id que no existe; sólo con motivo y C.I. válidos se abre la ventana (una fila). Ningún
   rechazo deja una fila: la única forma de confirmar una C.I. es abrir una ventana, y eso queda registrado.
2. **Coordinación asignada a un grupo es tratante** (hallazgo 3a): en cada ruta `{hce_id}` del CSV le toca la celda del
   sujeto `tratante`, sin pedir motivo.
3. **Sólo las filas `no_tratante` y `supervision` abren la lectura** (hallazgo 3b): una fila de `gestion`, `titular` o
   `tratante` vigente, del mismo usuario y expediente, no abre nada.
4. (Los ids no canónicos de las 14 rutas por id de módulo, en `test_a1c_matriz_ids.py`: ver su docstring.)
5. **Una ventana sólo abre si su relación es la del rol actual** (si cambia el rol, la ventana vieja no vale).

Las pruebas 2 y 3 se verificaron contra mutantes (la coordinación nunca es tratante; cualquier fila de `acceso_hce` abre
la ventana): ver §5.174.
"""

import pytest
from sqlalchemy import select, text

# El escenario de A1 (`mundo`: siete usuarios, un expediente H con todos sus módulos, dos ventanas) y sus ayudas.
from test_a1_matriz import (  # noqa: F401  (carpeta_uploads y mundo: fixtures)
    FILAS, _abrir, _afirmar, _borrar_ventanas, carpeta_uploads, mundo,
)

from app.core.seguridad import crear_token
from app.models.identidad import Profesional

CI_DE_H = "5.789.123-4"
CI_OTRA = "1.234.567-8"


def _filas_de(m, sujeto: str) -> int:
    with m["Sesion"]() as s:
        return s.scalar(text("SELECT count(*) FROM acceso_hce WHERE usuario_id = :u"), {"u": m["ids"][sujeto]})


def _inexistente(m, sujeto: str, cuerpo: dict):
    return _abrir(m, sujeto, cuerpo, hce_id=999999)


# ── 1 · El orden de POST /hce/{id}/accesos ────────────────────────────────────
@pytest.mark.parametrize("cuerpo", [
    pytest.param({"motivo_codigo": "no-existe"}, id="motivo-fuera-del-catalogo"),
    pytest.param({"motivo_codigo": None}, id="sin-motivo"),
    pytest.param({"motivo_codigo": "supervision"}, id="motivo-de-otra-relacion"),
    pytest.param({"motivo_codigo": "otro"}, id="otro-sin-texto"),
    pytest.param({"motivo_codigo": "interconsulta", "motivo_texto": "x" * 501}, id="texto-largo"),
    pytest.param({"motivo_codigo": "no-existe", "motivo_texto": "x" * 501}, id="motivo-y-texto"),
])
def test_con_un_motivo_invalido_la_ci_correcta_y_la_equivocada_reciben_el_mismo_422_y_no_queda_fila(mundo, cuerpo):
    antes = _filas_de(mundo, "nt_sin_motivo")
    correcta = _abrir(mundo, "nt_sin_motivo", {**cuerpo, "ci": CI_DE_H})
    equivocada = _abrir(mundo, "nt_sin_motivo", {**cuerpo, "ci": CI_OTRA})
    assert correcta.status_code == 422, correcta.text
    assert (equivocada.status_code, equivocada.json()) == (correcta.status_code, correcta.json())
    assert "ci" not in {d["campo"] for d in correcta.json()["detail"]}  # la C.I. no se discute: no se compara todavía
    assert _filas_de(mundo, "nt_sin_motivo") == antes == 0


def test_sin_ci_y_con_motivo_invalido_los_dos_errores_salen_juntos_en_un_solo_422(mundo):
    r = _abrir(mundo, "nt_sin_motivo", {"motivo_codigo": "no-existe", "motivo_texto": "x" * 501})
    assert r.status_code == 422
    assert [d["campo"] for d in r.json()["detail"]] == ["motivo_codigo", "ci", "motivo_texto"]
    assert _filas_de(mundo, "nt_sin_motivo") == 0
    # el par: sólo el motivo mal → un solo error; sólo la C.I. sin mandar → un solo error
    assert [d["campo"] for d in _abrir(mundo, "nt_sin_motivo", {"motivo_codigo": "no-existe", "ci": CI_DE_H}).json()["detail"]] == ["motivo_codigo"]
    assert [d["campo"] for d in _abrir(mundo, "nt_sin_motivo", {"motivo_codigo": "interconsulta"}).json()["detail"]] == ["ci"]
    assert [d["campo"] for d in _abrir(mundo, "nt_sin_motivo", {"motivo_codigo": "interconsulta", "ci": "   "}).json()["detail"]] == ["ci"]


def test_con_un_motivo_valido_y_la_ci_equivocada_es_el_404_de_un_id_que_no_existe_y_no_queda_fila(mundo):
    inexistente = _inexistente(mundo, "nt_sin_motivo", {"motivo_codigo": "interconsulta", "ci": CI_DE_H})
    assert inexistente.status_code == 404
    for ci in (CI_OTRA, "5.789.123-5", "5789123", "578912345"):
        r = _abrir(mundo, "nt_sin_motivo", {"motivo_codigo": "interconsulta", "ci": ci})
        assert (r.status_code, r.json()) == (404, inexistente.json()), ci
    assert _filas_de(mundo, "nt_sin_motivo") == 0
    assert mundo["cliente"].get(f"/hce/{mundo['e']['hce_id']}", headers=mundo["cab"]["nt_sin_motivo"]).status_code == 403


def test_con_motivo_y_ci_validos_es_201_y_una_fila_y_abre_la_lectura(mundo):
    try:
        r = _abrir(mundo, "nt_sin_motivo", {"motivo_codigo": "interconsulta", "ci": "5.789.123-4"})
        assert r.status_code == 201, r.text
        assert r.json()["data"]["relacion"] == "no_tratante"
        assert _filas_de(mundo, "nt_sin_motivo") == 1
        assert mundo["cliente"].get(f"/hce/{mundo['e']['hce_id']}", headers=mundo["cab"]["nt_sin_motivo"]).status_code == 200
    finally:
        _borrar_ventanas(mundo, "nt_sin_motivo")


def test_coordinacion_no_cambia_no_manda_ci_y_si_la_manda_no_se_mira(mundo):
    try:
        for ci in ({}, {"ci": CI_DE_H}, {"ci": CI_OTRA}, {"ci": "cualquiera"}):
            r = _abrir(mundo, "coord_sin_motivo", {"motivo_codigo": "no-existe", **ci})
            assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["motivo_codigo"], (ci, r.text)
        assert _filas_de(mundo, "coord_sin_motivo") == 0
        for ci in ({}, {"ci": CI_OTRA}):
            r = _abrir(mundo, "coord_sin_motivo", {"motivo_codigo": "supervision", **ci})
            assert r.status_code == 201 and r.json()["data"]["relacion"] == "supervision", (ci, r.text)
        assert _filas_de(mundo, "coord_sin_motivo") == 2
        assert _inexistente(mundo, "coord_sin_motivo", {"motivo_codigo": "supervision"}).status_code == 404
    finally:
        _borrar_ventanas(mundo, "coord_sin_motivo")


# ── 2 · Coordinación asignada a un grupo es tratante ──────────────────────────
@pytest.fixture
def coordinadora_tratante(mundo):
    """Cleo (coordinación) como técnica 2 de **Uno**, el grupo de H; al terminar, el grupo queda como estaba."""
    m = mundo
    with m["Sesion"]() as s:
        cleo = s.scalar(select(Profesional).where(Profesional.email == "cleo@a1c.ippu.test"))
        if cleo is None:  # se crea una vez por módulo (la transacción externa de `mundo` la deshace al final)
            cleo = Profesional(nombre="Cleo", email="cleo@a1c.ippu.test", rol="coordinacion", activo=True,
                               hashed_password=s.get(Profesional, m["ids"]["tratante"]).hashed_password,
                               especialidad="Psicología")
            s.add(cleo)
            s.flush()
        s.execute(text("UPDATE grupo SET tecnico2_id = :c WHERE id = :g"), {"c": cleo.id, "g": m["e"]["grupo_id"]})
        s.commit()
        cleo_id = cleo.id
    yield {"Authorization": f"Bearer {crear_token(cleo_id)}"}, cleo_id
    with m["Sesion"]() as s:
        s.execute(text("UPDATE grupo SET tecnico2_id = NULL WHERE id = :g"), {"g": m["e"]["grupo_id"]})
        s.execute(text("DELETE FROM acceso_hce WHERE usuario_id = :c"), {"c": cleo_id})
        s.commit()


_RUTAS_DE_UN_EXPEDIENTE = [f for f in FILAS if "{hce_id}" in f["ruta"]]


def test_hay_48_rutas_de_un_expediente_en_el_csv():
    assert len(_RUTAS_DE_UN_EXPEDIENTE) == 48


@pytest.mark.parametrize("fila", _RUTAS_DE_UN_EXPEDIENTE, ids=[f"{f['metodo']} {f['ruta']}" for f in _RUTAS_DE_UN_EXPEDIENTE])
def test_la_coordinacion_asignada_a_un_grupo_es_tratante_en_cada_ruta_de_su_expediente(mundo, coordinadora_tratante, fila):
    """La celda del sujeto `tratante` del CSV vale para ella (todas `permitir`: sin motivo, sin 403 ni el 404 de la matriz)."""
    cab_cleo, _ = coordinadora_tratante
    m = {**mundo, "cab": {**mundo["cab"], "tratante": cab_cleo}}
    assert fila["tratante"].startswith("permitir")
    _afirmar(m, fila, "tratante", clinico=False)
    # el par: sin asignación, coordinación es la otra columna del CSV (Cora no es tratante de H)
    _afirmar(mundo, fila, "coord_sin_motivo", clinico=False)


def test_al_sacarla_del_grupo_deja_de_ser_tratante(mundo, coordinadora_tratante):
    """Lo contrario del caso que pasa: la relación se deriva en cada pedido, no queda guardada."""
    cab_cleo, cleo_id = coordinadora_tratante
    h = mundo["e"]["hce_id"]
    assert mundo["cliente"].get(f"/hce/{h}", headers=cab_cleo).status_code == 200
    with mundo["Sesion"]() as s:
        s.execute(text("UPDATE grupo SET tecnico2_id = NULL WHERE id = :g"), {"g": mundo["e"]["grupo_id"]})
        s.commit()
    r = mundo["cliente"].get(f"/hce/{h}", headers=cab_cleo)
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")


# ── 3 · Sólo no_tratante y supervision abren la lectura ───────────────────────
#: (relación, ¿lleva motivo?): el CHECK `motivo_segun_relacion` exige NULL en `tratante` y `gestion`.
_NO_ABREN = [("gestion", False), ("titular", True), ("tratante", False)]


def _fila_de_acceso(s, usuario_id, hce_id, rol, relacion, con_motivo):
    s.execute(text(
        "INSERT INTO acceso_hce (hce_id, usuario_id, rol, relacion, motivo_codigo, inicio, vence, token_version) "
        "VALUES (:h, :u, :rol, :rel, :mot, now(), now() + interval '120 minutes', 0)"),
        {"h": hce_id, "u": usuario_id, "rol": rol, "rel": relacion,
         "mot": ("copia_familia" if relacion == "titular" else "interconsulta") if con_motivo else None})


@pytest.mark.parametrize("sujeto,rol", [("nt_sin_motivo", "tecnico"), ("coord_sin_motivo", "coordinacion")])
@pytest.mark.parametrize("relacion,con_motivo", _NO_ABREN, ids=[r for r, _ in _NO_ABREN])
def test_una_fila_de_gestion_titular_o_tratante_vigente_no_abre_la_lectura(mundo, sujeto, rol, relacion, con_motivo):
    h, uid = mundo["e"]["hce_id"], mundo["ids"][sujeto]
    rutas = [f"/hce/{h}", f"/hce/{h}/flujo", f"/hce/{h}/idea", f"/hce/{h}/documentos", f"/hce/{h}/identificacion" if rol == "tecnico" else f"/hce/{h}/auditoria"]
    try:
        with mundo["Sesion"]() as s:
            _fila_de_acceso(s, uid, h, rol, relacion, con_motivo)
            s.commit()
        for ruta in rutas:
            r = mundo["cliente"].get(ruta, headers=mundo["cab"][sujeto])
            assert (r.status_code, r.json()["code"]) == (403, "reason_required"), (relacion, ruta, r.text)
    finally:
        _borrar_ventanas(mundo, sujeto)


@pytest.mark.parametrize("sujeto,rol,relacion", [("nt_sin_motivo", "tecnico", "no_tratante"),
                                                 ("coord_sin_motivo", "coordinacion", "supervision")])
def test_el_par_una_fila_no_tratante_o_supervision_con_la_token_version_actual_si_abre(mundo, sujeto, rol, relacion):
    h, uid = mundo["e"]["hce_id"], mundo["ids"][sujeto]
    try:
        with mundo["Sesion"]() as s:
            _fila_de_acceso(s, uid, h, rol, relacion, True)
            s.commit()
        for ruta in (f"/hce/{h}", f"/hce/{h}/flujo", f"/hce/{h}/idea"):
            assert mundo["cliente"].get(ruta, headers=mundo["cab"][sujeto]).status_code == 200, ruta
    finally:
        _borrar_ventanas(mundo, sujeto)
    assert mundo["cliente"].get(f"/hce/{h}", headers=mundo["cab"][sujeto]).status_code == 403  # sin la fila, otra vez cerrado


# ── 5 · La ventana vale para el rol que la abrió (opcional) ───────────────────
def test_la_ventana_de_un_rol_no_abre_para_otro_si_el_rol_cambia(mundo):
    """Noe (técnico) tiene una ventana `no_tratante` vigente sobre H: la abre. Si su rol pasa a coordinación (por SQL, como
    en la auditoría), una fila `no_tratante` no es la que le toca (`supervision`) y no abre; al revés con Coti."""
    c, cab, ids, h = mundo["cliente"], mundo["cab"], mundo["ids"], mundo["e"]["hce_id"]
    assert c.get(f"/hce/{h}", headers=cab["nt_con_motivo"]).status_code == 200
    assert c.get(f"/hce/{h}", headers=cab["coord_con_motivo"]).status_code == 200
    cambios = (("nt_con_motivo", "coordinacion", "tecnico"), ("coord_con_motivo", "tecnico", "coordinacion"))
    try:
        with mundo["Sesion"]() as s:
            for sujeto, nuevo, _ in cambios:
                s.execute(text("UPDATE profesional SET rol = :r WHERE id = :i"), {"r": nuevo, "i": ids[sujeto]})
            s.commit()
        for sujeto, _, _ in cambios:
            r = c.get(f"/hce/{h}", headers=cab[sujeto])
            assert (r.status_code, r.json()["code"]) == (403, "reason_required"), (sujeto, r.text)
    finally:
        with mundo["Sesion"]() as s:
            for sujeto, _, viejo in cambios:
                s.execute(text("UPDATE profesional SET rol = :r WHERE id = :i"), {"r": viejo, "i": ids[sujeto]})
            s.commit()
    assert c.get(f"/hce/{h}", headers=cab["nt_con_motivo"]).status_code == 200
    assert c.get(f"/hce/{h}", headers=cab["coord_con_motivo"]).status_code == 200
