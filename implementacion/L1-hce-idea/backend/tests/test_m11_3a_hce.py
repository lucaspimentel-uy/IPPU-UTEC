"""M11.3-a · rebanada persona + expediente (HCE-00), por la API.

Convención: **todo rechazo va emparejado con el caso que pasa** (409 ↔ 201,
422 ↔ 201, vacío ↔ con contenido), para que un test en verde no pueda deberse a
que el endpoint rechaza todo.

Los datos los crean las fábricas de `conftest.py` (la base de test no tiene
catálogos) y la verificación lee la base con consultas de columna sobre `db_api`.
"""
import itertools

import pytest
from sqlalchemy import func, select

from app.models.identidad import HceDiurna, Persona
from app.models.transversales import Auditoria
from app.services import hce as servicio_hce
from app.services.errores import ConflictError
from app.services.fechas import anio_actual

_cis = itertools.count(1_000_000)


def _persona(**sobre) -> dict:
    base = {
        "nombre": "Martín", "apellido": "Rodríguez", "ci": f"{next(_cis)}-1",
        "fecha_nac": "2016-04-12",
    }
    return {**base, **sobre}


def _alta(client, persona: dict | None = None, **hce):
    return client.post("/hce", json={"persona": persona or _persona(), **hce})


def _id(r) -> int:
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def _filas(db_api, hce_id: int, tipo: str = "edicion") -> list[Auditoria]:
    """Filas de auditoría del expediente; por omisión las **ediciones** (la `carga` del alta va aparte)."""
    db_api.expire_all()
    return list(db_api.scalars(
        select(Auditoria).where(Auditoria.hce_id == hce_id, Auditoria.tipo == tipo).order_by(Auditoria.id)
    ))


def _columna(db_api, columna, hce_id: int):
    """Valor actual de una columna de `hce_diurna`, leído sin pasar por el mapa de identidad."""
    return db_api.scalar(select(columna).where(HceDiurna.id == hce_id))


# ── Alta ─────────────────────────────────────────────────────────────────────
def test_el_alta_crea_persona_y_expediente_y_responde_con_el_sobre(client, db_api):
    r = _alta(client, diagnostico="TEA", cie11="6A02")
    assert r.status_code == 201
    cuerpo = r.json()
    assert set(cuerpo) == {"data", "warnings"}
    assert cuerpo["warnings"] == []
    data = cuerpo["data"]
    assert data["persona"]["nombre"] == "Martín" and data["activo"] is True
    assert data["diagnostico"] == "TEA" and data["grupo"] is None
    assert db_api.scalar(select(func.count()).select_from(Persona)) == 1
    assert db_api.scalar(select(func.count()).select_from(HceDiurna)) == 1


def test_una_ci_repetida_es_409_y_una_distinta_es_201(client):
    ci = "5.789.123-4"
    assert _alta(client, _persona(ci=ci)).status_code == 201
    repetida = _alta(client, _persona(ci=ci))
    assert repetida.status_code == 409
    assert repetida.json()["code"] == "conflict"
    assert repetida.json()["detail"][0]["campo"] == "persona.ci"
    assert _alta(client, _persona(ci="5.789.124-4")).status_code == 201


@pytest.mark.parametrize("otra_forma", ["57891234", " 5789 1234 ", "5-789-123.4"])
def test_la_ci_se_compara_sin_puntos_guiones_ni_espacios(client, otra_forma):
    assert _alta(client, _persona(ci="5.789.123-4")).status_code == 201
    assert _alta(client, _persona(ci=otra_forma)).status_code == 409


def test_la_ci_se_guarda_canonica_sin_puntos_guiones_ni_espacios(client, db_api):
    hid = _id(_alta(client, _persona(ci="5.789.123-4")))
    assert db_api.scalar(select(Persona.ci).join(HceDiurna).where(HceDiurna.id == hid)) == "57891234"


