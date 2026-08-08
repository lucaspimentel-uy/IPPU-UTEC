"""Carga de catálogos paramétricos — M11.2.

    python -m app.seed_catalogos

Es **idempotente**: se puede correr las veces que haga falta. Cada catálogo se
sincroniza por su clave natural (código de dimensión, nombre, clave…), así que
volver a correrlo actualiza los textos sin duplicar filas ni romper las FK de
los expedientes que ya apunten a esas categorías.

Los datos salen de `app/data/catalogos_iniciales.json`, que se generó **desde la
demo v4.1** (`demo/js/catalogos.js`, `hce-doc-org-vf.js`, `recordatorios.js` e
`index.html`). Esa es la fuente de verdad del modelo clínico: es lo que se
adaptó al Documento Técnico en la ronda M0–M10 y lo que IPPU va a validar.
Transcribirlos a mano habría sido una segunda copia con riesgo de deriva.

No incluye datos clínicos: el seed de NNA de ejemplo es M11.5.
"""
import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import (
    BaremoCategoria,
    CategoriaDocumento,
    IdeaDimension,
    IdeaNivel,
    IppuItem,
    Recordatorio,
    Servicio,
    Taller,
)

DATOS = Path(__file__).parent / "data" / "catalogos_iniciales.json"


def _sincronizar(
    db: Session,
    modelo,
    filas: list[dict],
    clave: str,
    solo_al_crear: tuple[str, ...] = (),
) -> tuple[int, int]:
    """Inserta o actualiza `filas` usando `clave` como identidad natural.

    Devuelve (nuevas, actualizadas). No borra lo que sobra: si una categoría
    dejó de estar en el JSON puede haber documentos apuntándole, y borrarla
    en silencio rompería el expediente. Eso se decide a mano.

    `solo_al_crear` lista los campos que **pertenecen a la institución**: se
    escriben al insertar la fila y nunca más. Son los que IPPU puede ajustar
    (los cortes del baremo, qué recordatorios están activos, qué talleres se
    dictan). Sin esta lista, volver a correr el seed —que es parte del arranque
    documentado— pisaba silenciosamente esos ajustes con los valores del JSON,
    que es exactamente lo que la decisión §5.2.3 quería evitar al hacerlos
    parametrizables en vez de constantes.
    """
    existentes = {getattr(o, clave): o for o in db.query(modelo).all()}
    nuevas = actualizadas = 0
    for fila in filas:
        actual = existentes.get(fila[clave])
        if actual is None:
            nuevo = modelo(**fila)
            db.add(nuevo)
            existentes[fila[clave]] = nuevo  # si el JSON repitiera la clave, no inserta dos veces
            nuevas += 1
        else:
            cambio = False
            for campo, valor in fila.items():
                if campo in solo_al_crear:
                    continue
                if getattr(actual, campo) != valor:
                    setattr(actual, campo, valor)
                    cambio = True
            actualizadas += cambio
    return nuevas, actualizadas


def run() -> None:
    datos = json.loads(DATOS.read_text(encoding="utf-8"))
    db = SessionLocal()
    try:
        resumen: list[str] = []

        # El 3.er elemento es la clave natural; el 4.º, los campos que la
        # institución puede ajustar y que el seed no debe volver a pisar.
        # Los instrumentos (IDEA, IPPU-TEA) no llevan ninguno: su contenido lo
        # define la demo y ahí sí queremos que el seed mande.
        for modelo, tabla, clave, propios in [
            (IdeaDimension, "idea_dimension", "codigo", ()),
            (IppuItem, "ippu_item", "id", ()),
            # §0.4: los cortes los confirma IPPU contra el anexo del Decreto 72/025.
            (BaremoCategoria, "baremo_categoria", "categoria", ("pct_min", "pct_max")),
            (CategoriaDocumento, "categoria_documento", "nombre", ()),
            # §4: qué recordatorios están activos y en qué período lo fija coordinación.
            (Recordatorio, "recordatorio", "clave", ("activo", "periodo")),
            (Taller, "taller", "nombre", ("activo",)),
            # Taller Terapéutico y Clínica se activan en Fase 2 desde la propia app.
            (Servicio, "servicio", "clave", ("activo",)),
        ]:
            nuevas, act = _sincronizar(db, modelo, datos[tabla], clave, propios)
            resumen.append(f"  {tabla:22} {nuevas:3} nuevas · {act:3} actualizadas")

        # Los niveles se sincronizan aparte: su identidad es el par
        # (dimensión, valor), no un campo único. Necesitan que las dimensiones
        # ya estén en la sesión, de ahí el flush.
        db.flush()
        existentes = {(n.dimension_id, n.valor): n for n in db.query(IdeaNivel).all()}
        nuevas = act = 0
        for fila in datos["idea_nivel"]:
            actual = existentes.get((fila["dimension_id"], fila["valor"]))
            if actual is None:
                db.add(IdeaNivel(**fila))
                nuevas += 1
            elif actual.descriptor != fila["descriptor"]:
                actual.descriptor = fila["descriptor"]
                act += 1
        resumen.append(f"  {'idea_nivel':22} {nuevas:3} nuevas · {act:3} actualizadas")

        db.commit()

        print("Catálogos sincronizados:")
        for linea in sorted(resumen):
            print(linea)
        print(f"\nOrigen: {datos['_origen']}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
