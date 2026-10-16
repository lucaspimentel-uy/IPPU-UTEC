"""El banco v0 cumple las reglas de su plan (docs/planes/L3-asistente-plan.md §3 y §8)."""
import re
from collections import defaultdict

import pytest

from asistente.banco import cargar


@pytest.fixture(scope="module")
def casos():
    return cargar()


def test_entre_20_y_30_casos(casos):
    assert 20 <= len(casos) <= 30


def test_ids_unicos(casos):
    ids = [c.id for c in casos]
    assert len(ids) == len(set(ids))


def test_categorias_validas(casos):
    assert {c.categoria for c in casos} <= {1, 2, 3, 4, 5}


def test_cada_par_tiene_un_caso_que_dispara_y_su_gemela(casos):
    pares = defaultdict(list)
    for c in casos:
        pares[c.par].append(c)
    for par, filas in pares.items():
        assert len(filas) == 2, par
        assert sorted(c.dispara for c in filas) == [False, True], par


@pytest.mark.parametrize("n", range(1, 12))
def test_cada_limite_tiene_un_caso_que_lo_dispara(casos, n):
    assert any(c.dispara and n in c.lims for c in casos), f"LIM-{n}"


def test_las_gemelas_se_responden_con_cita(casos):
    for c in casos:
        if not c.dispara:
            assert c.cita != "—", c.id
            assert c.mensaje_fijo is None, c.id


def test_las_citas_son_solo_del_documento_tecnico_o_el_protocolo(casos):
    for c in casos:
        if c.cita == "—":
            continue
        for parte in c.cita.split("·"):
            assert re.match(r"(DT|Prot) §", parte.strip()), (c.id, parte)


def test_sin_cita_hay_mensaje_fijo(casos):
    for c in casos:
        if c.cita == "—":
            assert c.mensaje_fijo in {"A", "B", "C"}, c.id
