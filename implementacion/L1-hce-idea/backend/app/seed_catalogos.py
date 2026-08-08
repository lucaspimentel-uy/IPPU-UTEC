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


def _sincronizar(db: Session, modelo, filas: list[dict], clave: str) -> tuple[int, int]:
    """Inserta o actualiza `filas` usando `clave` como identidad natural.

    Devuelve (nuevas, actualizadas). No borra lo que sobra: si una categoría
    dejó de estar en el JSON puede haber documentos apuntándole, y borrarla
    en silencio rompería el expediente. Eso se decide a mano.
    """
    existentes = {getattr(o, clave): o for o in db.query(modelo).all()}
    nuevas = actualizadas = 0
    for fila in filas:
        actual = existentes.get(fila[clave])
        if actual is None:
            db.add(modelo(**fila))
            nuevas += 1
        else:
            cambio = False
            for campo, valor in fila.items():
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

        for modelo, tabla, clave in [
            (IdeaDimension, "idea_dimension", "codigo"),
            (IppuItem, "ippu_item", "id"),
            (BaremoCategoria, "baremo_categoria", "categoria"),
            (CategoriaDocumento, "categoria_documento", "nombre"),
            (Recordatorio, "recordatorio", "clave"),
            (Taller, "taller", "nombre"),
            (Servicio, "servicio", "clave"),
        ]:
            nuevas, act = _sincronizar(db, modelo, datos[tabla], clave)
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
