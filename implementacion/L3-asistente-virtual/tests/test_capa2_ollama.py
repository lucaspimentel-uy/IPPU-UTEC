"""F1-d1: integración con un Ollama de verdad en esta máquina. Se saltea salvo que L3_OLLAMA=1 esté definida; el
modelo sale de L3_OLLAMA_MODELO (por defecto, el medido en la F1-d1). Sólo verifica que haya respuesta y que sea el
JSON esperado: no mide la clasificación. Consultas inventadas para este test; no salen de eval/ ni de IPPU.
"""
import os

import pytest

from asistente.capa2 import ClasificadorOllama

pytestmark = pytest.mark.skipif(os.environ.get("L3_OLLAMA") != "1", reason="integración con Ollama: L3_OLLAMA=1")
MODELO = os.environ.get("L3_OLLAMA_MODELO", "qwen2.5:7b-instruct-q4_K_M")


@pytest.fixture(scope="module")
def ollama():
    clasificador = ClasificadorOllama(MODELO)
    clasificador.precalentar()
    return clasificador


@pytest.mark.parametrize("consulta", [
    "¿Qué día se renuevan los carnés de la biblioteca?",          # neutra
    "Un compañero del taller de cerámica se desmayó y no reacciona",  # crisis
])
def test_ollama_contesta_con_el_json_esperado(ollama, consulta):
    c = ollama.clasificar(consulta)
    assert c.disponible and c.detalle == "ok", c.detalle
