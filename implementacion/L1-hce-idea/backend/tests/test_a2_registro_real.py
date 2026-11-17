"""A2 (§5.178) · lo que la conexión única de la suite **no** puede probar: el candado y la transacción propia.

Acá cada pedido usa **su propia conexión, con commits de verdad** (como en producción: la sesión del pedido y la del
registro salen de la misma fábrica sobre el motor, cada una con su conexión). Por eso el escenario se escribe con commit
y **se borra al terminar** (la base de test queda como estaba: vacía).

1. **N = 8 GET simultáneos del tratante dejan UNA fila.** Una barrera junta a los ocho justo antes del candado; el
   candado los pone en fila y sólo el primero inserta. *Sin el candado, los ocho ven «no hay fila» e insertan.*
2. **Un GET que falla después de registrar deja la fila.** El endpoint levanta un error (500): la transacción del pedido
   se deshace y la fila sigue, porque se commiteó en otra. *Registrando en la sesión del pedido, se pierde.*
3. **Los intentos sobreviven al 404** que deshace el pedido.

Los dos mutantes (sin candado; registrar en la sesión del pedido) se corrieron a mano y no se commitean: §5.178.
"""
import threading
from datetime import date

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, func, select
from sqlalchemy.orm import sessionmaker

from app.core.seguridad import crear_token
from app.main import app
from app.models.acceso import AccesoHce, AccesoIntento
from app.models.identidad import Grupo, HceDiurna, Persona, Profesional
from app.services import registro_accesos
from tests.conftest import sesiones_inyectadas

pytestmark = pytest.mark.matriz_real

N = 8
CI = "9.990.001-7"


@pytest.fixture
def real(engine, hash_test):
    """Tina (tratante de H) y Nico (técnico de otro grupo), **commiteados**; las dos sesiones de la app, sobre
    conexiones reales del motor. Al salir se borra todo lo que quedó."""
    Sesion = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    with Sesion() as s:
        tina = Profesional(nombre="Tina", email="tina@a2real.ippu.test", rol="tecnico", activo=True, hashed_password=hash_test)
        nico = Profesional(nombre="Nico", email="nico@a2real.ippu.test", rol="tecnico", activo=True, hashed_password=hash_test)
        s.add_all([tina, nico])
        s.flush()
        grupo = Grupo(nombre="Uno (A2 real)", anio=date.today().year, tecnico1_id=tina.id)
        persona = Persona(nombre="Martín", apellido="Rodríguez", ci=CI.replace(".", "").replace("-", ""), fecha_nac=date(2016, 4, 12))
        s.add_all([grupo, persona])
        s.flush()
        hce = HceDiurna(persona_id=persona.id, grupo_id=grupo.id)
        s.add(hce)
        s.commit()
        ids = {"tina": tina.id, "nico": nico.id, "grupo": grupo.id, "persona": persona.id, "hce": hce.id}
    usuarios = (ids["tina"], ids["nico"])

    def filas(modelo=AccesoHce):
        with Sesion() as s:  # una conexión nueva: sólo ve lo commiteado
            return list(s.scalars(select(modelo).where(modelo.usuario_id.in_(usuarios)).order_by(modelo.id)))

    try:
        with sesiones_inyectadas(Sesion):
            yield {
                "h": ids["hce"], "filas": filas,
                "cab": {n: {"Authorization": f"Bearer {crear_token(ids[n])}"} for n in ("tina", "nico")},
            }
    finally:
        with Sesion() as s:
            s.execute(delete(AccesoHce).where(AccesoHce.usuario_id.in_(usuarios)))
            s.execute(delete(AccesoIntento).where(AccesoIntento.usuario_id.in_(usuarios)))
            s.execute(delete(HceDiurna).where(HceDiurna.id == ids["hce"]))
            s.execute(delete(Persona).where(Persona.id == ids["persona"]))
            s.execute(delete(Grupo).where(Grupo.id == ids["grupo"]))
            s.execute(delete(Profesional).where(Profesional.id.in_(usuarios)))
            s.commit()
            assert s.scalar(select(func.count()).select_from(AccesoHce)) == 0  # la base de test queda vacía


