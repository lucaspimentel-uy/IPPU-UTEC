"""Tests end-to-end de los endpoints (Fase 2)."""


def _nna_payload(**extra):
    base = dict(
        nombre="Ana", apellido="P.", ci="1.234.567-8", fecha_nac="2016-05-10",
        sexo="Femenino", grupo_id="A", tecnico_id=1, diagnostico="TEA",
        anamnesis={"motivo": "Ingreso de prueba"}, talleres=[1, 2],
    )
    base.update(extra)
    return base


def _dims(puntaje=2):
    return [{"dimension_id": f"D{i}", "puntaje": puntaje} for i in range(1, 13)]


def test_health(client):
    assert client.get("/health").json()["status"] == "ok"


def test_catalogo(client):
    escalas = client.get("/catalogo/escalas").json()
    assert len(escalas) == 4
    assert sum(len(e["dimensiones"]) for e in escalas) == 12
    assert len(client.get("/catalogo/dimensiones").json()) == 12


def test_personas(client):
    assert len(client.get("/terapeutas").json()) == 1
    grupos = client.get("/grupos").json()
    assert grupos[0]["id"] == "A"
    assert len(client.get("/talleres").json()) == 2


def test_crear_ver_y_edad(client):
    r = client.post("/nna", json=_nna_payload())
    assert r.status_code == 201, r.text
    nna = r.json()
    assert nna["edad"] is not None  # calculada desde fecha_nac
    assert nna["anamnesis"]["motivo"] == "Ingreso de prueba"
    assert {t["id"] for t in nna["talleres"]} == {1, 2}
    assert client.get(f"/nna/{nna['id']}").json()["nombre"] == "Ana"


def test_ci_duplicada_409(client):
    client.post("/nna", json=_nna_payload())
    r = client.post("/nna", json=_nna_payload(nombre="Otra"))
    assert r.status_code == 409


def test_listar_filtrar_buscar(client):
    client.post("/nna", json=_nna_payload(nombre="Ana", ci="1-1"))
    client.post("/nna", json=_nna_payload(nombre="Beto", apellido="Z.", ci="2-2"))
    assert len(client.get("/nna").json()) == 2
    assert len(client.get("/nna", params={"q": "Beto"}).json()) == 1
    assert len(client.get("/nna", params={"activo": True}).json()) == 2


def test_editar_y_estado(client):
    nid = client.post("/nna", json=_nna_payload()).json()["id"]
    r = client.put(f"/nna/{nid}", json=_nna_payload(nombre="Ana María", talleres=[1]))
    assert r.json()["nombre"] == "Ana María"
    assert {t["id"] for t in r.json()["talleres"]} == {1}
    r = client.patch(f"/nna/{nid}/estado", json={"activo": False, "fecha_baja": "2026-07-01"})
    assert r.json()["activo"] is False and r.json()["fecha_baja"] == "2026-07-01"


def test_nna_404(client):
    assert client.get("/nna/999").status_code == 404


def test_idea_total_y_duplicado(client):
    nid = client.post("/nna", json=_nna_payload()).json()["id"]
    r = client.post(f"/nna/{nid}/idea", json={
        "anio": 2026, "periodo": "inicial", "fecha": "2026-01-15",
        "evaluador_id": 1, "dimensiones": _dims(2)})
    assert r.status_code == 201, r.text
    assert r.json()["total"] == 24  # 12 x 2, calculado en el servidor
    # duplicado (mismo nna/año/periodo) -> 409
    dup = client.post(f"/nna/{nid}/idea", json={
        "anio": 2026, "periodo": "inicial", "dimensiones": _dims(2)})
    assert dup.status_code == 409
    assert len(client.get(f"/nna/{nid}/idea").json()) == 1


def test_idea_validaciones(client):
    nid = client.post("/nna", json=_nna_payload()).json()["id"]
    # puntaje fuera de 0..8 -> 422
    malo = _dims(2)
    malo[0]["puntaje"] = 9
    assert client.post(f"/nna/{nid}/idea",
                       json={"anio": 2026, "periodo": "inicial", "dimensiones": malo}).status_code == 422
    # faltan dimensiones -> 422
    assert client.post(f"/nna/{nid}/idea",
                       json={"anio": 2026, "periodo": "inicial", "dimensiones": _dims(2)[:5]}).status_code == 422
    # periodo inválido -> 422
    assert client.post(f"/nna/{nid}/idea",
                       json={"anio": 2026, "periodo": "otoño", "dimensiones": _dims(2)}).status_code == 422


def test_likert_equivalente(client):
    nid = client.post("/nna", json=_nna_payload()).json()["id"]
    # todos los ítems en 5 -> promedio 5 -> (5-5)*2 = 0 por dimensión -> total 0
    items = [{"dimension_id": f"D{i}", "item_num": j, "valor": 5}
             for i in range(1, 13) for j in range(1, 4)]
    r = client.post(f"/nna/{nid}/likert", json={"anio": 2026, "items": items})
    assert r.status_code == 201, r.text
    assert r.json()["equivalente_idea"] == 0.0
    # todos en 1 -> (5-1)*2 = 8 por dimensión -> total 96
    for it in items:
        it["valor"] = 1
    nid2 = client.post("/nna", json=_nna_payload(ci="9-9")).json()["id"]
    r2 = client.post(f"/nna/{nid2}/likert", json={"anio": 2026, "items": items})
    assert r2.json()["equivalente_idea"] == 96.0


def test_observaciones_y_eventos(client):
    nid = client.post("/nna", json=_nna_payload()).json()["id"]
    client.post(f"/nna/{nid}/observaciones",
                json={"fecha": "2026-03-01", "autor_id": 1, "texto": "Buena adaptación."})
    obs = client.get(f"/nna/{nid}/observaciones").json()
    assert len(obs) == 1 and obs[0]["texto"] == "Buena adaptación."
    client.post(f"/nna/{nid}/eventos",
                json={"tipo": "alta", "fecha": "2026-02-01", "titulo": "Alta"})
    assert len(client.get(f"/nna/{nid}/eventos").json()) == 1
