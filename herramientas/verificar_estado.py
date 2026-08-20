"""Verifica que lo que la documentación afirma coincida con lo que el repo es.

    python herramientas/verificar_estado.py [--check]

**Por qué existe.** La documentación de este proyecto se desfasó del repo **cuatro
veces** en la ronda M12, y las cuatro se descubrieron de casualidad:

1. `docs/estructura-repositorio.md` decía **36 tablas** cuando había 38.
2. Decía **123 tests** cuando había 240.
3. Nombraba una migración —`f432ea139fd9_..._m12_4.py`— que ya no existía.
4. El §6 de `demo/F1-navegacion` decía «pusheado hasta `648cb04`» cuando el remoto
   tenía `5544e71`.

Ninguna era grave por separado; juntas significan que **nadie puede confiar en un
número leído en un `.md`** sin ir a contarlo. Este script va y lo cuenta.

Sigue el precedente de `generar_catalogos_backend.py --check`: **silencioso cuando
todo coincide, exit ≠ 0 con el diff cuando no.** Va en el checklist de cierre de
sesión (`handoff.md` §12.4).

**Qué mide, y de dónde.**

| Dato | Se mide de | Se compara contra |
|---|---|---|
| Tablas | `__tablename__` en `backend/app/models/*.py`, reportado por archivo | los `.md` que declaran un número de tablas |
| Migración | nombre de archivo y `revision` en `alembic/versions/` | los `.md` que nombran la migración |
| Un solo head | `down_revision` de cada archivo de migración | — (falla sola si hay más de una cabeza) |
| Tests | `pytest --collect-only -q`, **sólo si Docker está arriba** | los `.md` que declaran «N passed» |

⚠️ **El conteo de tests no se estima nunca.** La guardia de `tests/conftest.py`
(2026-08-15) aborta `pytest` si el contenedor no está arriba, así que sin Docker
este script **reporta el dato como no medido** en vez de inventarlo. Un número
inventado acá sería exactamente el problema que el script existe para resolver.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

# La consola de Windows es cp1252 y este script imprime «·», «—» y acentos.
# Sin esto revienta con UnicodeEncodeError en vez de reportar el desfasaje.
for _f in (sys.stdout, sys.stderr):
    try:
        _f.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, OSError):
        pass

RAIZ = Path(__file__).resolve().parent.parent
BACKEND = RAIZ / "implementacion" / "L1-hce-idea" / "backend"
MODELOS = BACKEND / "app" / "models"
VERSIONES = BACKEND / "alembic" / "versions"

# Documentos que hacen afirmaciones sobre el estado del backend. Si alguno declara
# un número, tiene que ser el número real.
DOCS = [
    RAIZ / "handoff.md",
    RAIZ / "README.md",
    RAIZ / "CLAUDE.md",
    RAIZ / "docs" / "estructura-repositorio.md",
    BACKEND / "README.md",
]

# --------------------------------------------------------------------------
# Qué NO se compara: la historia
# --------------------------------------------------------------------------
# El commit 027d6dd ya hizo esta distinción a mano y vale la pena copiarla: «los
# conteos por sub-módulo de §6, §13 y del PLAN-M12 (33/34/35/36 tablas, 54/74/92/123
# tests) son correctos para su fecha». Un verificador que los marque está gritando
# que el pasado fue el pasado.
#
# La regla fuerte es **estructural, no de prosa**. En `handoff.md` el corte es
# `## 5. Decisiones`: de ahí para abajo **nada afirma el estado de hoy**.
#   · §5  son decisiones **fechadas y firmadas**: dicen lo que era cierto ese día, y
#         se enmiendan escribiendo una entrada nueva, no editando la vieja (§12.6).
#   · §6  mezcla pendientes vivos con ítems ya tildados que citan conteos de su fecha.
#   · §13 es la bitácora, historia por definición.
# Lo que sí afirma el presente es la **cabecera** (§0, «Foco actual», «Tests: …»), y
# es exactamente donde ocurrieron los desfasajes reales: §0.5 decía «123 passed».
#
# Adivinar por redacción fue el primer intento: marcaba 13 líneas, las 13 correctas
# para su fecha. Un verificador ruidoso no se corre, y uno que no se corre no sirve.
#
# ⚠️ **Límite conocido, dicho de frente:** con este corte, si alguien mete un número
# equivocado *dentro* de §5 o §6 de `handoff.md`, el script no lo ve. Se acepta: el
# falso negativo cuesta una línea mal en un registro histórico; el falso positivo
# cuesta que nadie vuelva a correr el script. Los demás documentos se revisan enteros.
FIN_DE_LO_VIGENTE = re.compile(r"^##\s*5\.\s", re.IGNORECASE)
SOLO_CABECERA = {"handoff.md"}

# Y dentro de lo vigente todavía quedan frases en pasado: un pendiente ya tildado
# (`- [x]`), una corrección que cita el número viejo, un verbo en pretérito.
#
# ⚠️ Acá NO va el nombre de un sub-módulo (`M12.7`, `M11.2`). Fue el primer intento y
# **producía el falso negativo exacto que este script existe para evitar**: la línea
# real de `backend/README.md` que decía «36 tablas» es *«…de M12.7: **38 tablas** y
# catálogos cargados»*, y mencionar el sub-módulo que produjo el estado actual no la
# vuelve histórica. Probado inyectando el desfasaje: con esa regla puesta, pasaba en
# verde. Para `handoff.md` el corte por sección ya cubre los conteos por sub-módulo.
HISTORICO = re.compile(
    r"(bit[áa]cora|hist[óo]ric|entonces|en su momento|~~|corregid|dec[íi]a|"
    r"se movi[óo]|ya no existe|antes\b|^\s*-\s*\[x\]|"
    r"estab[ao]n?\b|fueron\b|hab[íi]a\b|ten[íi]an?\b|qued[óo]\b|"
    # `**HECHO** (2026-08-07)` es la marca de registro fechado de este repo: dice qué
    # era cierto ese día. Igual una fecha entre paréntesis pegada a la afirmación.
    r"\bHECHO\b|\(20\d\d-\d\d-\d\d)",
    re.IGNORECASE,
)

# `N tablas` aparece en el repo con al menos tres significados distintos y sólo uno
# es «el esquema tiene N tablas»:
#   · «4 tablas hijas» de HCE-PAI          → subconjunto de un módulo
#   · «las 12 tablas existentes» (§5.26)   → subconjunto que no se renombra
#   · «28 tablas, 27 son inmunes» (§5.8)   → conteo correcto para su fecha
# Comparar los tres contra el total genera ruido, y el ruido hace que nadie corra el
# script — que es la única forma en que un verificador falla de verdad. Se exige
# entonces: número a escala de esquema (nunca bajó de 20) y sin calificador que lo
# acote. Prefiere callarse a gritar de más.
MINIMO_ESQUEMA = 20
CALIFICADOR = re.compile(
    r"^\s*(hijas?|existentes?|nuevas?|de datos|m[áa]s|menos|del?\s)", re.IGNORECASE
)


# --------------------------------------------------------------------------
# Medición: qué ES el repo
# --------------------------------------------------------------------------
def medir_tablas() -> tuple[int, dict[str, int]]:
    """Cuenta `__tablename__` por archivo de `app/models/`."""
    por_archivo: dict[str, int] = {}
    for py in sorted(MODELOS.glob("*.py")):
        if py.name == "__init__.py":
            continue
        n = len(re.findall(r"^\s*__tablename__\s*=", py.read_text(encoding="utf-8"), re.M))
        if n:
            por_archivo[py.name] = n
    return sum(por_archivo.values()), por_archivo


def medir_migracion() -> tuple[list[str], list[str], list[str]]:
    """Devuelve (archivos, revisiones, heads). `heads` > 1 es un problema."""
    archivos, revisiones, con_padre = [], [], set()
    for py in sorted(VERSIONES.glob("*.py")):
        txt = py.read_text(encoding="utf-8")
        rev = re.search(r"^revision(?::\s*str)?\s*=\s*['\"]([^'\"]+)", txt, re.M)
        padre = re.search(r"^down_revision(?::[^=]+)?=\s*['\"]([^'\"]+)", txt, re.M)
        archivos.append(py.name)
        if rev:
            revisiones.append(rev.group(1))
        if padre:
            con_padre.add(padre.group(1))
    heads = [r for r in revisiones if r not in con_padre]
    return archivos, revisiones, heads


def docker_arriba() -> bool:
    """¿Está el Postgres de desarrollo escuchando? (§5.9: 127.0.0.1:5440)"""
    try:
        r = subprocess.run(
            ["docker", "compose", "ps", "-q", "db"],
            cwd=BACKEND, capture_output=True, text=True, timeout=25,
        )
        return r.returncode == 0 and bool(r.stdout.strip())
    except (OSError, subprocess.SubprocessError):
        return False


def python_del_backend() -> str:
    """El intérprete del venv del backend si existe; si no, el que corre este script.

    `CLAUDE.md` prescribe `.venv\\Scripts\\Activate.ps1` antes de `pytest`, y las
    dependencias (alembic, sqlalchemy, fastapi) viven ahí y no en el Python del
    sistema. Usar `sys.executable` a secas hacía que el script reportara «no medido»
    en máquinas donde los tests corren perfectamente.
    """
    for rel in ("Scripts/python.exe", "bin/python"):
        cand = BACKEND / ".venv" / rel
        if cand.exists():
            return str(cand)
    return sys.executable


def medir_tests() -> tuple[int | None, str]:
    """(cantidad, motivo). `None` = no medido, y el motivo dice **por qué**.

    Nunca estima. Un número inventado acá sería exactamente el problema que este
    script existe para resolver, y el motivo se reporta textual para que nadie tenga
    que adivinar si el dato falta por Docker, por el entorno o por un test roto.
    """
    if not docker_arriba():
        return None, "Docker abajo (`docker compose up -d` en el backend)"
    try:
        r = subprocess.run(
            [python_del_backend(), "-m", "pytest", "--collect-only", "-q"],
            cwd=BACKEND, capture_output=True, text=True, timeout=300,
        )
    except (OSError, subprocess.SubprocessError) as e:
        return None, f"no se pudo correr pytest ({type(e).__name__})"
    m = re.search(r"(\d+)\s+tests?\s+collected", r.stdout)
    if m:
        return int(m.group(1)), ""
    detalle = (r.stdout + r.stderr).strip().splitlines()
    ultima = detalle[-1][:120] if detalle else "sin salida"
    return None, f"pytest no recolectó (rc={r.returncode}): {ultima}"


# --------------------------------------------------------------------------
# Comparación: qué DICE la documentación
# --------------------------------------------------------------------------
def afirmaciones(patron: str, doc: Path) -> list[tuple[int, str, str]]:
    """(línea, valor afirmado, texto) para cada afirmación no histórica."""
    if not doc.exists():
        return []
    out = []
    for i, linea in enumerate(doc.read_text(encoding="utf-8").splitlines(), 1):
        if doc.name in SOLO_CABECERA and FIN_DE_LO_VIGENTE.match(linea):
            break  # de §5 para abajo son registros fechados, no el estado de hoy
        for m in re.finditer(patron, linea, re.IGNORECASE):
            if HISTORICO.search(linea):
                continue  # habla del pasado: puede nombrar un número viejo
            if CALIFICADOR.match(linea[m.end():]):
                continue  # «4 tablas hijas», «12 tablas existentes»: no es el total
            out.append((i, m.group(1), linea.strip()))
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true",
                    help="silencioso si coincide; exit 1 con el diff si no")
    args = ap.parse_args()

    tablas, por_archivo = medir_tablas()
    archivos_mig, revisiones, heads = medir_migracion()
    tests, motivo_tests = medir_tests()

    problemas: list[str] = []

    # -- un solo head ------------------------------------------------------
    if len(heads) != 1:
        problemas.append(
            f"Alembic tiene {len(heads)} cabezas ({', '.join(heads) or 'ninguna'}); "
            f"tiene que haber exactamente 1. Archivos: {', '.join(archivos_mig)}"
        )

    # -- tablas ------------------------------------------------------------
    for doc in DOCS:
        for ln, valor, texto in afirmaciones(r"(\d+)\s*tablas", doc):
            if int(valor) < MINIMO_ESQUEMA:
                continue  # no es una afirmación sobre el esquema entero
            if int(valor) != tablas:
                problemas.append(
                    f"{doc.relative_to(RAIZ)}:{ln} dice «{valor} tablas», hay {tablas}\n"
                    f"    {texto[:160]}"
                )

    # -- migración ---------------------------------------------------------
    for doc in DOCS:
        for ln, valor, texto in afirmaciones(r"([0-9a-f]{12})_[a-z0-9_]*\.py", doc):
            if valor not in revisiones:
                problemas.append(
                    f"{doc.relative_to(RAIZ)}:{ln} nombra la migración «{valor}», "
                    f"que no existe. La actual es {revisiones[0] if revisiones else '(ninguna)'}\n"
                    f"    {texto[:160]}"
                )

    # -- tests -------------------------------------------------------------
    if tests is None:
        problemas_tests = f"NO MEDIDO — {motivo_tests} (se omite, no se estima)"
    else:
        problemas_tests = str(tests)
        for doc in DOCS:
            for ln, valor, texto in afirmaciones(r"(\d+)\s*(?:passed|tests? en verde)", doc):
                if int(valor) != tests:
                    problemas.append(
                        f"{doc.relative_to(RAIZ)}:{ln} dice «{valor} passed», hay {tests}\n"
                        f"    {texto[:160]}"
                    )

    if problemas:
        print("DESFASADO — la documentación no coincide con el repo:\n")
        for p in problemas:
            print(f"  · {p}")
        print(f"\nMedido ahora: {tablas} tablas · migración "
              f"{revisiones[0] if revisiones else '(ninguna)'} · tests: {problemas_tests}")
        print("\nSi el repo es lo correcto, actualizá los .md. Si el .md es lo correcto,")
        print("alguien rompió algo. El script no decide cuál de las dos.")
        return 1

    if not args.check:
        print(f"{tablas} tablas")
        for archivo, n in por_archivo.items():
            print(f"  {archivo:<20} {n}")
        print(f"migración   {revisiones[0] if revisiones else '(ninguna)'} "
              f"({archivos_mig[0] if archivos_mig else '—'})")
        print(f"heads       {len(heads)}")
        print(f"tests       {problemas_tests}")
    else:
        print("OK — la documentación coincide con el repo.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