def test_la_misma_ci_en_tres_formatos_se_guarda_igual_y_la_segunda_es_409(client, db_api):
    primero = _id(_alta(client, _persona(ci="1.234.567-8")))
    assert db_api.scalar(select(Persona.ci).join(HceDiurna).where(HceDiurna.id == primero)) == "12345678"
    for otra_forma in ("12345678", "1 234 567 8"):
        r = _alta(client, _persona(ci=otra_forma))
        assert r.status_code == 409 and r.json()["detail"][0]["campo"] == "persona.ci", otra_forma
    assert db_api.scalar(select(func.count()).select_from(Persona).where(Persona.ci == "12345678")) == 1
    # el par que pasa: otra cédula, en cualquiera de los formatos, entra y se guarda canónica
    segundo = _id(_alta(client, _persona(ci="1 234 567-9")))
    assert db_api.scalar(select(Persona.ci).join(HceDiurna).where(HceDiurna.id == segundo)) == "12345679"


def test_una_ci_sin_digitos_ni_letras_es_422_al_guardar_y_con_digitos_es_201(client):
    r = _alta(client, _persona(ci=".-."))
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "persona.ci"
    assert _alta(client, _persona(ci=".5-")).status_code == 201


def test_cambiar_la_ci_se_guarda_canonica_y_se_audita_canonica(client, db_api):
    hid = _id(_alta(client, _persona(ci="111")))
    assert client.patch(f"/hce/{hid}", json={"persona": {"ci": "2.222-2"}}).status_code == 200
    assert [(f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid)] == [("111", "22222")]
    # escribir la misma CI con otro formato no es un cambio
    assert client.patch(f"/hce/{hid}", json={"persona": {"ci": "22.222"}}).status_code == 200
    assert len(_filas(db_api, hid)) == 1


def test_un_409_no_envenena_el_siguiente_request_del_mismo_test(client):
    primero = _id(_alta(client, _persona(ci="111")))
    assert _alta(client, _persona(ci="111")).status_code == 409
    # La sesión del request rechazado se descartó: lo siguiente anda y lo anterior sigue ahí.
    segundo = _id(_alta(client, _persona(ci="222")))
    assert client.get(f"/hce/{primero}").status_code == 200
    assert client.get(f"/hce/{segundo}").status_code == 200


def test_la_carrera_por_la_ci_tambien_es_409_y_no_un_500(client, monkeypatch):
    """Dos altas simultáneas pasan la verificación previa y la segunda choca con el UNIQUE."""
    assert _alta(client, _persona(ci="999")).status_code == 201
    monkeypatch.setattr(servicio_hce, "_persona_con_ci", lambda *a, **k: None)  # la verificación «no ve» al otro
    r = _alta(client, _persona(ci="999"))
    assert r.status_code == 409
    assert r.json()["detail"][0]["campo"] == "persona.ci"
    monkeypatch.undo()
    assert _alta(client, _persona(ci="1000")).status_code == 201  # y la conexión sigue sana


def test_un_grupo_inexistente_es_422_y_uno_existente_es_201(client, db_api, crear_grupo):
    grupo = crear_grupo(nombre="Escolares", anio=2026)
    malo = _alta(client, grupo_id=grupo.id + 999)
    assert malo.status_code == 422
    assert malo.json()["code"] == "validation_error"
    assert malo.json()["detail"][0]["campo"] == "grupo_id"
    assert db_api.scalar(select(func.count()).select_from(Persona)) == 0, "un alta rechazada no deja nada"
    bueno = _alta(client, grupo_id=grupo.id)
    assert bueno.status_code == 201
    assert bueno.json()["data"]["grupo"] == {  # B-front: el grupo del detalle trae sus técnicos (null si no hay)
        "id": grupo.id, "nombre": "Escolares", "anio": grupo.anio, "tecnico1": None, "tecnico2": None,
    }


@pytest.mark.parametrize("campo", ["nombre", "apellido", "ci"])
def test_un_obligatorio_en_blanco_es_422_y_con_contenido_es_201(client, campo):
    en_blanco = _alta(client, _persona(**{campo: "   "}))
    assert en_blanco.status_code == 422
    assert en_blanco.json()["detail"][0]["campo"] == f"persona.{campo}"
    assert _alta(client, _persona(**{campo: "Ana-1"})).status_code == 201


def test_varios_problemas_vuelven_juntos_en_la_lista(client):
    r = _alta(client, _persona(nombre="", apellido=" "), grupo_id=987654)
    assert r.status_code == 422
    assert {d["campo"] for d in r.json()["detail"]} == {"persona.nombre", "persona.apellido", "grupo_id"}


