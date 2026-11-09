"""A1 · la matriz de acceso, ruta por ruta (`docs/diseno/fase4-matriz-rutas.csv`, `docs/diseno/fase4-acceso.md` b, c; §5.165).

**La fuente es el CSV.** El test lo lee y, por cada fila, pide la ruta como cada uno de los siete sujetos y afirma el
estado y el `code` de su celda. Los siete sujetos son usuarios reales (ninguno es la identidad de la suite, que pasa la
matriz: `conftest._identidad_de_la_suite_sin_matriz`):

- `tratante`: Tina, técnica 1 de **Uno** (el grupo del expediente H).
- `nt_sin_motivo` / `nt_con_motivo`: Nico y Noe, técnicos de **Dos**; Noe tiene una ventana vigente sobre H.
- `coord_sin_motivo` / `coord_con_motivo`: Cora y Coti, coordinación; Coti tiene una ventana vigente sobre H.
- `administrativo`: Ada · `direccion_nt`: Dina.

**Cada denegación va junto a su par que pasa:** en la misma fila, el sujeto que sí puede. Además, una celda `403` de un
rol (administrativo, dirección NT) se pide también sobre un id que no existe y sigue siendo 403 (el rol se mira antes que
la existencia); una `403:reason_required` sobre un id inexistente es 404 (la existencia antes que la relación); y una
`404` tiene **el mismo cuerpo** que la de un recurso inexistente.

`permitir` = la matriz no lo frenó: ni 401, ni 403, ni el 404 de la matriz (el que diría un inexistente). Una escritura
se pide con `{}`: un 422 (o un 200 sin cambios) prueba que pasó. El escenario se arma **una vez por módulo** (una
transacción externa que se deshace al final): una escritura que pasa no cambia lo que la matriz decide después.

El otro chequeo de la fuente: `MATRIZ` de `app/services/matriz.py` dice, celda por celda, lo mismo que el CSV (cada ruta
del CSV, por la acción que la cubre).
"""
import csv
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select, text

from app.core.config import settings
from app.core.database import get_db
from app.core.seguridad import crear_token
from app.main import app
from app.models.acceso import AccesoHce
from app.models.identidad import Grupo, HceDiurna, Profesional
from app.seed_catalogos import run as sembrar_catalogos
from app.services import matriz
from tests.conftest import _fabrica_sesiones

CSV = Path(__file__).resolve().parents[4] / "docs" / "diseno" / "fase4-matriz-rutas.csv"
FILAS = list(csv.DictReader(CSV.open(encoding="utf-8")))
SUJETOS = matriz.SUJETOS
PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
ANIO = date.today().year


# ── La acción de la matriz que cubre cada ruta ───────────────────────────────
def accion_de(metodo: str, ruta: str) -> str:
    lee = metodo == "GET"
    if ruta.startswith("/auth/") or ruta in (
        "/severidad-niveles", "/organismos/opciones", "/inclusion/opciones", "/documentos/categorias",
        "/ateneos/opciones", "/recordatorios", "/accesos/motivos",
    ):
        return "catalogo"
    fijas = {
        ("POST", "/hce"): "hce.alta", ("GET", "/hce"): "hce.buscar", ("POST", "/hce/consulta"): "hce.consulta",
        ("GET", "/inclusion"): "inclusion.lista", ("GET", "/panel"): "panel", ("GET", "/ateneos"): "ateneos.lista",
        ("POST", "/ateneos"): "ateneos.alta", ("GET", "/ateneos/indicador"): "ateneos.indicador",
        ("GET", "/grupos"): "grupos.lista", ("PATCH", "/grupos/{grupo_id}"): "grupos.editar",
        ("GET", "/profesionales"): "profesionales.lista", ("POST", "/hce/{hce_id}/accesos"): "accesos.abrir",
    }
    if (metodo, ruta) in fijas:
        return fijas[(metodo, ruta)]
    if ruta.startswith("/grupos/{grupo_id}/fotos"):
        return "grupo.fotos"
    if ruta.startswith("/ateneos/{ateneo_id}"):
        return "ateneo.leer" if lee else "ateneo.escribir"
    if ruta.startswith("/hce/{hce_id}/organismos"):
        return "org.leer" if lee else "org.escribir"
    if ruta.startswith("/hce/{hce_id}/identificacion"):
        return "identificacion.leer" if lee else "identificacion.escribir"
    if lee and (ruta == "/hce/{hce_id}/auditoria" or ruta.startswith("/hce/{hce_id}/fotos")):
        return "hce.reservado"
    return "hce.leer" if lee else "hce.escribir"


