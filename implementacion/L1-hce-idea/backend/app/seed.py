"""Carga datos simulados (anonimizados) tomados de la demo para poder probar la API.

Uso:  python -m app.seed        (desde la carpeta backend, con el venv activo)

Es idempotente: vacía las tablas y vuelve a cargar. SOLO datos simulados.
Nota: los descriptores oficiales de `nivel_idea` (texto largo por nivel) se importan
aparte desde docs/markdown/escala-...idea.md; acá se carga la estructura del catálogo.
"""
from datetime import date

from app.core.database import Base, SessionLocal
from app.models import (
    Anamnesis, DimensionCatalogo, DimensionIdea, Escala, EvaluacionArea,
    EvaluacionGeneral, EvaluacionIdea, EvaluacionLikert, Evento, Grupo, ItemArea,
    ItemGeneral, ItemLikert, Nna, Observacion, Taller, Terapeuta,
)

# Indicadores/dimensiones provisionales (de la demo) para áreas y general.
AREA_INDICADORES = [
    "Participación e implicación en el taller",
    "Logro de los objetivos del taller",
    "Autonomía en las actividades",
]
GENERAL_DIMS = [
    "Autonomía / Vida diaria (AVD)",
    "Comunicación funcional",
    "Integración y vínculo social",
    "Regulación emocional y conductual",
    "Participación en talleres",
]

# ---- Catálogo IDEA ----
ESCALAS = [
    ("A", "Relación Social", 1),
    ("B", "Comunicación y Lenguaje", 2),
    ("C", "Anticipación / Flexibilidad", 3),
    ("D", "Simbolización", 4),
]
DIMENSIONES = [
    ("D1", "A", 1, "Relaciones sociales"),
    ("D2", "A", 2, "Capacidades de referencia conjunta"),
    ("D3", "A", 3, "Capacidades intersubjetivas y mentalistas"),
    ("D4", "B", 4, "Funciones comunicativas"),
    ("D5", "B", 5, "Lenguaje expresivo"),
    ("D6", "B", 6, "Lenguaje receptivo"),
    ("D7", "C", 7, "Anticipación"),
    ("D8", "C", 8, "Flexibilidad"),
    ("D9", "C", 9, "Sentido de la actividad"),
    ("D10", "D", 10, "Ficción e imaginación"),
    ("D11", "D", 11, "Imitación"),
    ("D12", "D", 12, "Suspensión (capacidad de crear significantes)"),
]

# ---- Equipo (terapeutas) → grupos ----
TERAPEUTAS = [
    ("Dr. González", "Psicología", "gonzalez@fundacionippu.uy", "Técnico de referencia", ["A", "E"]),
    ("Lic. Torres", "Psicopedagogía", "torres@fundacionippu.uy", "Técnica de referencia", ["B", "D"]),
    ("Lic. Pereira", "Fonoaudiología", "pereira@fundacionippu.uy", "Técnica de referencia", ["A", "C"]),
    ("Dra. Silva", "Neuropediatría", "silva@fundacionippu.uy", "Técnica de referencia", ["C"]),
]

# ---- Grupos A–E ----
GRUPOS = [
    ("A", "6 – 9 años", "Lun · Mié · Vie", "9:00 – 12:00", "Menor edad. Intervención temprana y juego."),
    ("B", "9 – 12 años", "Lun · Mié · Vie", "13:00 – 16:00", "Habilidades sociales y expresión."),
    ("C", "12 – 15 años", "Mar · Jue", "9:00 – 12:00", "Mayor proporción de apoyos sustanciales. Autonomía y CAA."),
    ("D", "15 – 18 años", "Mar · Jue", "13:00 – 16:00", "Preparación para la vida adulta."),
    ("E", "Multiedad — taller abierto", "Vie", "9:00 – 12:00", "Espacio recreativo e integración."),
]
GRUPO_TALLERES = {
    "A": ["Habilidades sociales", "Lenguaje y comunicación", "Juego simbólico", "Motricidad"],
    "B": ["Habilidades sociales", "Música y expresión", "Arte y plástica", "Vida diaria (AVD)"],
    "C": ["Lenguaje y comunicación", "Vida diaria (AVD)", "Psicomotricidad"],
    "D": ["Vida diaria (AVD)", "Cocina", "Habilidades sociales"],
    "E": ["Música y expresión", "Actividades lúdicas"],
}