def test_la_validacion_de_entrada_usa_el_mismo_cuerpo_de_error(client):
    faltante = client.post("/hce", json={"persona": {"nombre": "Ana"}})
    assert faltante.status_code == 422
    assert faltante.json()["code"] == "validation_error"
    assert {"persona.apellido", "persona.ci", "persona.fecha_nac"} <= {d["campo"] for d in faltante.json()["detail"]}
    largo = _alta(client, _persona(nombre="x" * 81))
    assert largo.status_code == 422 and largo.json()["detail"][0]["campo"] == "persona.nombre"
    assert _alta(client, _persona(nombre="x" * 80)).status_code == 201


def test_el_vacio_se_guarda_como_null_y_el_texto_tal_cual(client, db_api):
    hid = _id(_alta(
        client,
        _persona(localidad="", telefono="   ", referente="Marta R."),
        diagnostico="", cie11=" \t", alerta="   ", derivacion="Pediatría", medicacion=" dos veces por día ",
    ))
    fila = db_api.execute(
        select(Persona.localidad, Persona.telefono, Persona.referente, HceDiurna.diagnostico,
               HceDiurna.cie11, HceDiurna.alerta, HceDiurna.derivacion, HceDiurna.medicacion)
        .join(HceDiurna).where(HceDiurna.id == hid)
    ).one()
    assert fila == (None, None, "Marta R.", None, None, None, "Pediatría", " dos veces por día ")


# ── N.º de HC (§5.109) ───────────────────────────────────────────────────────
def test_los_numeros_de_hc_asignados_son_1001_1002_en_orden(client):
    a, b, c = (_alta(client).json()["data"]["hc_historico"] for _ in range(3))
    assert (a, b, c) == (1001, 1002, 1003)


def test_un_numero_explicito_libre_es_201_ocupado_409_y_menor_a_1000_422(client):
    ok = _alta(client, hc_historico=5000)
    assert ok.status_code == 201 and ok.json()["data"]["hc_historico"] == 5000
    ocupado = _alta(client, hc_historico=5000)
    assert ocupado.status_code == 409 and ocupado.json()["detail"][0]["campo"] == "hc_historico"
    bajo = _alta(client, hc_historico=999)
    assert bajo.status_code == 422 and bajo.json()["detail"][0]["campo"] == "hc_historico"
    # el límite de abajo pasa, y el siguiente automático sigue al máximo existente
    assert _alta(client, hc_historico=1000).status_code == 201
    assert _alta(client).json()["data"]["hc_historico"] == 5001


def test_un_numero_rechazado_no_deja_persona_ni_expediente(client, db_api):
    assert _alta(client, hc_historico=2000).status_code == 201
    for malo in (2000, 999):
        assert _alta(client, hc_historico=malo).status_code in (409, 422)
    assert db_api.scalar(select(func.count()).select_from(Persona)) == 1
    assert db_api.scalar(select(func.count()).select_from(HceDiurna)) == 1


def test_un_numero_que_no_cabe_en_un_entero_o_no_es_entero_es_422_y_en_blanco_se_asigna(client):
    for malo in (2_147_483_648, "abc", 1000.5):
        r = _alta(client, hc_historico=malo)
        assert r.status_code == 422, malo
        assert r.json()["code"] == "validation_error"
    en_blanco = _alta(client, hc_historico="  ")
    assert en_blanco.status_code == 201 and en_blanco.json()["data"]["hc_historico"] == 1001
    # el tope exacto cabe; después de él no hay «siguiente»: 409 explicado, no un 500 por desborde
    assert _alta(client, hc_historico=2_147_483_647).status_code == 201
    sin_numero = _alta(client)
    assert sin_numero.status_code == 409 and sin_numero.json()["detail"][0]["campo"] == "hc_historico"
    assert _alta(client, hc_historico=2000).status_code == 201  # con uno explícito libre sigue andando


def test_editar_el_numero_valida_rango_y_unicidad_y_no_se_puede_borrar(client, db_api):
    a = _id(_alta(client))   # 1001
    b = _id(_alta(client))   # 1002
    assert client.patch(f"/hce/{b}", json={"hc_historico": 1001}).status_code == 409
    assert client.patch(f"/hce/{b}", json={"hc_historico": 999}).status_code == 422
    assert client.patch(f"/hce/{b}", json={"hc_historico": None}).status_code == 422
    assert client.patch(f"/hce/{b}", json={"hc_historico": 1002}).status_code == 200, "el propio número no es duplicado"
    assert _filas(db_api, b) == []
    r = client.patch(f"/hce/{b}", json={"hc_historico": 3000})
    assert r.status_code == 200 and r.json()["data"]["hc_historico"] == 3000
    assert [(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, b)] == [("hc_historico", "1002", "3000")]
    assert client.get(f"/hce/{a}").json()["hc_historico"] == 1001