def test_el_csv_no_tiene_filas_repetidas_ni_sin_fuente():
    claves = [(f["metodo"], f["ruta"]) for f in FILAS]
    assert len(claves) == len(set(claves))
    assert all(f["fuente"].strip() for f in FILAS)
    assert set(FILAS[0]) >= {"metodo", "ruta", *SUJETOS}


def test_las_rutas_de_la_app_son_las_filas_del_csv():
    rutas = {(m, r.path) for r in app.routes if hasattr(r, "methods") and r.endpoint.__module__.startswith("app.routers.")
             for m in r.methods - {"HEAD", "OPTIONS"}}
    assert rutas == {(f["metodo"], f["ruta"]) for f in FILAS}


@pytest.mark.parametrize("fila", FILAS, ids=[f"{f['metodo']} {f['ruta']}" for f in FILAS])
def test_la_matriz_del_codigo_dice_lo_mismo_que_el_csv(fila):
    assert matriz.MATRIZ[accion_de(fila["metodo"], fila["ruta"])] == {s: fila[s] for s in SUJETOS}


# ── El escenario (una vez por módulo) ────────────────────────────────────────
@pytest.fixture(autouse=True)
def carpeta_uploads():
    """Anula la de `conftest`: los archivos del escenario viven en la carpeta del módulo (`mundo`)."""
    return None


@pytest.fixture(scope="module")
def mundo(engine, hash_test, tmp_path_factory):
    conexion = engine.connect()
    externa = conexion.begin()
    Sesion = _fabrica_sesiones(conexion)
    parche = pytest.MonkeyPatch()
    parche.setattr(settings, "uploads_dir", str(tmp_path_factory.mktemp("uploads_a1")))

    def _get_db():
        s = Sesion()
        try:
            yield s
        finally:
            s.close()

    app.dependency_overrides[get_db] = _get_db
    try:
        with Sesion() as s:
            sembrar_catalogos(db=s, verboso=False)
            u = {}
            for clave, nombre, rol in (
                ("tratante", "Tina", "tecnico"), ("nt_sin_motivo", "Nico", "tecnico"), ("nt_con_motivo", "Noe", "tecnico"),
                ("coord_sin_motivo", "Cora", "coordinacion"), ("coord_con_motivo", "Coti", "coordinacion"),
                ("administrativo", "Ada", "administrativo"), ("direccion_nt", "Dina", "direccion_nt"),
            ):
                u[clave] = Profesional(nombre=nombre, email=f"{nombre.lower()}@a1.ippu.test", rol=rol, activo=True,
                                       hashed_password=hash_test, especialidad="Psicología")
                s.add(u[clave])
            s.flush()
            uno = Grupo(nombre="Uno", anio=ANIO, tecnico1_id=u["tratante"].id)
            dos = Grupo(nombre="Dos", anio=ANIO, tecnico1_id=u["nt_sin_motivo"].id, tecnico2_id=u["nt_con_motivo"].id)
            s.add_all([uno, dos])
            s.commit()
            ids = {k: p.id for k, p in u.items()}
            grupo, grupo_dos = uno.id, dos.id
            categoria = s.scalar(text("SELECT id FROM categoria_documento WHERE nombre <> 'Registro histórico' ORDER BY id LIMIT 1"))

        cab = {k: {"Authorization": f"Bearer {crear_token(i)}"} for k, i in ids.items()}
        cliente = TestClient(app)
        t = cab["tratante"]

        def ok(r, esperado=201):
            assert r.status_code == esperado, r.text
            return r.json()["data"]["id"]

        h = ok(cliente.post("/hce", headers=t, json={"persona": {"nombre": "Martín", "apellido": "Rodríguez",
               "ci": "5.789.123-4", "fecha_nac": "2016-04-12"}, "grupo_id": grupo}))
        e = {"hce_id": h, "grupo_id": grupo, "grupo_dos": grupo_dos, "categoria": categoria}
        e["idea_id"] = ok(cliente.post(f"/hce/{h}/idea", headers=t, json={"anio": ANIO}))
        e["protocolo_id"] = ok(cliente.post(f"/hce/{h}/protocolo", headers=t, json={"tipo": "A", "anio": ANIO}))
        e["informe_id"] = ok(cliente.post(f"/hce/{h}/informe-cierre", headers=t, json={"anio": ANIO}))
        e["doc_hce"] = ok(cliente.post(f"/hce/{h}/documentos", headers=t, files={"archivo": ("a.pdf", PDF, "application/pdf")},
                                       data={"categoria_id": str(categoria)}))
        e["foto_hce"] = ok(cliente.post(f"/hce/{h}/fotos", headers=t, files={"archivo": ("f.png", PNG, "image/png")}))
        e["foto_grupo"] = ok(cliente.post(f"/grupos/{grupo}/fotos", headers=t, files={"archivo": ("g.png", PNG, "image/png")}))
        for clave, cuerpo in (
            ("clinico", {"tipo": "clinico", "fecha": f"{ANIO}-09-18", "titulo": "Ateneo de Martín", "hce_referida_id": h,
                         "grupo_id": grupo, "situacion": "Meseta en las transiciones."}),
            ("no_clinico", {"tipo": "institucional", "fecha": f"{ANIO}-09-18", "titulo": "Ateneo institucional"}),
        ):
            a = ok(cliente.post("/ateneos", headers=t, json=cuerpo))
            e[f"ateneo_{clave}"] = a
            e[f"acuerdo_{clave}"] = ok(cliente.post(f"/ateneos/{a}/acuerdos", headers=t, json={"acuerdo": "Revisar en marzo."}))
            e[f"doc_{clave}"] = ok(cliente.post(f"/ateneos/{a}/documentos", headers=t,
                                                files={"archivo": ("acta.pdf", PDF, "application/pdf")},
                                                data={"categoria_id": str(categoria)}))
        # Las dos ventanas vigentes (A1 las abre por la API; acá se escriben directo para no depender de esa ruta).
        with Sesion() as s:
            for clave, relacion, motivo in (("nt_con_motivo", "no_tratante", "interconsulta"),
                                            ("coord_con_motivo", "supervision", "supervision")):
                s.add(AccesoHce(hce_id=h, usuario_id=ids[clave], rol=u[clave].rol, relacion=relacion, motivo_codigo=motivo,
                                vence=text("now() + interval '120 minutes'"), token_version=0))
            s.commit()
        yield {"cliente": cliente, "cab": cab, "ids": ids, "e": e, "Sesion": Sesion}
    finally:
        app.dependency_overrides.pop(get_db, None)
        parche.undo()
        if externa.is_active:
            externa.rollback()
        conexion.close()


