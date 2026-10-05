"""Genera `backend/app/data/catalogos_iniciales.json` — M12.1.

    python herramientas/generar_catalogos_backend.py [--check]

**Por qué existe.** Los catálogos del backend no se editan a mano (`CLAUDE.md`):
transcribir 60 descriptores o 12 fichas garantiza deriva entre la fuente y la
copia. En M11.2 la generación se hizo con un script `vm` de Node que no quedó
versionado; esto lo reemplaza y queda en el repo.

**De dónde sale cada sección.**

⚠️ **2026-09-16 (decisión de Lucas, pendiente de asentar en `handoff.md` §5):** el Prototipo v4
**dejó de ser fuente normativa** — es un insumo a consultar, no una especificación a la que haya
que converger. Por eso mover una sección de la demo al prototipo **ya no tiene la justificación
que tenía** ("la fuente autoritativa cambió", M12.1–M12.8 tal como estaba escrito): los dos
artefactos tienen la misma procedencia (son de IPPU, uno más nuevo que el otro) y mover datos
entre ellos sólo arriesga cambiarlos sin ganar fidelidad. **Regla vigente:** una sección se
regenera desde el prototipo únicamente cuando el prototipo trae el dato **igual, verbatim** —
ahí regenerar es sólo declarar la fuente correcta, no un cambio de dato. Si el prototipo lo trae
distinto o incompleto, la sección **se queda** donde estaba, con el motivo anotado.

| Sección | Fuente |
|---|---|
| `idea_dimension`, `idea_nivel`, `ippu_item`, `baremo_categoria`, `servicio` | lo ya generado desde la **demo v4.1** (se preserva tal cual — ver `DESDE_LA_DEMO` para el motivo de cada una) |
| `categoria_documento` | **inline en `mDocs()` del Prototipo v4** (array `cats`, no es catálogo estructurado — caso "inline en un widget" de §5.50/J1). Los 12 nombres y los 4 marcados "Registro histórico" ya eran éstos en la demo: cambia la fuente declarada, no el dato — verificado verbatim antes de mover. |
| `taller` (M12.3 · D5) | **`CAT_TALLERES` del Prototipo v4** — los 14 reales, en reemplazo de los 8 de la demo |
| `severidad_nivel` (M12.4) | `SEV_ETQ`, `SEV_CS`, `SEV_CRR` y `SEV_APOYO` del Prototipo v4, en una fila por grado |
| `idea_nivel.descriptor_breve`, `idea_dimension.que_evalua` | `IDEA_DESC` del **Prototipo v4** |
| `idea_ficha`, `idea_ejemplo`, `idea_regla` | `IDEA_FICHAS`, `IDEA_EJ`, `IDEA_REGLAS` del Prototipo v4 |
| `banda_idea`, `delta_interpretacion` | `ideaInterpreta()` y `deltaInterpreta()` del HTML del Prototipo v4 |
| `estado_inclusion` (M12.5) | **`INC_ESTADOS` del Prototipo v4** — los 7 estados con su descripción; el `cls` CSS se guarda como nivel de semáforo |
| `catalogo_centro_educativo` (M12.5) | **nada que extraer: nace vacío.** El prototipo no tiene catálogo de centros y los nombres de escuela de nuestra demo son relleno propio (§5.50) |
| `recordatorio`, `grupo` | acá abajo, del Manual y del plan M12 (no hay literal que extraer) |

**Los 60 `descriptor` NO se tocan.** Son el texto literal de la fuente oficial
(Rivière, 1997/2002); los del prototipo son paráfrasis condensadas de los mismos
niveles y entran aparte, como `descriptor_breve`. El fundamento completo está en
el docstring de `IdeaNivel` y en la bitácora del 2026-08-14.

`--check` no escribe: falla si el archivo generado difiere del que está en el
repo. Sirve para CI y para detectar ediciones a mano.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
# `docs/prototipo-v4/` NO está bajo docs/fuentes/ a propósito (handoff.md §5.30):
# esa carpeta es respaldo que no se lee, y esto es un insumo de build que sí se lee acá.
PROTO_JSON = RAIZ / "docs" / "prototipo-v4" / "prototipo-v4-catalogos.json"
PROTO_HTML = RAIZ / "docs" / "prototipo-v4" / "HCE_IPPU_Prototipo_v4.html"
SALIDA = (
    RAIZ / "implementacion" / "L1-hce-idea" / "backend" / "app" / "data"
    / "catalogos_iniciales.json"
)

#: Secciones que vienen de la demo v4.1 y que este script **no** regenera: las
#: copia del archivo existente, verbatim. **No son items pendientes** — cada
#: una tiene un motivo permanente (2026-09-16, ver el aviso de arriba: el
#: Prototipo v4 no es fuente normativa, así que no hay "hasta que se regeneren"):
#:   - `idea_nivel` — el `descriptor` es el texto oficial de Rivière (1997/2002);
#:     el `IDEA_DESC` del prototipo es una paráfrasis condensada de otra fuente
#:     (decisión de M12.1, "los 60 descriptores NO se reemplazan"). Nunca va a
#:     salir de acá — no es un `descriptor_breve`, que sí viene del prototipo.
#:   - `servicio` — el prototipo sólo nombra los tres servicios en prosa
#:     (§HCE_IPPU_Prototipo_v4.html:1637,1976); no trae `clave`/`activo` en
#:     ninguna estructura. Inventar esos valores sería el mecanismo de §5.37.
#:   - `idea_dimension`, `ippu_item`, `baremo_categoria` — el prototipo SÍ trae
#:     algo parecido (`IDEA_DIMS`, `IPPU_ITEMS`, `BUND_CATS`), pero no idéntico:
#:     `idea_dimension` exigiría **derivar** `codigo`/`escala` (generar dato, no
#:     leerlo) y los otros dos son "parecidos", no verbatim. Se quedan hasta que
#:     alguien verifique campo por campo que no cambia nada — no antes.
DESDE_LA_DEMO = (
    "idea_dimension", "idea_nivel", "ippu_item", "baremo_categoria", "servicio",
)

#: La cita del instrumento va **siempre** "1997/2002" (regla de M12.1): la
#: edición de 2002 es la que circula. El prototipo escribe "Rivière (1997)".
CITA_RIVIERE = re.compile(r"Rivi[èe]re\s*\((\d{4})\)")

#: Vocabulario institucional §8.1: «severo/muy severo», **nunca** «grave/muy
#: grave». Es regla de IPPU, pero su propio prototipo la incumple en un punto
#: (`IDEA_FICHAS[6].nc`: "un trastorno grave de anticipación"). Se normaliza al
#: generar y **se reporta**, para que la corrección quede a la vista y no
#: parezca que el texto vino así de origen. Espeja
#: `backend/app/core/constantes.py::VOCABULARIO_PROHIBIDO`.
VOCABULARIO = ((re.compile(r"\bgrave\b"), "severo"), (re.compile(r"\bgraves\b"), "severos"))

#: Sustituciones de vocabulario aplicadas en la corrida, para el reporte final.
_NORMALIZADOS: list[tuple[str, str]] = []


# --------------------------------------------------------------------------
# Autoría propia — no hay literal que extraer del prototipo
# --------------------------------------------------------------------------

#: Los 8 recordatorios (M12.1, de 4). Los cuatro primeros ya existían y salían
#: de la demo; los cuatro nuevos son los vencimientos que el Prototipo v4 tiene
#: sueltos dentro de cada módulo. **Ninguno bloquea una firma** (§4): informan.
RECORDATORIOS = [
    ("lb",   "Aplicación del IDEA (HCE-LB) en las semanas 2–3 del ingreso",
     "Semanas 2–3 del ingreso"),
    ("pa",   "Protocolo A (HCE-PA) durante el receso de julio", "Julio"),
    ("pb",   "Protocolo B (HCE-PB) en la última semana lectiva", "Diciembre"),
    ("ic",   "Informe de Cierre (HCE-IC) dentro de los 10 días hábiles posteriores al Protocolo B",
     "10 días hábiles post-PB"),
    ("ayex", "Vencimiento de la Ayuda Extraordinaria (AYEX): avisar 60 y 30 días antes",
     "60/30 días antes del vencimiento"),
    ("vf",   "Vencimiento de la valoración funcional (HCE-VF): avisar 90 y 30 días antes",
     "90/30 días antes del vencimiento"),
    ("inc",  "Inclusión educativa (HCE-INC) sin gestiones registradas por más de 60 días",
     "60 días sin gestiones"),
    ("inau", "Informes semestrales de INAU pendientes de envío", "Semestral"),
]

#: Los 5 grupos reales de IPPU (D9 · D5). Los cuatro nombres por color eran
#: datos de demostración: la reunión del 2026-08-21 dio los nombres reales
#: (`handoff.md` §5.37) y §5.61 fijó la ejecución del renombrado acá. Se
#: siembran para el año en curso como punto de partida; de ahí en más los
#: administra coordinación desde la app, y el seed **nunca** los vuelve a tocar
#: (son insert-only). Distintos entre sí → `UNIQUE(nombre, anio)` se cumple.
#:
#: ✅ **«Taller de Adolescentes» es un grupo**: se siembra como fila de `grupo`
#: (`handoff.md` §5.61) y **IPPU lo confirmó el 2026-10-05** (pregunta **A5**,
#: `handoff.md` §5.107). Taller Terapéutico y Clínica son otros servicios.
GRUPOS_ANIO = 2026
GRUPOS = [
    "Inicial",
    "Escolares",
    "Preadolescentes",
    "Adolescentes",
    "Taller de Adolescentes",
]


# --------------------------------------------------------------------------
# Extracción del HTML del prototipo
# --------------------------------------------------------------------------
def _cuerpo(js: str, nombre: str) -> str:
    """Devuelve el cuerpo de `function <nombre>(...)` del HTML del prototipo."""
    i = js.index(f"function {nombre}(")
    j = js.index("{", i)
    prof = 0
    for k in range(j, len(js)):
        if js[k] == "{":
            prof += 1
        elif js[k] == "}":
            prof -= 1
            if prof == 0:
                return js[j + 1 : k]
    raise ValueError(f"no cierra la función {nombre}")


_CAMPO = r"(?:[^'\\]|\\.)*"


def _objetos(cuerpo: str, campos: tuple[str, ...]) -> list[tuple[str, ...]]:
    """Saca los literales `{a:'…', b:'…'}` de un cuerpo de función, en orden."""
    patron = r"\{" + r",\s*".join(f"{c}:'({_CAMPO})'" for c in campos) + r"\}"
    return [m.groups() for m in re.finditer(patron, cuerpo)]


def _condiciones(cuerpo: str, var: str) -> list[str]:
    """Las guardas `if(t<=15)` / `if(d>=13)` en orden, sin el `return` final."""
    return re.findall(rf"if\(\s*{var}\s*([<>=]{{2,3}})\s*(-?\d+)\s*\)", cuerpo)


def _limpiar(s: str) -> str:
    """Desescapa el literal JS y le aplica las reglas de texto de M12.1."""
    return _cita(s.replace("\\'", "'").replace("\\\\", "\\").strip())


def bandas_idea(js: str) -> list[dict]:
    """Las 6 bandas de `ideaInterpreta(t)`, con sus cortes reconstruidos.

    El prototipo las escribe como una cascada de `t<=N`; acá se convierten a
    tramos cerrados `[min, max]` porque una tabla ordenable es lo que hace que
    IPPU pueda correr un corte sin tocar código.
    """
    cuerpo = _cuerpo(js, "ideaInterpreta")
    valores = _objetos(cuerpo, ("perfil", "ns", "txt"))
    topes = [int(n) for _, n in _condiciones(cuerpo, "t")]
    assert len(valores) == len(topes) + 1 == 6, (len(valores), len(topes))

    filas, piso = [], 0
    for orden, (perfil, ns, txt) in enumerate(valores, start=1):
        techo = topes[orden - 1] if orden <= len(topes) else 96
        filas.append({
            "total_min": piso, "total_max": techo,
            "perfil": _limpiar(perfil), "nivel_dsm": _limpiar(ns),
            "texto": _limpiar(txt), "orden": orden,
        })
        piso = techo + 1
    return filas


def delta_interpretacion(js: str) -> list[dict]:
    """Los 6 tramos de `deltaInterpreta(d)`.

    Los extremos quedan **abiertos** (`None`): el primero no tiene techo y el
    último no tiene piso. El último es además el que lleva `alerta`, que es de
    donde pasa a derivarse la alerta institucional Δ ≤ −7 (antes, un número
    suelto en el código).
    """
    cuerpo = _cuerpo(js, "deltaInterpreta")
    valores = _objetos(cuerpo, ("t", "a", "c"))
    guardas = _condiciones(cuerpo, "d")
    assert len(valores) == len(guardas) + 1 == 6, (len(valores), len(guardas))

    signo = {"d-pos": "positivo", "d-zero": "neutro", "d-neg": "negativo"}
    filas, techo = [], None                       # el primer tramo no tiene techo
    for orden, (etq, accion, clase) in enumerate(valores, start=1):
        if orden <= len(guardas):
            op, n = guardas[orden - 1]
            n = int(n)
            piso, techo_tramo = (n, techo) if op == ">=" else (n, n)  # ">=" o "==="
        else:
            piso, techo_tramo = None, techo       # el último no tiene piso
        filas.append({
            "delta_min": piso, "delta_max": techo_tramo,
            "etiqueta": _limpiar(etq), "accion": _limpiar(accion),
            "signo": signo[clase], "alerta": orden == len(valores), "orden": orden,
        })
        techo = piso - 1 if piso is not None else None
    return filas


# --------------------------------------------------------------------------
# Catálogos IDEA del JSON extraído
# --------------------------------------------------------------------------
def fichas(proto: dict) -> list[dict]:
    campos = [
        ("codigo", "cod"), ("titulo", "tit"), ("escala_nombre", "esc"),
        ("definicion", "def"), ("objetivo", "obj"), ("indicadores", "ind"),
        ("no_confundir", "nc"), ("errores_frecuentes", "err"),
        ("preguntas_guia", "pg"), ("claves_martos", "martos"),
        ("nota_evidencia", "evid"),
    ]
    return [
        {"dimension_id": i, **{nuestro: _cita(f.get(suyo)) for nuestro, suyo in campos}}
        for i, f in enumerate(proto["IDEA_FICHAS"], start=1)
    ]


def ejemplos(proto: dict) -> list[dict]:
    """48 filas: 12 dimensiones × niveles 8, 6, 4, 2. El prototipo no trae e0."""
    return [
        {"dimension_id": i, "valor": v, "ejemplo": _cita(e[f"e{v}"])}
        for i, e in enumerate(proto["IDEA_EJ"], start=1)
        for v in (8, 6, 4, 2)
    ]


def talleres(proto: dict) -> list[dict]:
    """Los **14 talleres reales** de `CAT_TALLERES` (M12.3 · D5, `handoff.md` §5.14).

    Reemplazan a los 8 que había: ninguno coincide: los nuestros salieron de la
    demo, que los inventó. `CAT_TALLERES` es un array plano de nombres, así que
    lo único que aporta el prototipo es el nombre y su orden de aparición.

    `grupos_orientados` sale **vacío** y `retirado_en` en `None`: a qué grupos se
    orienta cada taller y cuándo se retira lo decide coordinación desde la app
    (`tallerGrupos` / `tallerToggle` en el prototipo). Vacío significa «sin
    orientación registrada», no «ninguno» — inventarle grupos sería poner en el
    repo un dato de gestión que IPPU no nos dio.
    """
    nombres = proto["CAT_TALLERES"]
    assert len(nombres) == 14, f"CAT_TALLERES trae {len(nombres)}, se esperaban 14"
    assert max(len(n) for n in nombres) <= 80, "un nombre no entra en taller.nombre"
    return [
        {"nombre": _cita(n), "orden": i, "grupos_orientados": [], "retirado_en": None}
        for i, n in enumerate(nombres, start=1)
    ]


def severidad_niveles(proto: dict) -> list[dict]:
    """Los 3 grados del DSM-5-TR de HCE-SEV (M12.4).

    Las cuatro constantes del prototipo —`SEV_ETQ`, `SEV_CS`, `SEV_CRR` y
    `SEV_APOYO`— están todas indexadas por el mismo grado "1"/"2"/"3" y el módulo
    las renderiza como **una sola tabla de cuatro columnas**. Se generan como una
    fila por grado, no como tres catálogos paralelos con la misma clave.

    Es todo texto de IPPU: pasa por `_cita()` como el resto, así que le aplican
    las dos reglas de M12.1 (cita de Rivière y vocabulario §8.1).
    """
    etq, cs, crr, apoyo = (
        proto["SEV_ETQ"], proto["SEV_CS"], proto["SEV_CRR"], proto["SEV_APOYO"]
    )
    grados = ["1", "2", "3"]
    for nombre, tabla in (
        ("SEV_ETQ", etq), ("SEV_CS", cs), ("SEV_CRR", crr), ("SEV_APOYO", apoyo)
    ):
        assert sorted(tabla) == grados, f"{nombre} no trae exactamente los grados 1–3"
    assert max(len(v) for v in etq.values()) <= 60, "una etiqueta no entra en severidad_nivel.etiqueta"
    return [
        {
            "grado": int(g),
            "etiqueta": _cita(etq[g]),
            "descriptor_cs": _cita(cs[g]),
            "descriptor_crr": _cita(crr[g]),
            "apoyos": _cita(apoyo[g]),
        }
        for g in grados
    ]


def estados_inclusion(proto: dict) -> list[dict]:
    """Los 7 estados del caso de HCE-INC (M12.5), desde `INC_ESTADOS`.

    **Es el único de los cinco vocabularios de HCE-INC que se siembra como
    tabla**: los otros cuatro (`INC_TIPOS`, `INC_TEMAS`, `INC_MEDIOS`,
    `INC_ROLES`) son listas planas sin atributos y viven en
    `app/core/constantes.py`. El criterio, con la evidencia de cada uno, está en
    `handoff.md` §5.50 (J1).

    Se extraen `n` (nombre) y `d` (descripción) tal cual, y **`cls` se traduce**:
    el prototipo guarda ahí una clase CSS (`inc-warn`) y acá va el nivel de
    semáforo sin prefijo (`warn`). Es el principio de la ronda M12 —se toma el
    vocabulario, se descarta la implementación—: el nombre de una clase de hoja
    de estilos no es un dato del dominio.
    """
    estados = proto["INC_ESTADOS"]
    assert len(estados) == 7, f"INC_ESTADOS trae {len(estados)}, se esperaban 7"
    filas = []
    for i, e in enumerate(estados):
        cls = e["cls"]
        assert cls.startswith("inc-"), f"clase inesperada en INC_ESTADOS: {cls}"
        semaforo = cls[len("inc-"):]
        assert semaforo in ("ok", "warn", "danger", "off"), semaforo
        assert len(e["n"]) <= 60, f"el nombre no entra en estado_inclusion.nombre: {e['n']}"
        filas.append({
            "nombre": _cita(e["n"]),
            "orden": i,
            "semaforo": semaforo,
            "descripcion": _cita(e["d"]),
        })
    assert filas[-1]["nombre"] == "Sin registrar", (
        "«Sin registrar» dejó de ser el último de INC_ESTADOS: es el estado "
        "inicial y el único no asignable (core/constantes.py)"
    )
    return filas


def categorias_documento(js: str) -> list[dict]:
    """Las 12 categorías de HCE-DOC, del array `cats` embebido en `mDocs()`.

    No es un catálogo estructurado del JSON extraído (como `taller` o
    `INC_ESTADOS`): es un array plano de literales, **inline en el cuerpo de
    la función** que arma la tabla del módulo — el caso "inline en un widget"
    de §5.50 (J1). Se extrae con el mismo mecanismo que bandas/delta (parsear
    el cuerpo de la función), no porque el dato haya cambiado: los 12 nombres
    y los 4 marcados "Registro histórico" ya eran exactamente éstos en la
    demo v4.1 — verificado verbatim antes de mover. Cambia sólo qué fuente
    declara el generador, no el contenido.
    """
    cuerpo = _cuerpo(js, "mDocs")
    m = re.search(r"const cats=\[(.*?)\];", cuerpo, re.DOTALL)
    assert m, "no se encontró el array `cats` en mDocs()"
    crudos = re.findall(r"'(" + _CAMPO + r")'", m.group(1))
    assert len(crudos) == 12, f"cats trae {len(crudos)}, se esperaban 12"
    nombres = [_limpiar(c) for c in crudos]
    return [
        {
            "nombre": n,
            "es_registro_historico": n.startswith("Registro histórico"),
            "orden": i,
        }
        for i, n in enumerate(nombres, start=1)
    ]


def reglas(proto: dict) -> list[dict]:
    return [
        {"regla": _cita(r["r"]), "descripcion": _cita(r["d"]),
         "fuente": _cita(r.get("f")), "orden": i}
        for i, r in enumerate(proto["IDEA_REGLAS"], start=1)
    ]


def _cita(texto: str | None) -> str | None:
    """Aplica las dos reglas de texto de M12.1 a un campo del prototipo.

    1. «Rivière (1997)» → «Rivière (1997/2002)».
    2. Vocabulario §8.1: «grave» → «severo».

    Son las dos únicas modificaciones que este script hace al texto de IPPU, y
    las dos salen de reglas escritas del propio Manual.
    """
    if texto is None:
        return None
    salida = CITA_RIVIERE.sub(
        lambda m: f"Rivière ({m.group(1)}/2002)" if m.group(1) == "1997" else m.group(0),
        texto,
    )
    for patron, reemplazo in VOCABULARIO:
        nuevo = patron.sub(reemplazo, salida)
        if nuevo != salida:
            _NORMALIZADOS.append((salida, nuevo))
            salida = nuevo
    return salida


# --------------------------------------------------------------------------
def construir() -> dict:
    proto = json.loads(PROTO_JSON.read_text(encoding="utf-8"))
    js = PROTO_HTML.read_text(encoding="utf-8")
    actual = json.loads(SALIDA.read_text(encoding="utf-8"))

    datos: dict = {
        "_origen": (
            "Generado por herramientas/generar_catalogos_backend.py (M12.1). "
            "Instrumentos y catálogos base: demo v4.1. "
            "Bandas, Δ, fichas, ejemplos, reglas, descriptor_breve, talleres, "
            "niveles de severidad DSM-5-TR, estados de inclusión y categorías "
            "de documento: Prototipo v4 de IPPU (docs/prototipo-v4/). "
            "Recordatorios y grupos: Manual + plan M12. "
            "NO editar a mano: correr el script."
        ),
    }
    for seccion in DESDE_LA_DEMO:
        datos[seccion] = actual[seccion]

    # `que_evalua` y `descriptor_breve`: la versión corta del prototipo, encima
    # de lo nuestro pero **al lado**, nunca en lugar de `descriptor`.
    desc = proto["IDEA_DESC"]
    por_dim = {d["id"]: d for d in datos["idea_dimension"]}
    for i, d in enumerate(desc, start=1):
        por_dim[i]["que_evalua"] = _cita(d["que"])
    for nivel in datos["idea_nivel"]:
        nivel["descriptor_breve"] = _cita(desc[nivel["dimension_id"] - 1][f"n{nivel['valor']}"])

    datos["categoria_documento"] = categorias_documento(js)
    datos["taller"] = talleres(proto)
    datos["estado_inclusion"] = estados_inclusion(proto)
    # M12.5: el catálogo de centros educativos **nace vacío y es correcto que
    # así sea**. El Prototipo v4 no tiene catálogo de centros (`centro` es texto
    # libre) y los seis nombres de escuela que se ven en `demo/js/inclusion.js`
    # son relleno de nuestra propia demo: sembrarlos pondría en el sistema de
    # IPPU centros inventados por nosotros — el mecanismo de §5.37 con otro
    # sujeto. La sección se declara igual para que `--check` la cubra y para que
    # el día que IPPU entregue su lista se vea dónde va.
    datos["catalogo_centro_educativo"] = []
    datos["severidad_nivel"] = severidad_niveles(proto)
    datos["idea_ficha"] = fichas(proto)
    datos["idea_ejemplo"] = ejemplos(proto)
    datos["idea_regla"] = reglas(proto)
    datos["banda_idea"] = bandas_idea(js)
    datos["delta_interpretacion"] = delta_interpretacion(js)
    datos["recordatorio"] = [
        {"clave": c, "texto": t, "periodo": p, "activo": True, "orden": i}
        for i, (c, t, p) in enumerate(RECORDATORIOS, start=1)
    ]
    datos["grupo"] = [{"nombre": n, "anio": GRUPOS_ANIO} for n in GRUPOS]
    return datos


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true",
                    help="no escribe; falla si el archivo del repo difiere")
    args = ap.parse_args()

    texto = json.dumps(construir(), ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if SALIDA.read_text(encoding="utf-8") == texto:
            print(f"OK — {SALIDA.name} está al día.")
            return 0
        print(f"DESFASADO — {SALIDA} difiere de lo que genera este script.", file=sys.stderr)
        return 1

    SALIDA.write_text(texto, encoding="utf-8")
    datos = json.loads(texto)
    print(f"Escrito {SALIDA}")
    for k, v in datos.items():
        if isinstance(v, list):
            print(f"  {k:22} {len(v):3}")
    if _NORMALIZADOS:
        print(f"\nVocabulario §8.1 normalizado en {len(_NORMALIZADOS)} texto(s):")
        for antes, despues in _NORMALIZADOS:
            print(f"  - {antes}\n  + {despues}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