# ---- NNA (subconjunto de la demo) ----
NNA = [
    dict(nombre="Sofía", apellido="R.", ci="5.789.123-4", fecha_nac="2015-03-12", sexo="Femenino",
         localidad="Montevideo", referente="Marta R. (madre)", telefono="099 456 789", grupo="B",
         tecnico="Lic. Torres", diagnostico="TEA — Trastorno del Espectro Autista", dx_fecha="2019-08-20",
         derivacion="Neuropediatría — Hospital Pereira Rossell", grado_apoyo="Grado 2 — Requiere apoyo sustancial",
         antecedentes="Retraso en aparición del lenguaje. Sin antecedentes familiares de TEA.",
         medicacion="Ninguna", alerta="Hipersensibilidad auditiva a ruidos fuertes", activo=True,
         talleres=["Habilidades sociales", "Lenguaje y comunicación", "Música y expresión"],
         anamnesis=dict(motivo="Derivada por dificultades en la interacción social y del lenguaje.",
                        perinatal="Embarazo controlado y parto a término sin complicaciones.",
                        desarrollo="Marcha a los 14 meses. Primeras palabras ~30 meses.",
                        familiares="Sin antecedentes familiares de TEA."),
         eventos=[("alta", "2024-02-10", "Alta en HCE", "Ingreso al programa. Expediente creado por Lic. Torres.")],
         observaciones=[("2026-03-02", "Lic. Torres", "Buena adaptación al taller de música. Inicia contacto visual sostenido."),
                        ("2026-05-18", "Lic. Torres", "Mejora en la tolerancia a ruidos fuertes durante las actividades grupales.")],
         idea=[("inicial", 2026, "2026-01-15", "Lic. Torres", 42)],
         likert=[]),
    dict(nombre="Martín", apellido="G.", ci="6.012.345-1", fecha_nac="2017-06-05", sexo="Masculino",
         localidad="Canelones", referente="Pablo G. (padre)", telefono="098 222 111", grupo="A",
         tecnico="Dr. González", diagnostico="TEA — Trastorno del Espectro Autista", dx_fecha="2021-05-14",
         derivacion="Centro de Diagnóstico Temprano — INAU", grado_apoyo="Grado 2 — Requiere apoyo sustancial",
         antecedentes="Detección a los 3 años. Buena respuesta a intervención temprana.",
         medicacion="Ninguna", alerta="—", activo=True,
         talleres=["Habilidades sociales", "Lenguaje y comunicación", "Juego simbólico", "Motricidad"],
         anamnesis=dict(motivo="Detección temprana en el CAIF; ingresa para continuar intervención.",
                        perinatal="Parto a término.", desarrollo="Hitos motores en tiempo. Lenguaje con retraso leve.",
                        familiares="Sin antecedentes familiares relevantes conocidos."),
         eventos=[("alta", "2023-03-01", "Alta en HCE", "Ingreso al programa. Expediente creado por Dr. González.")],
         observaciones=[("2026-09-15", "Dr. González", "Avance notable en relación con pares. Inicia juego compartido espontáneo.")],
         idea=[("inicial", 2026, "2026-01-15", "Dr. González", 38),
               ("final", 2026, "2026-11-28", "Lic. Torres", 20)],
         likert=[(2026, "2026-06-10", "Dr. González", 28.0)],
         areas=[(2026, "2026-06-15", "Dr. González", "Buen progreso general en los talleres.")],
         general=[(2026, "2026-06-15", "Dr. González",
                   "Avances en vínculo con pares; reforzar autorregulación ante cambios.")]),
    dict(nombre="Valentina", apellido="P.", ci="5.345.678-9", fecha_nac="2013-11-22", sexo="Femenino",
         localidad="Montevideo", referente="Laura P. (madre)", telefono="091 777 333", grupo="C",
         tecnico="Lic. Pereira", diagnostico="TEA con discapacidad intelectual asociada", dx_fecha="2017-02-10",
         derivacion="Neuropediatría — Casa de Galicia", grado_apoyo="Grado 3 — Requiere apoyo muy sustancial",
         antecedentes="Diagnóstico a los 4 años. Uso de comunicación aumentativa (pictogramas).",
         medicacion="Risperidona 0,5 mg", alerta="Crisis ante cambios bruscos de rutina", activo=True,
         talleres=["Lenguaje y comunicación", "Vida diaria (AVD)", "Psicomotricidad"],
         anamnesis=dict(motivo="Abordaje interdisciplinario de comunicación y autonomía.",
                        perinatal="Sin datos relevantes.", desarrollo="Retraso global del desarrollo.",
                        familiares="Sin antecedentes conocidos."),
         eventos=[("alta", "2022-04-12", "Alta en HCE", "Ingreso al programa. Expediente creado por Lic. Pereira.")],
         idea=[("inicial", 2026, "2026-01-15", "Lic. Pereira", 55)],
         likert=[(2026, "2026-06-10", "Lic. Pereira", 49.0)]),
]