def _ruta(plantilla: str, e: dict, *, clinico: bool, inexistente: bool = False) -> str:
    """La ruta con los ids del escenario; con `inexistente`, el id principal es 999999 (ninguna fila lo tiene)."""
    variante = "clinico" if clinico else "no_clinico"
    valores = {
        "{hce_id}": e["hce_id"], "{idea_id}": e["idea_id"], "{protocolo_id}": e["protocolo_id"],
        "{informe_id}": e["informe_id"], "{grupo_id}": e["grupo_id"],
        "{ateneo_id}": e[f"ateneo_{variante}"], "{acuerdo_id}": e[f"acuerdo_{variante}"],
        "{doc_id}": e[f"doc_{variante}"] if plantilla.startswith("/ateneos") else e["doc_hce"],
        "{foto_id}": e["foto_grupo"] if plantilla.startswith("/grupos") else e["foto_hce"],
    }
    principal = next((p for p in ("{hce_id}", "{idea_id}", "{protocolo_id}", "{informe_id}", "{ateneo_id}", "{grupo_id}")
                      if p in plantilla), None)
    ruta = plantilla
    for parametro, valor in valores.items():
        ruta = ruta.replace(parametro, str(999999 if inexistente and parametro == principal else valor))
    return ruta


def _pedir(cliente, metodo: str, ruta: str, cab: dict):
    if metodo == "GET":
        return cliente.get(ruta, headers=cab)
    return cliente.request(metodo, ruta, headers=cab, json={})


_MENSAJE_PROHIBIDO = {"code": "forbidden", "detail": [{"campo": None, "mensaje": matriz.MENSAJE_PROHIBIDO}]}


def _motivo(sujeto: str) -> dict:
    mensaje = matriz.MENSAJE_MOTIVO_COORDINACION if sujeto.startswith("coord") else matriz.MENSAJE_MOTIVO_TECNICO
    return {"code": "reason_required", "detail": [{"campo": None, "mensaje": mensaje}]}