def test_la_carrera_por_el_numero_tambien_es_409_y_no_un_500(client, monkeypatch):
    """La verificación previa «no ve» al otro: el UNIQUE de la base es la última defensa."""
    assert _alta(client, hc_historico=4000).status_code == 201
    monkeypatch.setattr(servicio_hce, "_exigir_hc_libre", lambda *a, **k: None)
    r = _alta(client, hc_historico=4000)
    assert r.status_code == 409 and r.json()["detail"][0]["campo"] == "hc_historico"
    monkeypatch.undo()
    assert _alta(client, hc_historico=4001).status_code == 201  # y la conexión sigue sana


def test_dos_altas_concurrentes_reciben_numeros_distintos(engine):
    """Dos transacciones **reales y simultáneas** (conexiones propias, con commit).

    La segunda tiene que esperar el lock de la numeración hasta que la primera
    confirme; sin él las dos leerían el mismo `max` y chocarían (o se pisarían).
    Es el único test que commitea de verdad: limpia lo que creó.
    """
    import threading
    import time

    from sqlalchemy import delete
    from sqlalchemy.orm import sessionmaker

    Sesion = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    cis = ("70000001", "70000002")
    resultados: dict[str, int] = {}
    errores: list[BaseException] = []
    primera_numerada = threading.Event()

    def _alta_real(clave: str, ci: str, esperar: threading.Event | None, avisar: threading.Event | None):
        s = Sesion()
        try:
            if esperar:
                esperar.wait(5)
            h = servicio_hce.crear_hce(
                s, persona={"nombre": "A", "apellido": "B", "ci": ci, "fecha_nac": "2016-01-01"}, hce={},
            )
            resultados[clave] = h.hc_historico
            if avisar:  # numerada pero SIN confirmar: la otra tiene que esperar
                avisar.set()
                time.sleep(0.5)
            s.commit()
        except BaseException as exc:  # noqa: BLE001
            errores.append(exc)
            s.rollback()
        finally:
            s.close()

    try:
        t1 = threading.Thread(target=_alta_real, args=("a", cis[0], None, primera_numerada))
        t2 = threading.Thread(target=_alta_real, args=("b", cis[1], primera_numerada, None))
        t1.start()
        t2.start()
        t1.join(15)
        t2.join(15)
        assert not errores, errores
        assert sorted(resultados.values()) == [1001, 1002], resultados
        assert resultados["a"] == 1001 and resultados["b"] == 1002, "la que espera recibe el número siguiente"
    finally:
        with Sesion() as s:
            ids = list(s.scalars(select(Persona.id).where(Persona.ci.in_(cis))))
            s.execute(delete(HceDiurna).where(HceDiurna.persona_id.in_(ids)))  # la auditoría cae por CASCADE
            s.execute(delete(Persona).where(Persona.id.in_(ids)))
            s.commit()


# ── Auditoría de la creación (§5.112) ────────────────────────────────────────
def test_el_alta_escribe_exactamente_una_fila_de_carga_y_un_patch_solo_ediciones(client, db_api):
    hid = _id(_alta(client, diagnostico="TEA"))
    cargas = _filas(db_api, hid, "carga")
    assert len(cargas) == 1
    c = cargas[0]
    assert (c.modulo, c.tipo, c.campo, c.valor_ant, c.valor_nuevo) == ("HCE-00", "carga", None, None, None)
    assert str(hid) in c.detalle and "1001" in c.detalle
    assert client.patch(f"/hce/{hid}", json={"diagnostico": "otro", "alerta": "x"}).status_code == 200
    assert len(_filas(db_api, hid, "carga")) == 1, "editar no vuelve a escribir una carga"
    assert len(_filas(db_api, hid, "edicion")) == 2
    db_api.expire_all()
    assert db_api.scalar(select(func.count()).select_from(Auditoria).where(Auditoria.hce_id == hid)) == 3


