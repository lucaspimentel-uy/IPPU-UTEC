"""Construye el índice sobre los documentos autorizados: `python -m asistente.indexar`.

Lee los Markdown de docs/markdown/ del repo y escribe indice/indice.json (ignorado en git).
Imprime sólo conteos, nunca texto de los documentos.
"""
from pathlib import Path

from asistente.indice import Indice, fragmentar

RAIZ_L3 = Path(__file__).resolve().parent.parent
RAIZ_REPO = RAIZ_L3.parent.parent
CARPETA_FUENTES = RAIZ_REPO / "docs" / "markdown"
RUTA_INDICE = RAIZ_L3 / "indice" / "indice.json"

# Sigla del documento (la misma que usan las citas del banco) → archivo en docs/markdown/.
FUENTES = {
    "DT": "1_documento-tecnico-utec-lidia.md",
    "Prot": "protocolo-acceso-confidencialidad-resguardo-hce.md",
}


def construir(carpeta: Path = CARPETA_FUENTES) -> Indice:
    fragmentos = []
    for documento, archivo in FUENTES.items():
        fragmentos.extend(fragmentar((carpeta / archivo).read_text(encoding="utf-8"), documento))
    return Indice(fragmentos)


def main() -> None:
    indice = construir()
    indice.guardar(RUTA_INDICE)
    for documento in FUENTES:
        propios = [f for f in indice.fragmentos if f.documento == documento]
        print(f"{documento}: {len(propios)} fragmentos en {len({f.seccion for f in propios})} secciones")
    print(f"Índice: {RUTA_INDICE.relative_to(RAIZ_L3)}")


if __name__ == "__main__":
    main()