def _afirmar(m, fila, sujeto, *, clinico: bool):
    cliente, cab, e = m["cliente"], m["cab"][sujeto], m["e"]
    metodo, plantilla = fila["metodo"], fila["ruta"]
    efecto = matriz.resolver(fila[sujeto], clinico=clinico)[0]
    r = _pedir(cliente, metodo, _ruta(plantilla, e, clinico=clinico), cab)
    contexto = f"{metodo} {plantilla} como {sujeto} (clínico={clinico}): {r.status_code} {r.text[:300]}"
    tiene_id = "{" in plantilla
    if efecto == matriz.PERMITIR:
        assert r.status_code not in (401, 403), contexto
        if r.status_code == 404 and tiene_id:
            inexistente = _pedir(cliente, metodo, _ruta(plantilla, e, clinico=clinico, inexistente=True), cab)
            assert r.json() != inexistente.json(), contexto  # un 404 del dominio, no el de la matriz
    elif efecto == matriz.PROHIBIDO:
        assert (r.status_code, r.json()) == (403, _MENSAJE_PROHIBIDO), contexto
        if sujeto in ("administrativo", "direccion_nt") and tiene_id:
            # El rol se mira antes que la existencia: el mismo 403 por un id que no existe.
            r2 = _pedir(cliente, metodo, _ruta(plantilla, e, clinico=clinico, inexistente=True), cab)
            assert (r2.status_code, r2.json()) == (403, _MENSAJE_PROHIBIDO), contexto
    elif efecto == matriz.MOTIVO:
        assert (r.status_code, r.json()) == (403, _motivo(sujeto)), contexto
        r2 = _pedir(cliente, metodo, _ruta(plantilla, e, clinico=clinico, inexistente=True), cab)
        assert r2.status_code == 404 and r2.json()["code"] == "not_found", contexto  # la existencia, antes que la relación
    elif efecto == matriz.NO_EXISTE:
        r2 = _pedir(cliente, metodo, _ruta(plantilla, e, clinico=clinico, inexistente=True), cab)
        assert r.status_code == 404 and r.json()["code"] == "not_found", contexto
        assert r.json() == r2.json(), contexto  # el mismo cuerpo que un inexistente
    else:
        raise AssertionError(f"celda desconocida: {fila[sujeto]}")


@pytest.mark.parametrize("fila", FILAS, ids=[f"{f['metodo']} {f['ruta']}" for f in FILAS])
def test_cada_ruta_responde_su_celda_a_cada_sujeto(mundo, fila):
    variantes = (False, True) if fila["ruta"].startswith("/ateneos/{ateneo_id}") else (False,)
    # El tratante va al final: lo que escriba (con `{}`) no cambia lo que la matriz decide para los demás.
    for sujeto in [s for s in SUJETOS if s != "tratante"] + ["tratante"]:
        for clinico in variantes:
            _afirmar(mundo, fila, sujeto, clinico=clinico)


# ── Las condiciones de las celdas ────────────────────────────────────────────
def test_grupo_propio_el_tecnico_da_de_alta_en_su_grupo_y_no_en_otro(mundo):
    c, cab, e = mundo["cliente"], mundo["cab"]["tratante"], mundo["e"]
    persona = {"nombre": "Ana", "apellido": "Paz", "fecha_nac": "2017-01-01"}
    r = c.post("/hce", headers=cab, json={"persona": {**persona, "ci": "4.111.111-1"}, "grupo_id": e["grupo_dos"]})
    assert r.status_code == 403 and r.json()["detail"][0]["campo"] == "grupo_id"
    assert c.post("/hce", headers=cab, json={"persona": {**persona, "ci": "4.111.111-2"}, "grupo_id": e["grupo_id"]}).status_code == 201


@pytest.mark.parametrize("sujeto", ["coord_sin_motivo", "administrativo"])
def test_identificacion_coordinacion_y_administrativo_dan_de_alta_sin_datos_clinicos(mundo, sujeto):
    c, cab = mundo["cliente"], mundo["cab"][sujeto]
    persona = {"nombre": "Leo", "apellido": "Sosa", "fecha_nac": "2017-01-01", "ci": f"4.22{len(sujeto)}.222-2"}
    r = c.post("/hce", headers=cab, json={"persona": persona, "diagnostico": "TEA", "anamnesis": {"motivo": "x"}})
    assert r.status_code == 422
    assert {d["campo"] for d in r.json()["detail"]} == {"diagnostico", "anamnesis"}
    # Un clínico vacío no cuenta; sin ellos, el alta pasa (sin grupo: la logística se asigna después).
    r = c.post("/hce", headers=cab, json={"persona": persona, "diagnostico": "", "anamnesis": {}})
    assert r.status_code == 201, r.text