def test_un_alta_rechazada_no_escribe_carga(client, db_api):
    assert _alta(client, _persona(ci="55")).status_code == 201
    assert _alta(client, _persona(ci="55")).status_code == 409
    assert _alta(client, _persona(ci="56"), grupo_id=987654).status_code == 422
    db_api.expire_all()
    assert db_api.scalar(select(func.count()).select_from(Auditoria).where(Auditoria.tipo == "carga")) == 1


# ── Lectura ──────────────────────────────────────────────────────────────────
def test_leer_un_expediente_devuelve_el_recurso_sin_sobre(client):
    hid = _id(_alta(client, anamnesis={"gestacion": "a término"}))
    r = client.get(f"/hce/{hid}")
    assert r.status_code == 200
    assert "data" not in r.json() and "warnings" not in r.json()
    assert r.json()["id"] == hid
    assert r.json()["persona"]["ci"] and r.json()["anamnesis"] == {"gestacion": "a término"}


def test_un_expediente_inexistente_es_404_y_uno_existente_es_200(client):
    hid = _id(_alta(client))
    assert client.get(f"/hce/{hid}").status_code == 200
    r = client.get(f"/hce/{hid + 999}")
    assert r.status_code == 404
    assert r.json()["code"] == "not_found" and isinstance(r.json()["detail"], list)


# ── Edición de HCE-00 ────────────────────────────────────────────────────────
def test_editar_dos_campos_deja_exactamente_dos_filas_de_auditoria(client, db_api, admin):
    hid = _id(_alta(client, diagnostico="TEA", alerta="alergia"))
    r = client.patch(f"/hce/{hid}", json={"diagnostico": "TEA nivel 2", "alerta": "sin alergias"})
    assert r.status_code == 200
    assert r.json()["warnings"] == []
    assert r.json()["data"]["diagnostico"] == "TEA nivel 2"
    filas = _filas(db_api, hid)
    assert len(filas) == 2
    cambios = {f.campo: (f.valor_ant, f.valor_nuevo) for f in filas}
    assert cambios == {"diagnostico": ("TEA", "TEA nivel 2"), "alerta": ("alergia", "sin alergias")}
    # Desde M11.3-d1 (login, §5.101) la fila lleva al usuario del token: `client` entra como `admin`.
    assert all(f.modulo == "HCE-00" and f.tipo == "edicion" and f.usuario_id == admin.id for f in filas)


def test_editar_con_valores_identicos_no_escribe_auditoria(client, db_api):
    hid = _id(_alta(client, diagnostico="TEA"))
    r = client.patch(f"/hce/{hid}", json={"diagnostico": "TEA", "persona": {"nombre": "Martín"}})
    assert r.status_code == 200 and r.json()["warnings"] == []
    assert _filas(db_api, hid) == []
    # …y el mismo endpoint con un valor distinto sí escribe: el cero de arriba no es un endpoint mudo.
    client.patch(f"/hce/{hid}", json={"diagnostico": "otro"})
    assert len(_filas(db_api, hid)) == 1


def test_editar_la_persona_tambien_se_audita_y_toca_el_expediente(client, db_api):
    hid = _id(_alta(client, _persona(telefono="099 111 111")))
    antes = _columna(db_api, HceDiurna.actualizado_en, hid)
    r = client.patch(f"/hce/{hid}", json={"persona": {"telefono": "098 222 222", "localidad": "Canelones"}})
    assert r.status_code == 200
    assert r.json()["data"]["persona"]["telefono"] == "098 222 222"
    assert {(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid)} == {
        ("telefono", "099 111 111", "098 222 222"), ("localidad", None, "Canelones"),
    }
    db_api.expire_all()
    assert _columna(db_api, HceDiurna.actualizado_en, hid) >= antes


def test_borrar_un_opcional_con_vacio_o_null_lo_deja_en_null_y_se_audita(client, db_api):
    hid = _id(_alta(client, diagnostico="TEA", alerta="alergia"))
    r = client.patch(f"/hce/{hid}", json={"diagnostico": "", "alerta": None})
    assert r.status_code == 200
    assert r.json()["data"]["diagnostico"] is None and r.json()["data"]["alerta"] is None
    assert {(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid)} == {
        ("diagnostico", "TEA", None), ("alerta", "alergia", None),
    }


