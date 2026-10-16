"""Índice y recuperación con datos ficticios en memoria."""
import pytest

from asistente.indice import Indice, fragmentar

CORPUS = """# Manual ficticio

Texto de presentación.

## 1. Huerta escolar

Las tomateras se riegan dos veces por semana.

### 1.1 Herramientas

La pala y el rastrillo se guardan en el galpón.

## 2. Biblioteca

Los libros se prestan por quince días con la credencial.
"""


@pytest.fixture
def indice():
    return Indice(fragmentar(CORPUS, "MF"))


def test_fragmenta_por_seccion_con_ruta():
    secciones = [f.seccion for f in fragmentar(CORPUS, "MF")]
    assert secciones == ["(inicio)", "1. Huerta escolar", "1. Huerta escolar > 1.1 Herramientas", "2. Biblioteca"]


def test_seccion_larga_se_parte_por_parrafos():
    parrafos = ["uno dos tres cuatro cinco seis", "siete ocho nueve diez once doce", "trece catorce"]
    md = "## Larga\n\n" + "\n\n".join(parrafos)
    frags = fragmentar(md, "MF", max_palabras=10)
    assert [f.texto for f in frags] == [parrafos[0], parrafos[1] + "\n\n" + parrafos[2]]
    assert {f.seccion for f in frags} == {"Larga"}
    assert len({f.id for f in frags}) == len(frags)


def test_parrafo_que_solo_supera_el_maximo_se_parte_por_lineas():
    tabla = "| a | b | c | d |\n| e | f | g | h |\n| i | j | k | l |"
    frags = fragmentar("## Tabla\n\n" + tabla, "MF", max_palabras=6)
    assert len(frags) == 3


def test_cada_resultado_trae_documento_y_seccion(indice):
    resultados = indice.buscar("¿Cuándo se riegan las tomateras?", k=3)
    assert resultados
    assert resultados[0].seccion == "1. Huerta escolar"
    for r in resultados:
        assert r.documento == "MF" and r.seccion and r.puntaje > 0 and r.texto


def test_la_seccion_cuenta_para_la_busqueda(indice):
    assert indice.buscar("herramientas", k=1)[0].seccion == "1. Huerta escolar > 1.1 Herramientas"


def test_sin_coincidencia_devuelve_lista_vacia(indice):
    assert indice.buscar("helicóptero submarino") == []


def test_umbral_configurable(indice):
    assert indice.buscar("libros", umbral=0.0)
    assert indice.buscar("libros", umbral=1_000.0) == []


def test_k_limita_la_cantidad(indice):
    assert len(indice.buscar("se", k=1)) <= 1
    assert len(indice.buscar("galpón libros tomateras", k=2)) == 2


def test_mismo_corpus_mismo_indice_y_mismos_resultados():
    a, b = Indice(fragmentar(CORPUS, "MF")), Indice(fragmentar(CORPUS, "MF"))
    assert a.serializar() == b.serializar()
    assert a.buscar("libros credencial") == b.buscar("libros credencial")


def test_guardar_y_cargar_da_los_mismos_resultados(indice, tmp_path):
    ruta = tmp_path / "indice.json"
    indice.guardar(ruta)
    cargado = Indice.cargar(ruta)
    assert cargado.serializar() == indice.serializar()
    assert cargado.buscar("pala rastrillo") == indice.buscar("pala rastrillo")


def test_tildes_y_mayusculas_no_importan(indice):
    assert indice.buscar("GALPON")[0].seccion == indice.buscar("galpón")[0].seccion
