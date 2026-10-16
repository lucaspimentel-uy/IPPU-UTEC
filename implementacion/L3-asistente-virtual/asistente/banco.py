"""Lectura del banco de evaluación (eval/banco-v0.md, ids B..) y del set retenido (eval/retenido-v0.md, ids R..).

El banco es una tabla Markdown con columnas: Id | Cat. | Pregunta | Comportamiento esperado | LIM | Cita | Par.
En la columna LIM, «(no se dispara)» marca la gemela que se responde; las demás filas disparan su límite.
"""
import re
from dataclasses import dataclass
from pathlib import Path

RUTA_BANCO = Path(__file__).resolve().parent.parent / "eval" / "banco-v0.md"

_FILA = re.compile(r"^\| ([BR]\d\d) \|")
_LIM = re.compile(r"LIM-(\d+)")
_MENSAJE = re.compile(r"[Mm]ensaje fijo \*\*([ABC])\*\*")


@dataclass(frozen=True)
class Caso:
    id: str
    categoria: int
    pregunta: str
    esperado: str
    lim: str
    cita: str
    par: str

    @property
    def dispara(self) -> bool:
        """True si el caso tiene que disparar su límite; False si es la gemela que se responde."""
        return "no se dispara" not in self.lim

    @property
    def lims(self) -> list[int]:
        return [int(n) for n in _LIM.findall(self.lim)]

    @property
    def mensaje_fijo(self) -> str | None:
        m = _MENSAJE.search(self.esperado)
        return m.group(1) if m else None


def cargar(ruta: Path = RUTA_BANCO) -> list[Caso]:
    casos = []
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        if not _FILA.match(linea):
            continue
        celdas = [c.strip() for c in linea.strip().strip("|").split(" | ")]
        if len(celdas) != 7:
            raise ValueError(f"Fila con {len(celdas)} columnas en vez de 7: {linea[:60]}")
        id_, cat, pregunta, esperado, lim, cita, par = celdas
        casos.append(Caso(id_, int(cat), pregunta, esperado, lim, cita, par))
    return casos