def test_lo_que_no_viene_en_el_cuerpo_no_se_toca(client, db_api):
    hid = _id(_alta(client, diagnostico="TEA", alerta="alergia"))
    client.patch(f"/hce/{hid}", json={"diagnostico": "TEA 2"})
    db_api.expire_all()
    assert _columna(db_api, HceDiurna.alerta, hid) == "alergia"


def test_un_obligatorio_de_la_persona_no_se_puede_borrar(client, db_api):
    hid = _id(_alta(client, _persona(nombre="Martín")))
    for vacio in (None, "", "  "):
        r = client.patch(f"/hce/{hid}", json={"persona": {"nombre": vacio}})
        assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "persona.nombre"
    assert client.patch(f"/hce/{hid}", json={"persona": {"nombre": "Martina"}}).status_code == 200
    assert [f.campo for f in _filas(db_api, hid)] == ["nombre"]


def test_cambiar_la_ci_a_una_ajena_es_409_y_a_una_libre_es_200(client, db_api):
    a = _id(_alta(client, _persona(ci="111")))
    b = _id(_alta(client, _persona(ci="222")))
    assert client.patch(f"/hce/{b}", json={"persona": {"ci": "1.11"}}).status_code == 409
    assert client.patch(f"/hce/{b}", json={"persona": {"ci": "333"}}).status_code == 200
    assert client.patch(f"/hce/{a}", json={"persona": {"ci": "1.1.1"}}).status_code == 200, "la propia CI no es duplicada"
    assert [(f.valor_ant, f.valor_nuevo) for f in _filas(db_api, b)] == [("222", "333")]


def test_cambiar_el_grupo_valida_que_exista_y_se_audita(client, db_api, crear_grupo):
    g1, g2 = crear_grupo(nombre="Inicial"), crear_grupo(nombre="Escolares")
    hid = _id(_alta(client, grupo_id=g1.id))
    assert client.patch(f"/hce/{hid}", json={"grupo_id": g2.id + 999}).status_code == 422
    r = client.patch(f"/hce/{hid}", json={"grupo_id": g2.id})
    assert r.status_code == 200 and r.json()["data"]["grupo"]["nombre"] == "Escolares"
    assert [(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid)] == [
        ("grupo_id", str(g1.id), str(g2.id))
    ]


def test_la_anamnesis_se_reemplaza_completa_y_se_audita_como_un_campo(client, db_api):
    hid = _id(_alta(client, anamnesis={"a": 1}))
    client.patch(f"/hce/{hid}", json={"anamnesis": {"a": 1}})  # igual → nada
    assert _filas(db_api, hid) == []
    client.patch(f"/hce/{hid}", json={"anamnesis": {"a": 2}})
    assert [(f.campo, f.valor_ant, f.valor_nuevo) for f in _filas(db_api, hid)] == [
        ("anamnesis", '{"a": 1}', '{"a": 2}')
    ]


def test_editar_un_expediente_inexistente_es_404_y_uno_existente_es_200(client):
    hid = _id(_alta(client))
    assert client.patch(f"/hce/{hid}", json={"diagnostico": "x"}).status_code == 200
    assert client.patch(f"/hce/{hid + 999}", json={"diagnostico": "x"}).status_code == 404


def test_los_campos_que_hce_00_no_edita_se_ignoran(client, db_api):
    # `activo` y `fecha_baja` salieron de esta lista en M11.3-d1: son la baja/reingreso por PATCH
    # (tests en `test_m11_3d1_login_listado.py`). Los metadatos de origen siguen ignorándose.
    hid = _id(_alta(client))
    r = client.patch(f"/hce/{hid}", json={"sistema_origen": "heroku", "id_origen": "x"})
    assert r.status_code == 200
    assert r.json()["data"]["activo"] is True and r.json()["data"]["fecha_baja"] is None
    assert _filas(db_api, hid) == []