def reparto(total: int) -> list[int]:
    """Distribuye un total 0..96 entre 12 dimensiones (valores pares 0..8)."""
    vals = [0] * 12
    i, restante = 0, min(total, 96)
    while restante > 0 and not all(v == 8 for v in vals):
        add = min(2, 8 - vals[i % 12], restante)
        vals[i % 12] += add
        restante -= add
        i += 1
    return vals


def run():
    with SessionLocal() as db:
        # limpiar (orden hijo→padre)
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()

        # catálogo
        for eid, nombre, orden in ESCALAS:
            db.add(Escala(id=eid, nombre=nombre, orden=orden))
        dims = {}
        for did, esc, num, nombre in DIMENSIONES:
            d = DimensionCatalogo(id=did, escala_id=esc, numero=num, nombre=nombre)
            dims[did] = d
            db.add(d)
        db.commit()

        # talleres (catálogo, deducido de los grupos)
        nombres_taller = sorted({t for ts in GRUPO_TALLERES.values() for t in ts})
        talleres = {n: Taller(nombre=n) for n in nombres_taller}
        db.add_all(talleres.values())

        # grupos
        grupos = {}
        for gid, franja, dias, horario, obs in GRUPOS:
            g = Grupo(id=gid, franja=franja, dias=dias, horario=horario, obs=obs)
            grupos[gid] = g
            db.add(g)
        db.commit()

        # grupo ↔ taller
        for gid, ts in GRUPO_TALLERES.items():
            grupos[gid].talleres = [talleres[t] for t in ts]

        # terapeutas ↔ grupos
        terapeutas = {}
        for nombre, esp, email, cargo, gids in TERAPEUTAS:
            t = Terapeuta(nombre=nombre, especialidad=esp, email=email, cargo=cargo, rol="tecnico")
            t.grupos = [grupos[g] for g in gids]
            terapeutas[nombre] = t
            db.add(t)
        db.commit()

        # NNA + clínica + evaluaciones
        for n in NNA:
            nna = Nna(
                nombre=n["nombre"], apellido=n["apellido"], ci=n["ci"],
                fecha_nac=date.fromisoformat(n["fecha_nac"]), sexo=n["sexo"],
                localidad=n["localidad"], referente=n["referente"], telefono=n["telefono"],
                grupo_id=n["grupo"], tecnico_id=terapeutas[n["tecnico"]].id,
                diagnostico=n["diagnostico"], dx_fecha=date.fromisoformat(n["dx_fecha"]),
                derivacion=n["derivacion"], grado_apoyo=n["grado_apoyo"],
                antecedentes=n["antecedentes"], medicacion=n["medicacion"], alerta=n["alerta"],
                activo=n["activo"],
            )
            nna.talleres = [talleres[t] for t in n["talleres"]]
            nna.anamnesis = Anamnesis(**n["anamnesis"])
            nna.eventos = [
                Evento(tipo=tp, fecha=date.fromisoformat(f), titulo=ti, descripcion=de,
                       autor_id=terapeutas[n["tecnico"]].id)
                for (tp, f, ti, de) in n["eventos"]
            ]
            nna.observaciones = [
                Observacion(fecha=date.fromisoformat(f), autor_id=terapeutas[au].id, texto=tx)
                for (f, au, tx) in n.get("observaciones", [])
            ]
            db.add(nna)
            db.flush()  # para tener nna.id

            for periodo, anio, f, evalr, total in n["idea"]:
                ev = EvaluacionIdea(
                    nna_id=nna.id, anio=anio, periodo=periodo, fecha=date.fromisoformat(f),
                    evaluador_id=terapeutas[evalr].id, total=total,
                )
                puntajes = reparto(total)
                ev.dimensiones = [
                    DimensionIdea(dimension_id=f"D{k+1}", puntaje=puntajes[k]) for k in range(12)
                ]
                db.add(ev)

            for anio, f, evalr, equiv in n["likert"]:
                lk = EvaluacionLikert(
                    nna_id=nna.id, anio=anio, fecha=date.fromisoformat(f),
                    evaluador_id=terapeutas[evalr].id, equivalente_idea=equiv,
                )
                lk.items = [
                    ItemLikert(dimension_id=f"D{k+1}", item_num=j, valor=((k + j) % 5) + 1)
                    for k in range(12) for j in range(1, 4)
                ]
                db.add(lk)

            # Evaluación por áreas (provisional): por taller × indicador
            for anio, f, evalr, obs in n.get("areas", []):
                ea = EvaluacionArea(
                    nna_id=nna.id, anio=anio, fecha=date.fromisoformat(f),
                    evaluador_id=terapeutas[evalr].id, observaciones=obs,
                )
                ea.items = [
                    ItemArea(taller_id=talleres[t].id, indicador=ind, valor=((ti + ii) % 5) + 1)
                    for ti, t in enumerate(n["talleres"])
                    for ii, ind in enumerate(AREA_INDICADORES)
                ]
                db.add(ea)

            # Evaluación general (provisional): dimensiones globales + observación
            for anio, f, evalr, obs in n.get("general", []):
                eg = EvaluacionGeneral(
                    nna_id=nna.id, anio=anio, fecha=date.fromisoformat(f),
                    evaluador_id=terapeutas[evalr].id, observacion_clinica=obs,
                )
                eg.items = [
                    ItemGeneral(dimension=d, valor=(i % 5) + 1)
                    for i, d in enumerate(GENERAL_DIMS)
                ]
                db.add(eg)

        db.commit()

        # resumen
        cnt = lambda m: db.query(m).count()
        print("Seed OK:")
        print(f"  escalas={cnt(Escala)} dimensiones={cnt(DimensionCatalogo)}")
        print(f"  terapeutas={cnt(Terapeuta)} grupos={cnt(Grupo)} talleres={cnt(Taller)}")
        print(f"  nna={cnt(Nna)} anamnesis={cnt(Anamnesis)} eventos={cnt(Evento)} observaciones={cnt(Observacion)}")
        print(f"  eval_idea={cnt(EvaluacionIdea)} dim_idea={cnt(DimensionIdea)}"
              f" eval_likert={cnt(EvaluacionLikert)} item_likert={cnt(ItemLikert)}")
        print(f"  eval_area={cnt(EvaluacionArea)} item_area={cnt(ItemArea)}"
              f" eval_general={cnt(EvaluacionGeneral)} item_general={cnt(ItemGeneral)}")


if __name__ == "__main__":
    run()
