"""Humo sobre los documentos reales: se indexan y tienen secciones. No imprime ni compara texto."""
from asistente.indexar import CARPETA_FUENTES, FUENTES, construir


def test_los_documentos_autorizados_se_indexan_con_secciones():
    for archivo in FUENTES.values():
        assert (CARPETA_FUENTES / archivo).is_file(), archivo
    indice = construir()
    for documento in FUENTES:
        secciones = {f.seccion for f in indice.fragmentos if f.documento == documento}
        assert len(secciones) > 5, documento