def test_un_error_de_dominio_deshace_todo_lo_que_escribio_el_request(client, db_api, monkeypatch):
    """Una excepción **después** de escribir el cambio: no queda ni el cambio ni su rastro."""
    hid = _id(_alta(client, diagnostico="TEA"))
    real = servicio_hce.registrar_cambios

    def _falla_tras_escribir(db, **kw):
        real(db, **kw)  # la auditoría ya se escribió (flush)…
        raise ConflictError("falla tardía")  # …y recién ahora falla

    monkeypatch.setattr(servicio_hce, "registrar_cambios", _falla_tras_escribir)
    r = client.patch(f"/hce/{hid}", json={"diagnostico": "cambiado"})
    assert r.status_code == 409
    monkeypatch.undo()
    db_api.expire_all()
    assert _columna(db_api, HceDiurna.diagnostico, hid) == "TEA"
    assert _filas(db_api, hid) == []
    # y la misma edición, sin la falla, queda guardada (el commit del éxito sí ocurre)
    assert client.patch(f"/hce/{hid}", json={"diagnostico": "cambiado"}).status_code == 200
    db_api.expire_all()
    assert _columna(db_api, HceDiurna.diagnostico, hid) == "cambiado"
    assert len(_filas(db_api, hid)) == 1


# ── Búsqueda: las tres vías + nombre ─────────────────────────────────────────
@pytest.fixture
def legajos(client, crear_grupo):
    """Tres expedientes: dos en «Escolares», uno sin grupo."""
    escolares, inicial = crear_grupo(nombre="Escolares"), crear_grupo(nombre="Inicial")
    ids = {
        "martin": _id(_alta(client, _persona(nombre="Martín", apellido="Núñez", ci="5.789.123-4"),
                            grupo_id=escolares.id)),
        "sofia": _id(_alta(client, _persona(nombre="Sofía", apellido="Pérez", ci="6.012.345-1"),
                           grupo_id=escolares.id)),
        "tomas": _id(_alta(client, _persona(nombre="Tomás", apellido="Gil", ci="7.000.111-2"))),
    }
    ids["inicial_id"] = inicial.id
    return ids


def _buscar(client, **filtros) -> list[int]:
    r = client.get("/hce", params=filtros)
    assert r.status_code == 200, r.text
    return [h["id"] for h in r.json()]


def test_buscar_por_ci_ignora_puntos_y_guiones_y_no_inventa_resultados(client, legajos):
    assert _buscar(client, ci="5.789.123-4") == [legajos["martin"]]
    assert _buscar(client, ci="5789") == [legajos["martin"]]
    assert _buscar(client, ci="6-012") == [legajos["sofia"]]
    assert _buscar(client, ci="999") == []


def test_buscar_por_numero_es_solo_el_numero_de_hc_y_nunca_el_id_interno(client, legajos, db_api):
    # el N.º de HC de cada uno se asignó solo: 1001, 1002, 1003
    assert _buscar(client, numero="1001") == [legajos["martin"]]
    assert _buscar(client, numero="1002") == [legajos["sofia"]]
    assert _buscar(client, numero=" 1003 ") == [legajos["tomas"]]
    # el id interno de un expediente NO es un N.º de HC: buscarlo no lo encuentra
    for clave in ("martin", "sofia", "tomas"):
        assert db_api.scalar(select(HceDiurna.hc_historico).where(HceDiurna.id == legajos[clave])) >= 1001
        assert _buscar(client, numero=str(legajos[clave])) == []
    assert _buscar(client, numero="424242") == []
    assert _buscar(client, numero="12345678901234567890") == []  # no cabe en un int: no debe explotar
    assert _buscar(client, numero="10x1") == []                   # no es un número: nada coincide


def test_buscar_por_grupo_ignora_mayusculas_y_no_encuentra_otro_grupo(client, legajos):
    assert _buscar(client, grupo="Escolares") == [legajos["martin"], legajos["sofia"]]
    assert _buscar(client, grupo="  escolares ") == [legajos["martin"], legajos["sofia"]]
    assert _buscar(client, grupo="Inicial") == []  # el grupo existe pero no tiene integrantes
    assert _buscar(client, grupo="Adolescentes") == []