def test_mis_grupos_el_tecnico_busca_en_sus_grupos_y_coordinacion_en_la_institucion(mundo):
    c, cab, h = mundo["cliente"], mundo["cab"], mundo["e"]["hce_id"]
    assert h in [f["id"] for f in c.get("/hce", headers=cab["tratante"]).json()]
    assert h not in [f["id"] for f in c.get("/hce", headers=cab["nt_con_motivo"]).json()]  # ni con ventana: la lista no abre nada
    for s in ("coord_sin_motivo", "administrativo"):
        assert h in [f["id"] for f in c.get("/hce", headers=cab[s]).json()]


def test_alcance_ateneos_el_clinico_ajeno_no_aparece_sin_ventana_y_si_con_ella(mundo):
    c, cab, e = mundo["cliente"], mundo["cab"], mundo["e"]

    def ids(s):
        return {f["id"] for f in c.get("/ateneos", headers=cab[s]).json()}

    assert ids("nt_sin_motivo") >= {e["ateneo_no_clinico"]} and e["ateneo_clinico"] not in ids("nt_sin_motivo")
    assert ids("nt_con_motivo") >= {e["ateneo_no_clinico"], e["ateneo_clinico"]}
    assert ids("tratante") >= {e["ateneo_no_clinico"], e["ateneo_clinico"]}
    assert ids("coord_sin_motivo") >= {e["ateneo_no_clinico"], e["ateneo_clinico"]}


def test_clinico_si_tratante_el_no_tratante_no_refiere_un_expediente_ajeno(mundo):
    c, cab, e = mundo["cliente"], mundo["cab"], mundo["e"]
    cuerpo = {"tipo": "clinico", "fecha": f"{ANIO}-10-01", "titulo": "Otro", "hce_referida_id": e["hce_id"], "grupo_id": e["grupo_id"]}
    r = c.post("/ateneos", headers=cab["nt_con_motivo"], json=cuerpo)  # ni con ventana: referir es del tratante
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["hce_referida_id"]
    assert c.post("/ateneos", headers=cab["tratante"], json=cuerpo).status_code == 201
    assert c.post("/ateneos", headers=cab["coord_sin_motivo"], json=cuerpo).status_code == 201


def test_asignables_solo_tecnico_o_coordinacion_son_tecnicos_de_un_grupo(mundo):
    c, cab, ids, e = mundo["cliente"], mundo["cab"]["coord_sin_motivo"], mundo["ids"], mundo["e"]
    for s in ("administrativo", "direccion_nt"):
        r = c.patch(f"/grupos/{e['grupo_dos']}", headers=cab, json={"tecnico1_id": ids[s]})
        assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "tecnico1_id"
    r = c.patch(f"/grupos/{e['grupo_dos']}", headers=cab, json={"tecnico1_id": ids["coord_con_motivo"]})
    assert r.status_code == 200, r.text
    r = c.patch(f"/grupos/{e['grupo_dos']}", headers=cab, json={"tecnico1_id": ids["nt_sin_motivo"]})  # se deja como estaba
    assert r.status_code == 200, r.text


# ── La ventana ───────────────────────────────────────────────────────────────
def _ventana(s, usuario_id, hce_id, *, rol="tecnico", relacion="no_tratante", vence="now() + interval '120 minutes'",
             inicio="now()", token_version=0):
    s.add(AccesoHce(hce_id=hce_id, usuario_id=usuario_id, rol=rol, relacion=relacion,
                    motivo_codigo="supervision" if relacion == "supervision" else "interconsulta",
                    inicio=text(inicio), vence=text(vence), token_version=token_version))
    s.flush()


def test_la_ventana_vigente_abre_y_la_vencida_no(mundo):
    c, cab, ids, h = mundo["cliente"], mundo["cab"], mundo["ids"], mundo["e"]["hce_id"]
    assert c.get(f"/hce/{h}", headers=cab["nt_con_motivo"]).status_code == 200
    with mundo["Sesion"]() as s:
        _ventana(s, ids["nt_sin_motivo"], h, inicio="now() - interval '3 hours'", vence="now() - interval '1 minute'")
        s.commit()
        try:
            r = c.get(f"/hce/{h}", headers=cab["nt_sin_motivo"])
            assert (r.status_code, r.json()["code"]) == (403, "reason_required")
        finally:
            s.execute(text("DELETE FROM acceso_hce WHERE usuario_id = :u"), {"u": ids["nt_sin_motivo"]})
            s.commit()


def test_la_ventana_de_otro_usuario_no_cuenta(mundo):
    """Noe tiene ventana sobre H; Nico, del mismo grupo, no: a Nico le sigue pidiendo el motivo."""
    c, cab, h = mundo["cliente"], mundo["cab"], mundo["e"]["hce_id"]
    assert c.get(f"/hce/{h}", headers=cab["nt_con_motivo"]).status_code == 200
    r = c.get(f"/hce/{h}", headers=cab["nt_sin_motivo"])
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")


