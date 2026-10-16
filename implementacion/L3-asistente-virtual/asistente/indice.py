"""Índice léxico (BM25) sobre documentos Markdown, con recuperación que devuelve documento y sección.

Sólo biblioteca estándar. No genera respuestas: devuelve fragmentos con su cita (plan §4, F1-b).
"""
import json
import math
import re
import unicodedata
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path

MAX_PALABRAS = 400
UMBRAL_POR_DEFECTO = 0.0
K1 = 1.5
B = 0.75

_ENCABEZADO = re.compile(r"^(#{1,3})\s+(.*\S)\s*$")
_PALABRA = re.compile(r"\w+")
_VACIAS = frozenset(
    "a al ante con de del desde el en entre es la las lo los o para por que se sin su sus u un una uno y".split()
)


@dataclass(frozen=True)
class Fragmento:
    id: str
    documento: str
    seccion: str
    texto: str


@dataclass(frozen=True)
class Resultado:
    documento: str
    seccion: str
    puntaje: float
    texto: str


def tokenizar(texto: str) -> list[str]:
    """Minúsculas, sin tildes, sin palabras vacías."""
    sin_tildes = "".join(
        c for c in unicodedata.normalize("NFKD", texto.lower()) if not unicodedata.combining(c)
    )
    return [t for t in _PALABRA.findall(sin_tildes) if t not in _VACIAS]


def _contar_palabras(texto: str) -> int:
    return len(texto.split())


def _partir(bloque: str, max_palabras: int) -> list[str]:
    """Agrupa párrafos (separados por línea en blanco) sin pasar de max_palabras.

    Un párrafo que solo ya supera el máximo (por ejemplo, una tabla) se parte por líneas.
    """
    unidades = []
    for parrafo in re.split(r"\n\s*\n", bloque.strip()):
        if _contar_palabras(parrafo) > max_palabras:
            unidades.extend(l for l in parrafo.splitlines() if l.strip())
        elif parrafo.strip():
            unidades.append(parrafo.strip())
    partes, actual, n = [], [], 0
    for u in unidades:
        p = _contar_palabras(u)
        if actual and n + p > max_palabras:
            partes.append("\n\n".join(actual))
            actual, n = [], 0
        actual.append(u)
        n += p
    if actual:
        partes.append("\n\n".join(actual))
    return partes


def fragmentar(markdown: str, documento: str, max_palabras: int = MAX_PALABRAS) -> list[Fragmento]:
    """Corta por secciones ## y ###. La sección es la ruta «## título > ### título».

    El texto antes del primer ## queda en la sección «(inicio)». Una sección de más de max_palabras se parte
    por párrafos.
    """
    secciones: list[tuple[str, list[str]]] = [("(inicio)", [])]
    h2 = None
    for linea in markdown.splitlines():
        m = _ENCABEZADO.match(linea)
        if m and len(m.group(1)) == 2:
            h2 = m.group(2)
            secciones.append((h2, []))
        elif m and len(m.group(1)) == 3:
            secciones.append((f"{h2} > {m.group(2)}" if h2 else m.group(2), []))
        else:
            secciones[-1][1].append(linea)
    fragmentos = []
    for seccion, lineas in secciones:
        bloque = "\n".join(lineas).strip()
        if not bloque:
            continue
        for parte in _partir(bloque, max_palabras):
            fragmentos.append(Fragmento(f"{documento}#{len(fragmentos) + 1:03d}", documento, seccion, parte))
    return fragmentos


class Indice:
    def __init__(self, fragmentos: list[Fragmento], k1: float = K1, b: float = B):
        self.fragmentos = list(fragmentos)
        self.k1, self.b = k1, b
        self._tf = [Counter(tokenizar(f"{f.seccion}\n{f.texto}")) for f in self.fragmentos]
        self._largos = [sum(tf.values()) for tf in self._tf]
        self._promedio = (sum(self._largos) / len(self._largos)) if self._largos else 0.0
        df: Counter = Counter()
        for tf in self._tf:
            df.update(tf.keys())
        self._df = dict(sorted(df.items()))

    def _idf(self, termino: str) -> float:
        n, d = len(self.fragmentos), self._df.get(termino, 0)
        return math.log(1 + (n - d + 0.5) / (d + 0.5))

    def _puntaje(self, i: int, terminos: list[str]) -> float:
        tf, largo = self._tf[i], self._largos[i]
        total = 0.0
        for t in terminos:
            f = tf.get(t, 0)
            if f:
                norma = 1 - self.b + self.b * largo / self._promedio
                total += self._idf(t) * f * (self.k1 + 1) / (f + self.k1 * norma)
        return total

    def buscar(self, consulta: str, k: int = 5, umbral: float = UMBRAL_POR_DEFECTO) -> list[Resultado]:
        """Los k fragmentos con puntaje mayor que el umbral, del más al menos relevante; [] si no hay ninguno."""
        terminos = tokenizar(consulta)
        puntajes = [(self._puntaje(i, terminos), i) for i in range(len(self.fragmentos))]
        elegidos = sorted((p for p in puntajes if p[0] > umbral), key=lambda p: (-p[0], p[1]))[:k]
        return [
            Resultado(self.fragmentos[i].documento, self.fragmentos[i].seccion, round(p, 6), self.fragmentos[i].texto)
            for p, i in elegidos
        ]

    def serializar(self) -> str:
        datos = {
            "parametros": {"k1": self.k1, "b": self.b},
            "fragmentos": [asdict(f) for f in self.fragmentos],
            "df": self._df,
        }
        return json.dumps(datos, ensure_ascii=False, indent=1, sort_keys=True)

    def guardar(self, ruta: Path) -> None:
        ruta.parent.mkdir(parents=True, exist_ok=True)
        ruta.write_text(self.serializar(), encoding="utf-8")

    @classmethod
    def cargar(cls, ruta: Path) -> "Indice":
        datos = json.loads(ruta.read_text(encoding="utf-8"))
        return cls([Fragmento(**f) for f in datos["fragmentos"]], **datos["parametros"])
