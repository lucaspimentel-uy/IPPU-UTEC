"""Carga de catálogos paramétricos — M11.2, ampliado en M12.1.

    python -m app.seed_catalogos

Es **idempotente**: se puede correr las veces que haga falta. Cada catálogo se
sincroniza por su clave natural (código de dimensión, nombre, clave…), así que
volver a correrlo actualiza los textos sin duplicar filas ni romper las FK de
los expedientes que ya apunten a esas categorías.

Los datos salen de `app/data/catalogos_iniciales.json`, que **genera**
`herramientas/generar_catalogos_backend.py` — no se edita a mano. Las secciones
de instrumento vienen de la demo v4.1 (el modelo clínico que se adaptó al
Documento Técnico en M0–M10) y las que agregó M12.1 —bandas del IDEA,
interpretación del Δ, fichas, ejemplos, reglas, `descriptor_breve`— del
Prototipo v4 de IPPU.

No incluye datos clínicos: el seed de NNA de ejemplo es M11.5.
"""
import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import (
    BandaIdea,
    BaremoCategoria,
    CategoriaDocumento,
    DeltaInterpretacion,
    Grupo,
    IdeaDimension,
    IdeaEjemplo,
    IdeaFicha,
    IdeaNivel,
    IdeaRegla,
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
    clave: str | tuple[str, ...],
    solo_al_crear: tuple[str, ...] = (),
    solo_insertar: bool = False,
) -> tuple[int, int]:
    """Inserta o actualiza `filas` usando `clave` como identidad natural.

    Devuelve (nuevas, actualizadas). No borra lo que sobra: si una categoría
    dejó de estar en el JSON puede haber documentos apuntándole, y borrarla
    en silencio rompería el expediente. Eso se decide a mano.

    `clave` puede ser un campo o una **tupla** de campos, para los catálogos cuya
    identidad es compuesta: `idea_nivel` e `idea_ejemplo` se identifican por
    `(dimensión, valor)` y `grupo` por `(nombre, año)`.

    `solo_al_crear` lista los campos que **pertenecen a la institución**: se
    escriben al insertar la fila y nunca más. Son los que IPPU puede ajustar
    (los cortes del baremo y de las bandas del IDEA, qué recordatorios están
    activos, qué talleres se dictan). Sin esta lista, volver a correr el seed
    —que es parte del arranque documentado— pisaba silenciosamente esos ajustes
    con los valores del JSON, que es exactamente lo que la decisión §5.2.3
    quería evitar al hacerlos parametrizables en vez de constantes.

    `solo_insertar` es el caso extremo: la fila entera es de la institución y el
    seed sólo la crea si falta (`grupo`). Existe porque un grupo no es contenido
    de instrumento sino organización real —quiénes son sus técnicos, qué días
    funciona—, y nada de eso puede venir de un archivo del repo.
    """
    campos = (clave,) if isinstance(clave, str) else clave

    def ident(obj_o_fila):
        get = obj_o_fila.get if isinstance(obj_o_fila, dict) else lambda c: getattr(obj_o_fila, c)
        return tuple(get(c) for c in campos)

    existentes = {ident(o): o for o in db.query(modelo).all()}
    nuevas = actualizadas = 0
    for fila in filas:
        actual = existentes.get(ident(fila))
        if actual is None:
            nuevo = modelo(**fila)
            db.add(nuevo)
            existentes[ident(fila)] = nuevo  # si el JSON repitiera la clave, no inserta dos veces
            nuevas += 1
        elif not solo_insertar:
            cambio = False
            for campo, valor in fila.items():
                if campo in solo_al_crear:
                    continue
                if getattr(actual, campo) != valor:
                    setattr(actual, campo, valor)
                    cambio = True
            actualizadas += cambio
    return nuevas, actualizadas


#: (modelo, sección del JSON, clave natural, campos que la institución ajusta).
#: Los instrumentos (IDEA, IPPU-TEA) no llevan ninguno: su contenido lo define
#: la fuente y ahí sí queremos que el seed mande.
#: Orden importante: las dimensiones antes que todo lo que las referencia.
CATALOGOS: list[tuple] = [
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
    # D6 (§5.15): las bandas y la interpretación del Δ son paramétricas. Los
    # cortes son de la institución; el texto neutro y la acción, del Manual.
    (BandaIdea, "banda_idea", "perfil", ("total_min", "total_max")),
    (DeltaInterpretacion, "delta_interpretacion", "etiqueta",
     ("delta_min", "delta_max", "alerta")),
    (IdeaRegla, "idea_regla", "regla", ()),
    (IdeaFicha, "idea_ficha", "codigo", ()),
]

#: Catálogos con identidad compuesta. Van después del `flush` de las dimensiones.
COMPUESTOS: list[tuple] = [
    (IdeaNivel, "idea_nivel", ("dimension_id", "valor"), ()),
    (IdeaEjemplo, "idea_ejemplo", ("dimension_id", "valor"), ()),
]


def run(db: Session | None = None, verboso: bool = True) -> list[str]:
    """Corre el seed completo. Devuelve el resumen por tabla.

    `db` existe para los tests: si se pasa una sesión, el seed **no commitea** y
    la deja al que la abrió (el fixture de pytest la revierte). Sin eso, probar
    el seed de punta a punta exigiría una base propia, y lo que hay que probar
    —que correrlo dos veces no duplique ni pise nada— no depende de eso.
    """
    datos = json.loads(DATOS.read_text(encoding="utf-8"))
    propia = db is None
    db = db or SessionLocal()
    try:
        resumen: list[str] = []

        for modelo, tabla, clave, propios in CATALOGOS:
            nuevas, act = _sincronizar(db, modelo, datos[tabla], clave, propios)
            resumen.append(f"  {tabla:22} {nuevas:3} nuevas · {act:3} actualizadas")

        # Necesitan que las dimensiones ya estén en la sesión, de ahí el flush.
        db.flush()
        for modelo, tabla, clave, propios in COMPUESTOS:
            nuevas, act = _sincronizar(db, modelo, datos[tabla], clave, propios)
            resumen.append(f"  {tabla:22} {nuevas:3} nuevas · {act:3} actualizadas")

        # Los 4 grupos por color (D9) como punto de partida del año en curso.
        # Insert-only: de acá en más los administra coordinación.
        nuevas, act = _sincronizar(
            db, Grupo, datos["grupo"], ("nombre", "anio"), solo_insertar=True
        )
        resumen.append(f"  {'grupo':22} {nuevas:3} nuevas · {act:3} actualizadas")

        if propia:
            db.commit()
        else:
            db.flush()

        if verboso:
            print("Catálogos sincronizados:")
            for linea in sorted(resumen):
                print(linea)
            print(f"\nOrigen: {datos['_origen']}")
        return resumen
    finally:
        if propia:
            db.close()


if __name__ == "__main__":
    run()