def test_la_ventana_de_otro_expediente_no_cuenta(mundo):
    c, cab, ids = mundo["cliente"], mundo["cab"], mundo["ids"]
    otro = c.post("/hce", headers=cab["tratante"], json={"persona": {"nombre": "Otro", "apellido": "NNA", "ci": "4.333.333-3",
                  "fecha_nac": "2016-01-01"}, "grupo_id": mundo["e"]["grupo_id"]}).json()["data"]["id"]
    r = c.get(f"/hce/{otro}", headers=cab["nt_con_motivo"])  # su ventana es de H, no de este
    assert (r.status_code, r.json()["code"]) == (403, "reason_required")
    assert c.get(f"/hce/{otro}", headers=cab["tratante"]).status_code == 200


def test_si_cambia_token_version_la_ventana_termina(mundo):
    c, cab, ids, h = mundo["cliente"], mundo["cab"], mundo["ids"], mundo["e"]["hce_id"]
    with mundo["Sesion"]() as s:
        s.execute(text("UPDATE profesional SET token_version = 1 WHERE id = :i"), {"i": ids["nt_con_motivo"]})
        s.commit()
        try:
            r = c.get(f"/hce/{h}", headers=cab["nt_con_motivo"])
            assert (r.status_code, r.json()["code"]) == (403, "reason_required")
        finally:
            s.execute(text("UPDATE profesional SET token_version = 0 WHERE id = :i"), {"i": ids["nt_con_motivo"]})
            s.commit()
    assert c.get(f"/hce/{h}", headers=cab["nt_con_motivo"]).status_code == 200


# ── POST /hce/{id}/accesos y la decisión (a) ────────────────────────────────
def _abrir(m, sujeto, cuerpo, hce_id=None):
    return m["cliente"].post(f"/hce/{hce_id or m['e']['hce_id']}/accesos", headers=m["cab"][sujeto], json=cuerpo)


def _borrar_ventanas(m, sujeto):
    with m["Sesion"]() as s:
        s.execute(text("DELETE FROM acceso_hce WHERE usuario_id = :u"), {"u": m["ids"][sujeto]})
        s.commit()


def test_decision_a_tecnico_con_la_ci_correcta_abre_y_con_otra_es_el_404_de_un_inexistente(mundo):
    h = mundo["e"]["hce_id"]
    try:
        inexistente = _abrir(mundo, "nt_sin_motivo", {"motivo_codigo": "interconsulta", "ci": "57891234"}, hce_id=999999)
        r = _abrir(mundo, "nt_sin_motivo", {"motivo_codigo": "interconsulta", "ci": "1.234.567-8"})
        assert r.status_code == 404 and r.json() == inexistente.json()
        assert mundo["cliente"].get(f"/hce/{h}", headers=mundo["cab"]["nt_sin_motivo"]).status_code == 403  # no abrió nada
        r = _abrir(mundo, "nt_sin_motivo", {"motivo_codigo": "interconsulta", "ci": "5.789.123-4"})  # con formato: canónica
        assert r.status_code == 201, r.text
        d = r.json()["data"]
        assert (d["relacion"], d["motivo_codigo"], d["motivo_label"]) == ("no_tratante", "interconsulta", "Interconsulta")
        assert mundo["cliente"].get(f"/hce/{h}", headers=mundo["cab"]["nt_sin_motivo"]).status_code == 200
    finally:
        _borrar_ventanas(mundo, "nt_sin_motivo")


def test_decision_a_el_tecnico_sin_ci_es_422_y_coordinacion_no_la_manda(mundo):
    try:
        r = _abrir(mundo, "nt_sin_motivo", {"motivo_codigo": "interconsulta"})
        assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["ci"]
        r = _abrir(mundo, "coord_sin_motivo", {"motivo_codigo": "supervision"})
        assert r.status_code == 201 and r.json()["data"]["relacion"] == "supervision"
        r = _abrir(mundo, "coord_sin_motivo", {"motivo_codigo": "interconsulta", "ci": "cualquiera"})  # la de coordinación no se mira
        assert r.status_code == 201
    finally:
        _borrar_ventanas(mundo, "coord_sin_motivo")


@pytest.mark.parametrize("sujeto", ["administrativo", "direccion_nt"])
def test_administrativo_y_direccion_no_abren_ventanas(mundo, sujeto):
    r = _abrir(mundo, sujeto, {"motivo_codigo": "supervision"})
    assert (r.status_code, r.json()) == (403, _MENSAJE_PROHIBIDO)