def test_buscar_por_grupo_es_por_anio_y_por_omision_el_anio_en_curso(client, crear_grupo):
    hoy = anio_actual()
    actual, pasado = crear_grupo(nombre="Escolares", anio=hoy), crear_grupo(nombre="Escolares", anio=hoy - 1)
    de_hoy = _id(_alta(client, _persona(nombre="Hoy"), grupo_id=actual.id))
    de_ayer = _id(_alta(client, _persona(nombre="Ayer"), grupo_id=pasado.id))
    assert _buscar(client, grupo="Escolares") == [de_hoy], "por omisión, el año en curso"
    assert _buscar(client, grupo="Escolares", anio=hoy) == [de_hoy]
    assert _buscar(client, grupo="Escolares", anio=hoy - 1) == [de_ayer]
    assert _buscar(client, grupo="Escolares", anio=hoy + 1) == []
    # `anio` sólo califica al grupo: sin `grupo` no deja afuera a nadie (ni siquiera a quien está en un grupo viejo)
    assert sorted(_buscar(client, anio=hoy)) == sorted([de_hoy, de_ayer])
    assert _buscar(client, nombre="ayer") == [de_ayer]


def test_el_anio_de_la_busqueda_fuera_de_rango_es_422_y_dentro_es_200(client):
    assert client.get("/hce", params={"grupo": "x", "anio": 0}).status_code == 422
    assert client.get("/hce", params={"grupo": "x", "anio": 99999}).status_code == 422
    assert client.get("/hce", params={"grupo": "x", "anio": 2026}).status_code == 200


def test_buscar_por_nombre_ignora_acentos_y_vale_en_cualquier_orden(client, legajos):
    assert _buscar(client, nombre="sofia") == [legajos["sofia"]]
    assert _buscar(client, nombre="PÉREZ sofía") == [legajos["sofia"]]
    assert _buscar(client, nombre="nunez") == [legajos["martin"]]
    assert _buscar(client, nombre="martin n") == [legajos["martin"]]
    assert _buscar(client, nombre="zzz") == []


def test_los_caracteres_comodin_se_buscan_literalmente(client, legajos):
    assert _buscar(client, nombre="%") == []
    assert _buscar(client, nombre="_") == []


def test_una_ci_sin_digitos_ni_letras_es_422_y_con_digitos_es_200(client, legajos):
    r = client.get("/hce", params={"ci": ".-."})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "ci"
    assert client.get("/hce", params={"ci": "5.7"}).status_code == 200


def test_los_filtros_se_combinan_con_y(client, legajos):
    assert _buscar(client, grupo="Escolares", nombre="sofia") == [legajos["sofia"]]
    assert _buscar(client, grupo="Escolares", nombre="tomas") == []
    assert _buscar(client, grupo="Escolares", ci="5789") == [legajos["martin"]]


def test_un_filtro_vacio_se_ignora_y_sin_filtros_devuelve_todos_ordenados(client, legajos):
    todos = _buscar(client)
    assert sorted(todos) == sorted([legajos["martin"], legajos["sofia"], legajos["tomas"]])
    assert _buscar(client, ci="", nombre="  ") == todos
    # orden por apellido: Gil, Núñez, Pérez
    assert todos == [legajos["tomas"], legajos["martin"], legajos["sofia"]]


def test_la_lista_trae_el_resumen_sin_sobre(client, legajos):
    fila = client.get("/hce", params={"ci": "5789"}).json()[0]
    assert set(fila) == {"id", "hc_historico", "activo", "grupo", "persona", "flujo"}  # B-front: + flujo
    assert fila["persona"] == {
        "id": fila["persona"]["id"], "nombre": "Martín", "apellido": "Núñez", "ci": "57891234",
        "fecha_nac": fila["persona"]["fecha_nac"],  # B-front: + fecha_nac (su valor lo prueba test_front_lecturas)
    }
    assert fila["grupo"]["nombre"] == "Escolares"


# ── Contrato en Swagger e infraestructura ────────────────────────────────────
def test_swagger_documenta_los_endpoints_con_el_sobre_de_ejemplo(client):
    spec = client.get("/openapi.json").json()
    assert set(spec["paths"]["/hce"]) == {"post", "get"}
    assert set(spec["paths"]["/hce/{hce_id}"]) == {"get", "patch"}
    for metodo, ruta, status in (("post", "/hce", "201"), ("patch", "/hce/{hce_id}", "200")):
        ejemplo = spec["paths"][ruta][metodo]["responses"][status]["content"]["application/json"]["example"]
        assert ejemplo["warnings"] == [] and "data" in ejemplo, f"{metodo} {ruta}"
    esquema = spec["components"]["schemas"]
    assert "examples" in esquema["HceCrear"] and "examples" in esquema["HceActualizar"]
    assert "RespuestaError" in esquema


def test_health_no_cambia(client):
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"