def test_ocho_get_simultaneos_del_tratante_dejan_una_sola_fila(real, monkeypatch):
    """Conexiones reales y separadas. La barrera suelta a los ocho a la vez **en la puerta del candado**: todos pasaron
    ya el chequeo rápido («no hay fila») y cada uno está por abrir su transacción de registro."""
    barrera = threading.Barrier(N, timeout=20)
    original = registro_accesos._candado

    def _juntos(sesion, clave, quien, recurso_id):
        barrera.wait()
        return original(sesion, clave, quien, recurso_id)

    monkeypatch.setattr(registro_accesos, "_candado", _juntos)
    estados: list[int] = []

    def _get():
        with TestClient(app, headers=real["cab"]["tina"]) as c:
            estados.append(c.get(f"/hce/{real['h']}").status_code)

    hilos = [threading.Thread(target=_get) for _ in range(N)]
    for h in hilos:
        h.start()
    for h in hilos:
        h.join(30)
    assert estados == [200] * N, estados
    filas = real["filas"]()
    assert len(filas) == 1, f"{len(filas)} filas para {N} pedidos simultáneos: el candado no los puso en fila"
    assert (filas[0].relacion, filas[0].hce_id, filas[0].motivo_codigo) == ("tratante", real["h"], None)
    # y el pedido siguiente, ya sin carrera, tampoco agrega
    monkeypatch.setattr(registro_accesos, "_candado", original)
    with TestClient(app, headers=real["cab"]["tina"]) as c:
        assert c.get(f"/hce/{real['h']}/flujo").status_code == 200
    assert len(real["filas"]()) == 1


def test_un_get_que_falla_despues_de_registrar_deja_la_fila(real, monkeypatch):
    """El endpoint revienta (500) y la sesión del pedido se cierra sin commit. La fila está igual: es de otra
    transacción, commiteada antes."""
    from app.routers import hce as router_hce

    def _roto(*a, **k):
        raise RuntimeError("falla del endpoint, después del registro")

    monkeypatch.setattr(router_hce.servicio, "obtener_hce", _roto)
    with TestClient(app, headers=real["cab"]["tina"]) as c:
        r = c.get(f"/hce/{real['h']}")
    assert (r.status_code, r.json()["code"]) == (500, "internal_error")
    filas = real["filas"]()
    assert [(f.relacion, f.hce_id) for f in filas] == [("tratante", real["h"])], "el acceso ocurrió y no quedó registrado"


def test_un_get_que_no_falla_tambien_la_deja_y_el_no_tratante_no_deja_nada(real):
    """El par de los dos de arriba, sobre conexiones reales."""
    with TestClient(app) as c:
        assert c.get(f"/hce/{real['h']}", headers=real["cab"]["nico"]).status_code == 403
        assert real["filas"]() == []
        assert c.get(f"/hce/{real['h']}", headers=real["cab"]["tina"]).status_code == 200
    assert len(real["filas"]()) == 1


def test_los_intentos_sobreviven_al_404_que_deshace_el_pedido(real):
    with TestClient(app, headers=real["cab"]["nico"]) as c:
        assert c.post("/hce/consulta", json={"ci": "1.111.111-1"}).status_code == 404
        equivocada = c.post(f"/hce/{real['h']}/accesos", json={"motivo_codigo": "interconsulta", "ci": "1.234.567-8"})
        inexistente = c.post("/hce/999999/accesos", json={"motivo_codigo": "interconsulta", "ci": "1.234.567-8"})
        assert (equivocada.status_code, equivocada.content) == (404, inexistente.content)
        assert c.post("/hce/consulta", json={"ci": CI}).status_code == 200
    assert [(i.tipo, i.resultado, i.hce_id) for i in real["filas"](AccesoIntento)] == [
        ("consulta_ci", "no_encontrado", None), ("ci_errada", "rechazado", real["h"]), ("consulta_ci", "encontrado", real["h"]),
    ]
    assert real["filas"]() == []  # nadie abrió el expediente