def test_el_motivo_es_del_catalogo_y_de_la_relacion(mundo):
    for sujeto, cuerpo in (
        ("nt_sin_motivo", {"motivo_codigo": "curiosidad", "ci": "57891234"}),
        ("nt_sin_motivo", {"motivo_codigo": "supervision", "ci": "57891234"}),  # supervisión es de coordinación
        ("tratante", {"motivo_codigo": "interconsulta"}),                      # el tratante sólo registra la copia
    ):
        r = _abrir(mundo, sujeto, cuerpo)
        assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["motivo_codigo"], (sujeto, r.text)


@pytest.mark.parametrize("codigo", ["copia_familia", "otro"])
def test_el_texto_es_obligatorio_en_copia_y_otro_y_hasta_500(mundo, codigo):
    sujeto = "coord_sin_motivo"
    try:
        for texto in (None, "", "   "):
            r = _abrir(mundo, sujeto, {"motivo_codigo": codigo, "motivo_texto": texto})
            assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["motivo_texto"]
        r = _abrir(mundo, sujeto, {"motivo_codigo": codigo, "motivo_texto": "x" * 501})
        assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["motivo_texto"]
        r = _abrir(mundo, sujeto, {"motivo_codigo": codigo, "motivo_texto": "x" * 500})
        assert r.status_code == 201, r.text
    finally:
        _borrar_ventanas(mundo, sujeto)


def test_el_texto_sin_nul_y_sin_invisibles_salvo_saltos(mundo):
    sujeto = "coord_sin_motivo"
    try:
        r = _abrir(mundo, sujeto, {"motivo_codigo": "supervision", "motivo_texto": "a\u0000b"})
        assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "motivo_texto"
        r = _abrir(mundo, sujeto, {"motivo_codigo": "supervision", "motivo_texto": "Revisión‮ del​ caso\nsegunda\tlínea"})
        assert r.status_code == 201
        assert r.json()["data"]["motivo_texto"] == "Revisión del caso\nsegunda\tlínea"
        assert [(w["code"], w["campo"]) for w in r.json()["warnings"]] == [("nombre_con_caracteres_invisibles", "motivo_texto")]
        r = _abrir(mundo, sujeto, {"motivo_codigo": "supervision", "motivo_texto": "Revisión semestral"})
        assert r.status_code == 201 and r.json()["warnings"] == []
    finally:
        _borrar_ventanas(mundo, sujeto)


def test_la_copia_a_la_familia_del_tratante_es_titular_sin_ventana(mundo):
    try:
        r = _abrir(mundo, "tratante", {"motivo_codigo": "copia_familia", "motivo_texto": "A la madre: el IC del año."})
        assert r.status_code == 201, r.text
        d = r.json()["data"]
        assert d["relacion"] == "titular" and d["vence"] == d["inicio"]
    finally:
        _borrar_ventanas(mundo, "tratante")


def test_la_ventana_que_abre_la_api_dura_120_minutos(mundo):
    try:
        d = _abrir(mundo, "coord_sin_motivo", {"motivo_codigo": "supervision"}).json()["data"]
        from datetime import datetime
        dur = datetime.fromisoformat(d["vence"]) - datetime.fromisoformat(d["inicio"])
        assert dur.total_seconds() == 120 * 60
        assert mundo["cliente"].get(f"/hce/{mundo['e']['hce_id']}/auditoria", headers=mundo["cab"]["coord_sin_motivo"]).status_code == 200
    finally:
        _borrar_ventanas(mundo, "coord_sin_motivo")


def test_los_motivos_son_el_catalogo_con_quien_los_usa(mundo):
    r = mundo["cliente"].get("/accesos/motivos", headers=mundo["cab"]["direccion_nt"])
    assert r.status_code == 200
    por_codigo = {m["codigo"]: m for m in r.json()}
    assert list(por_codigo) == ["interconsulta", "pase_de_caso", "ateneo", "supervision", "copia_familia", "otro"]
    assert por_codigo["supervision"]["quien"] == ["coordinacion"]
    assert por_codigo["copia_familia"] == {"codigo": "copia_familia", "label": "Copia de la HC entregada a la familia",
                                           "quien": ["tratante", "coordinacion"], "texto_obligatorio": True}


# ── POST /hce/consulta ───────────────────────────────────────────────────────
def test_la_consulta_exacta_devuelve_la_fila_minima_y_la_parcial_es_404(mundo):
    c, cab, e = mundo["cliente"], mundo["cab"], mundo["e"]
    for ci in ("5.789.123-4", "57891234", " 5789123-4 "):
        r = c.post("/hce/consulta", headers=cab["nt_sin_motivo"], json={"ci": ci})
        assert r.status_code == 200, (ci, r.text)
        d = r.json()["data"]
        assert set(d) == {"id", "hc_historico", "nombre", "apellido", "grupo", "relacion"}
        assert (d["id"], d["nombre"], d["relacion"], d["grupo"]["id"]) == (e["hce_id"], "Martín", "no_tratante", e["grupo_id"])
    assert c.post("/hce/consulta", headers=cab["tratante"], json={"ci": "57891234"}).json()["data"]["relacion"] == "tratante"
    for parcial in ("5789", "5789123", "578912345"):
        r = c.post("/hce/consulta", headers=cab["nt_sin_motivo"], json={"ci": parcial})
        assert r.status_code == 404 and r.json()["code"] == "not_found"
    r = c.post("/hce/consulta", headers=cab["nt_sin_motivo"], json={"ci": "  "})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "ci"


# ── GET|PATCH /hce/{id}/identificacion ───────────────────────────────────────
_IDENTIFICACION = {"id", "hc_historico", "activo", "fecha_baja", "grupo_id", "grupo", "persona"}
_PERSONA = {"id", "nombre", "apellido", "ci", "fecha_nac", "sexo", "localidad", "referente", "telefono"}


@pytest.mark.parametrize("sujeto", ["tratante", "nt_con_motivo", "coord_sin_motivo", "administrativo"])
def test_la_identificacion_nunca_trae_un_campo_clinico(mundo, sujeto):
    r = mundo["cliente"].get(f"/hce/{mundo['e']['hce_id']}/identificacion", headers=mundo["cab"][sujeto])
    assert r.status_code == 200
    assert set(r.json()) == _IDENTIFICACION and set(r.json()["persona"]) == _PERSONA


def test_patch_identificacion_toca_la_logistica_y_rechaza_lo_clinico(mundo):
    c, cab, h = mundo["cliente"], mundo["cab"]["administrativo"], mundo["e"]["hce_id"]
    r = c.patch(f"/hce/{h}/identificacion", headers=cab, json={"diagnostico": "TEA", "persona": {"telefono": "099"}})
    assert r.status_code == 422 and [d["campo"] for d in r.json()["detail"]] == ["diagnostico"]
    r = c.patch(f"/hce/{h}/identificacion", headers=cab, json={"persona": {"telefono": "099 111 222"}})
    assert r.status_code == 200 and r.json()["data"]["persona"]["telefono"] == "099 111 222"
    assert set(r.json()["data"]) == _IDENTIFICACION
    # El pase de caso: coordinación le quita el grupo; desde ese pedido Tina deja de ser tratante, y se lo devuelve.
    cc = mundo["cab"]["coord_sin_motivo"]
    try:
        assert c.patch(f"/hce/{h}/identificacion", headers=cc, json={"grupo_id": None}).status_code == 200
        r = c.get(f"/hce/{h}", headers=mundo["cab"]["tratante"])
        assert (r.status_code, r.json()["code"]) == (403, "reason_required")
    finally:
        assert c.patch(f"/hce/{h}/identificacion", headers=cc, json={"grupo_id": mundo["e"]["grupo_id"]}).status_code == 200
    assert c.get(f"/hce/{h}", headers=mundo["cab"]["tratante"]).status_code == 200


# ── B5 ───────────────────────────────────────────────────────────────────────
def test_b5_el_tecnico_recibe_el_aviso_sin_campo_y_quien_ve_la_nomina_el_especifico(mundo):
    c, cab, e = mundo["cliente"], mundo["cab"], mundo["e"]
    cuerpo = {"persona": {"nombre": "X", "apellido": "Y", "ci": "57891234", "fecha_nac": "2016-01-01"}}
    r = c.post("/hce", headers=cab["nt_sin_motivo"], json={**cuerpo, "grupo_id": e["grupo_dos"]})
    assert (r.status_code, r.json()) == (409, {"code": "conflict", "detail": [
        {"campo": None, "mensaje": "Ya hay un NNA registrado con esa C.I. Consultá con coordinación."}]})
    for s in ("coord_sin_motivo", "administrativo"):
        r = c.post("/hce", headers=cab[s], json=cuerpo)
        assert r.status_code == 409 and r.json()["detail"] == [{"campo": "persona.ci", "mensaje": "Ya existe una persona con esa cédula"}]
