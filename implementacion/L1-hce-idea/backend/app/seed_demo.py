"""Seed espejo de la demo **vía la API** — M11.5-a (`handoff.md` §5.120; §12-A de `esquema-datos-v2.md`).

Carga en una base de desarrollo los 8 NNA de `demo/js/datos.js` y los arquetipos de flujo de
`demo/js/flujo.js` (`seedFlujo`, líneas ~398–477), **con los números y textos verbatim**:

- **102 Martín** — ciclo completo: CI → LB → PA → PB → IC firmados + recibí de la familia.
  Es el «usuario demo 1» del criterio §12-A: IDEA 58 (18/14/14/12) · PA 60 · PB 79 · Δ +19 (4/6/4/5).
- **101 Sofía** — CI + LB firmados; PA en borrador.
- **104 Joaquín** — CI registrado; LB en borrador con dos dimensiones `NS`.
- **107 Bruno** — sin CI.
- **103 Valentina · 105 Lucía · 108 Camila** — CI + LB firmados (`LB_OTROS`).
- **106 Tomás** — sólo el expediente, dado de baja (`activo:false`, `bajaFecha` de la demo).

CI/LB/PA/PB/IC y, desde C2, la **severidad DSM-5-TR** de Martín (dominios distintos) y de Valentina;
los demás quedan sin registro (el estado vacío de la pestaña). Desde C3, **HCE-ORG**: Martín (INAU con dos
envíos, AYEX vigente sin alerta), Sofía (AYEX en trámite a 25 días: alerta a 30 días, y una gestión) y
Joaquín (INAU con ingreso reciente y sin envíos); el resto, sin vínculos. Desde C4, **HCE-INC**: Martín (inclusión
plena, dos gestiones), Sofía (inclusión parcial con AT, tres gestiones, una «Clínica — sensible» de contenido
neutro) y Bruno (sin escolarizar, una gestión); Joaquín y los demás, sin ficha. Desde C5, **HCE-DOC y fotos**: Martín (un
«Informe escolar», un registro histórico de la HCE anterior, la copia de la autorización de imagen, una foto y la
autorización registrada con esa copia), Sofía (un documento y una foto, **sin** autorización: guardar no la exige) y
una foto grupal en Escolares. Los archivos se generan en código (un PDF mínimo válido y un PNG chico): ninguna imagen
ni nombre reales. Ni PAI.

## Dos partes, y por qué

1. **`preparar_usuarios(db, ...)` — bootstrap FUERA de la API, a propósito.** La API no tiene alta
   de usuarios (§5.90/§5.101): el admin y los dos profesionales de la demo («Dr. González —
   Psicólogo/a», «Mtra. Torres — Maestro/a») se crean con el mismo código que
   `python -m app.crear_usuario` (`app.crear_usuario.crear_usuario`), escribiendo en `DATABASE_URL`.
   Si ya existen, se reusan (no se les cambia la contraseña).
2. **`cargar_demo(cliente, ...)` — todo lo demás, sólo por HTTP.** No toca la base: recibe un
   cliente con la interfaz de `httpx.Client` (`TestClient` en la suite, `httpx.Client` contra una
   API corriendo en la CLI). El admin entra y asigna los dos técnicos a los grupos con
   `PATCH /grupos/{id}`; **los datos clínicos los carga el Dr. González, que es `tecnico`**, no el
   admin: así el seed recorre el mismo alcance por grupo que la pantalla.

## Grupos (§5.120)

La demo usa grupos por color, que **no existen en IPPU** (§5.37/§5.61). El dict `UBICACION_DEMO`
coloca cada color en uno de los cinco grupos reales del año 2026. Si algún grupo real falta en la
base, el seed se detiene antes de escribir (`DemoNoCargable`): no se crean grupos. La CLI lo
comprueba **antes del bootstrap de usuarios** (M11.5-a-fix): sin `seed_catalogos`, sale con código 1
sin haber creado ningún usuario.

## Atomicidad

**Una transacción por request (§5.108), no por corrida.** Antes de escribir, `cargar_demo`
comprueba que ninguna CI de la demo exista y aborta si alguna está; pero si la carga falla **a
mitad de camino**, lo que ya entró queda (carga parcial). Para rehacerla en limpio: base nueva
(`alembic downgrade base && alembic upgrade head && python -m app.seed_catalogos`).

## CLI

    python -m app.seed_demo --url http://localhost:8000

Con la API corriendo (`uvicorn app.main:app`). **Guardia de destino (§5.139):** antes de todo imprime la URL de
la API y el nombre de la base de `DATABASE_URL`, y sale con 1 sin escribir salvo que `IPPU_SEED_DESTINO` valga
ese nombre de base (`app/core/destino.py`). Credenciales del admin en el entorno, misma
convención que `crear_usuario`: `IPPU_EMAIL` / `IPPU_PASSWORD`. La contraseña de los dos
profesionales de la demo es `IPPU_DEMO_PASSWORD` (por omisión, la del admin: sólo desarrollo). Sale
con código 1 si la demo ya estaba cargada o si faltan los grupos (en los dos casos, sin escribir
nada) o si algo falla. Orden de `ejecutar`: (1) ¿la demo ya está? (por la API, si el admin ya
existe) → (2) ¿están los grupos? (en la base) → (3) bootstrap de usuarios → (4) `cargar_demo`.
"""
from __future__ import annotations

import argparse
import os
import struct
import sys
import zlib
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any

ANIO = 2026

# ── Grupos ───────────────────────────────────────────────────────────────────
#: Ubicación de datos de demostración FICTICIOS; **NO son las franjas de edad de IPPU** (ver
#: `handoff.md` §5.37/§5.61/§5.120). IPPU no dio franjas para sus grupos: este dict sólo decide en
#: qué grupo real cae cada NNA inventado de la demo. Reversible: se cambia acá y en ningún otro lado.
UBICACION_DEMO = {"Azul": "Escolares", "Celeste": "Preadolescentes", "Naranja": "Adolescentes"}

# ── Profesionales de la demo (`demo/js/flujo.js`, `TECNICOS`) ────────────────
GONZALEZ = {"email": "gonzalez@demo.ippu.test", "nombre": "Dr. González", "especialidad": "Psicólogo/a"}
TORRES = {"email": "torres@demo.ippu.test", "nombre": "Mtra. Torres", "especialidad": "Maestro/a"}

# ── Los 8 NNA, verbatim de `demo/js/datos.js` (id de la demo → datos) ─────────
# `cie11`: sólo el código de `CIE_SEED` (flujo.js:385); la columna es de 20 caracteres y la demo le
# pega «— Trastorno del espectro del autismo» al mostrarlo. `alerta: "—"` de la demo es su forma de
# escribir «sin alerta»: no se carga. `talleres`, `apoyo` y `tecnico` no son HCE-00 (SEV y talleres
# quedan fuera de esta rebanada).
NNA: dict[int, dict[str, Any]] = {
    101: {"color": "Celeste", "persona": {
        "nombre": "Sofía", "apellido": "R.", "ci": "5.789.123-4", "fecha_nac": "2015-03-12", "sexo": "Femenino",
        "localidad": "Montevideo", "referente": "Marta R. (madre)", "telefono": "099 456 789"},
        "hce": {"diagnostico": "TEA — Trastorno del Espectro Autista", "cie11": "6A02.0", "dx_fecha": "2019-08-20",
                "derivacion": "Neuropediatría — Hospital Pereira Rossell", "medicacion": "Ninguna",
                "alerta": "Hipersensibilidad auditiva a ruidos fuertes",
                "anamnesis": {
                    "motivo": "Derivada por dificultades en la interacción social y del lenguaje; ingresa para abordaje interdisciplinario.",
                    "perinatal": "Embarazo controlado y parto a término sin complicaciones.",
                    "desarrollo": "Marcha a los 14 meses. Retraso en la aparición del lenguaje (primeras palabras ~30 meses). Control de esfínteres adecuado.",
                    "familiares": "Sin antecedentes familiares de TEA. Un tío materno con trastorno del lenguaje."}}},
    102: {"color": "Azul", "persona": {
        "nombre": "Martín", "apellido": "G.", "ci": "6.012.345-1", "fecha_nac": "2017-06-05", "sexo": "Masculino",
        "localidad": "Canelones", "referente": "Pablo G. (padre)", "telefono": "098 222 111"},
        "hce": {"diagnostico": "TEA — Trastorno del Espectro Autista", "cie11": "6A02.1", "dx_fecha": "2021-05-14",
                "derivacion": "Centro de Diagnóstico Temprano — INAU", "medicacion": "Ninguna",
                "anamnesis": {
                    "motivo": "Detección temprana en el CAIF; ingresa para continuar intervención en habilidades sociales y lenguaje.",
                    "perinatal": "Embarazo sin controles regulares en el primer trimestre. Parto a término.",
                    "desarrollo": "Hitos motores en tiempo. Lenguaje con retraso leve, buena evolución tras intervención temprana.",
                    "familiares": "Sin antecedentes familiares relevantes conocidos."}}},
    103: {"color": "Naranja", "persona": {
        "nombre": "Valentina", "apellido": "P.", "ci": "5.345.678-9", "fecha_nac": "2013-11-22", "sexo": "Femenino",
        "localidad": "Montevideo", "referente": "Laura P. (madre)", "telefono": "091 777 333"},
        "hce": {"diagnostico": "TEA con discapacidad intelectual asociada", "cie11": "6A02.2", "dx_fecha": "2017-02-10",
                "derivacion": "Neuropediatría — Casa de Galicia", "medicacion": "Risperidona 0,5 mg",
                "alerta": "Crisis ante cambios bruscos de rutina"}},
    104: {"color": "Azul", "persona": {
        "nombre": "Joaquín", "apellido": "M.", "ci": "6.234.567-8", "fecha_nac": "2018-01-30", "sexo": "Masculino",
        "localidad": "Montevideo", "referente": "Sofía M. (madre)", "telefono": "099 888 444"},
        "hce": {"diagnostico": "TEA — en proceso diagnóstico", "cie11": "6A02.Z", "dx_fecha": "2025-11-03",
                "derivacion": "Pediatría — policlínica barrial", "medicacion": "Ninguna"}},
    105: {"color": "Celeste", "persona": {
        "nombre": "Lucía", "apellido": "F.", "ci": "5.456.789-0", "fecha_nac": "2014-09-08", "sexo": "Femenino",
        "localidad": "San José", "referente": "Diego F. (padre)", "telefono": "092 555 666"},
        "hce": {"diagnostico": "TEA — Trastorno del Espectro Autista", "cie11": "6A02.0", "dx_fecha": "2018-07-19",
                "derivacion": "Neuropediatría — Hospital de San José", "medicacion": "Ninguna",
                "alerta": "Selectividad alimentaria importante"}},
    106: {"color": "Naranja", "baja": "2026-05-20", "persona": {
        "nombre": "Tomás", "apellido": "D.", "ci": "5.901.234-5", "fecha_nac": "2016-04-17", "sexo": "Masculino",
        "localidad": "Montevideo", "referente": "Carla D. (madre)", "telefono": "094 333 222"},
        "hce": {"diagnostico": "TEA con discapacidad intelectual asociada", "cie11": "6A02.3", "dx_fecha": "2020-10-05",
                "derivacion": "Neuropediatría — Hospital Pereira Rossell", "medicacion": "Ninguna"}},
    107: {"color": "Azul", "persona": {
        "nombre": "Bruno", "apellido": "D.", "ci": "6.345.678-2", "fecha_nac": "2019-02-14", "sexo": "Masculino",
        "localidad": "Montevideo", "referente": "Carmen D. (madre)", "telefono": "099 111 222"},
        "hce": {"diagnostico": "TEA — en proceso diagnóstico", "cie11": "6A02.Z", "dx_fecha": "2026-03-10",
                "derivacion": "Pediatría — policlínica barrial", "medicacion": "Ninguna",
                "anamnesis": {
                    "motivo": "Ingreso reciente derivado de pediatría para valoración interdisciplinaria.",
                    "perinatal": "Sin datos relevantes.",
                    "desarrollo": "Marcha en tiempo. Lenguaje en evaluación.",
                    "familiares": "Sin antecedentes conocidos."}}},
    108: {"color": "Celeste", "persona": {
        "nombre": "Camila", "apellido": "S.", "ci": "5.678.901-3", "fecha_nac": "2015-08-22", "sexo": "Femenino",
        "localidad": "Canelones", "referente": "Rosa S. (madre)", "telefono": "098 444 555"},
        "hce": {"diagnostico": "TEA — Trastorno del Espectro Autista", "cie11": "6A02.0", "dx_fecha": "2020-04-18",
                "derivacion": "Neuropediatría — Hospital Pereira Rossell", "medicacion": "Ninguna",
                "anamnesis": {
                    "motivo": "Seguimiento anual en el programa.",
                    "perinatal": "Embarazo y parto sin complicaciones.",
                    "desarrollo": "Retraso leve del lenguaje, buena evolución.",
                    "familiares": "Sin antecedentes."}}},
}

# ── Arquetipos de flujo, verbatim de `demo/js/flujo.js` (`seedFlujo`) ─────────
#: CI: `seedCI(nna, fecha)` — firmante = referente, las tres autorizaciones.
CI_FECHAS = {102: "2026-03-02", 101: "2026-03-05", 104: "2026-06-10", 103: "2026-03-10", 105: "2026-03-10", 108: "2026-03-10"}

MARTIN_LB = {
    "dim": [6, 6, 6, 6, 4, 4, 4, 6, 4, 4, 4, 4], "obs": {2: "Diferencia inicial entre evaluadores (6 vs 4); consenso en 6 por observaciones de la sesión grupal."},
    "fecha_consenso": "2026-03-18", "sesiones": 6,
    "sintesis": "Evaluación realizada tras 6 sesiones de observación en contexto grupal. Mayor afectación en Relación Social (18/24) y Comunicación (14/24). Perfil orientativo de nivel de soporte 2 (DSM-5-TR). Referencia conjunta muy limitada; lenguaje expresivo reducido a palabras sueltas con ecolalia frecuente.",
    "objetivos": "1) Incrementar la atención conjunta con apoyo gestual. 2) Introducir un sistema aumentativo de comunicación acorde a la Escala de Comunicación. 3) Anticipación visual de las rutinas del grupo.",
}
MARTIN_PA = {
    "items": [3, 3, 3, 2, 3, 2, 3, 3, 2, 3, 2, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2, 2, 2, 2],
    "obs": {1: "Contacto visual emergente en saludo y pedido, sólo con apoyo verbal del adulto."},
    "fecha": "2026-07-07", "semanas": 16,
    "sint_tec1": "Emergencia clara de atención conjunta con apoyo. El sistema aumentativo de comunicación se consolidó en sesión.",
    "sint_tec2": "Mayor permanencia en actividades estructuradas. Barreras: transiciones y trabajo en pequeño grupo.",
    "otros": "Fonoaudiología: buena respuesta al apoyo gestual (ítems E2-4 y E2-6).",
}
MARTIN_PB = {
    "items": [4, 3, 4, 3, 3, 3, 4, 4, 3, 4, 3, 3, 3, 3, 3, 3, 4, 4, 3, 4, 3, 3, 3, 2], "obs": {},
    "fecha": "2026-11-06", "semanas": 17,
    "sint_tec1": "Generalización parcial de la comunicación al hogar. Atención conjunta consistente en sesión.",
    "sint_tec2": "Participa de rutinas grupales completas. Ajustes: apoyos visuales en todas las consignas.",
    "otros": "Psicomotricidad: mejora en regulación ante estímulos sonoros.",
    "ajustes": "Agenda visual individual (agosto); trabajo de a dos con un par tolerado (octubre).",
}
MARTIN_IC = {
    "fecha": "2026-11-13",
    "sint_escala": {
        "esc_1": "Progreso moderado y sostenido en la relación social (Δ +4). La atención conjunta pasó de emergente a consistente en contextos estructurados. La interacción espontánea con pares sigue siendo el principal desafío para el próximo año.",
        "esc_2": "Área de mayor progreso del año (Δ +6). El sistema aumentativo de comunicación se consolidó y comienza a generalizarse al hogar (ítems 7 y 10). Se recomienda ampliar su alcance funcional el próximo año.",
        "esc_3": "Progreso moderado (Δ +4). La agenda visual individual redujo significativamente las conductas de oposición ante las transiciones.",
        "esc_4": "Progreso leve (Δ +5 sobre una base muy descendida). La imitación mejoró de forma notable; el juego simbólico permanece incipiente.",
    },
    "val_tec1": "Año de progreso clínicamente significativo, concentrado en comunicación funcional y anticipación. Se recomienda continuidad en el mismo grupo de referencia con intensificación del trabajo entre pares.",
    "val_tec2": "La incorporación de apoyos visuales sistemáticos fue el ajuste de mayor impacto pedagógico. Se sugiere sostenerlos y comenzar un retiro gradual en las rutinas dominadas.",
    "recomendaciones": "1) Profundizar el uso funcional del sistema aumentativo de comunicación (E2). 2) Ampliar las oportunidades de juego compartido con pares (E4). 3) Retiro gradual de apoyos en rutinas consolidadas (E3). 4) Mantener la coordinación con la escuela y el acompañante.",
    "orientaciones": "Sostener la agenda visual en el hogar. Ofrecer oportunidades de pedido con el sistema de comunicación que utiliza, en situaciones cotidianas (merienda, juego). Anticipar verbal y visualmente los cambios de rutina del fin de semana.",
}
MARTIN_RECIBI_FECHA = "2026-11-13"

#: HCE-SEV (C2): juicio clínico por dominio, con justificación propia. **La justificación no cita ningún
#: puntaje del IDEA ni de la Escala IPPU-TEA**: el nivel no se deriva de ellos (regla del módulo). Datos
#: simulados: Martín con los dos dominios distintos; Valentina, otro expediente con registro.
SEVERIDAD = {
    102: {"nivel_cs": 2, "nivel_crr": 1, "fecha": "2026-03-20", "justificacion": (
        "Juicio clínico del equipo a partir de la observación en sala y en el recreo y de la entrevista con la familia. "
        "En comunicación social inicia pocas interacciones con pares y necesita mediación adulta planificada. En "
        "comportamientos restringidos y repetitivos, los cambios de rutina le cuestan pero los tolera con anticipación visual.")},
    103: {"nivel_cs": 3, "nivel_crr": 2, "fecha": "2026-03-24", "justificacion": (
        "Juicio clínico del equipo a partir de la observación en distintos espacios del centro y del intercambio con la "
        "familia y la escuela. La comunicación se orienta sobre todo a pedir lo que necesita, con apoyo de un sistema "
        "aumentativo. Los cambios de rutina le generan malestar marcado y requieren anticipación sistemática.")},
}

#: HCE-ORG (C3): vínculos y registros que cargaría el técnico del grupo. Las fechas que alimentan la alerta AYEX
#: son **relativas al día de la carga** (`date.today()`, el mismo reloj que usa la API): la de Sofía queda a
#: `SOFIA_AYEX_DIAS` días (la demo muestra la alerta de 30 días tras la recarga posterior al 13/11) y la de
#: Martín, bien lejos de los 60 (sin alerta). Los textos describen trámites, sin datos de personas reales.
SOFIA_AYEX_DIAS = 25
MARTIN_AYEX_DIAS = 300
ORGANISMOS_DEMO = {
    102: {
        "inau": {"convenio": "Convenio de atención diurna 2026", "referente": "Lic. M. Rodríguez (INAU)", "ingreso": "2026-03-02"},
        "bps": {"prestacion": "Ayuda Extraordinaria (AYEX)", "tramite": "AYEX-2026-0417", "estado": "Vigente"},
        "registros": [
            {"organismo": "inau", "fecha": "2026-03-12", "detalle": "Constancia de ingreso y de asistencia enviada al referente territorial."},
            {"organismo": "inau", "fecha": "2026-06-26", "detalle": "Respuesta a la consulta del referente territorial sobre el horario de atención."},
        ],
    },
    101: {
        "bps": {"prestacion": "Ayuda Extraordinaria (AYEX)", "tramite": "AYEX-2026-0233", "estado": "En trámite",
                "obs": "Falta la constancia de asistencia del último trimestre."},
        "registros": [
            {"organismo": "bps", "fecha": "2026-10-08", "detalle": "Presentación de la documentación para la renovación de la ayuda."},
        ],
    },
    104: {
        "inau": {"convenio": "Convenio de atención diurna 2026", "ingreso": "2026-09-14"},
        "registros": [],
    },
}


#: HCE-INC (C4): fichas y gestiones que cargaría el técnico del grupo. Datos de demostración, plausibles para la
#: edad de cada NNA en 2026 (Martín, 9 años: escuela, no liceo; Sofía, 11: último año de escuela; Bruno, 7: sin
#: escolarizar) y siempre dentro de las constantes de `core/constantes.py`. Los centros y las personas son
#: genéricos («de demostración»): ningún nombre real. La gestión sensible de Sofía no trae detalle clínico.
#: `fecha_estado` no se manda: la fija el servidor (el día de la carga). Fechas de gestión fijas, de 2026 y
#: anteriores al 13/11.
INCLUSION_DEMO = {
    102: {
        "ficha": {
            "centro": "Escuela pública de demostración N.º 1", "tipo_centro": "Escuela común (ANEP)", "grado": "4.º año",
            "modalidad": "Jornada simple, con apoyos visuales en clase", "dias_horas": "Lunes a viernes · 4 horas",
            "at": "No", "ref_nombre": "Maestra de clase (demostración)", "ref_rol": "Maestra de clase",
            "estado": "Inclusión plena",
        },
        "gestiones": [
            {"fecha": "2026-04-15", "interlocutor": "Maestra de clase", "rol": "Centro educativo", "medio": "Reunión presencial",
             "tema": "Educativa / pedagógica", "contenido": "Buena adaptación al grupo. Se acuerdan apoyos visuales para las consignas largas.",
             "acuerdos": "Revisar los apoyos visuales al cierre del primer semestre."},
            {"fecha": "2026-09-22", "interlocutor": "Madre", "rol": "Familia", "medio": "Llamada",
             "tema": "Familiar / social", "contenido": "La familia cuenta que concurre con gusto y que participa de un cumpleaños del grupo."},
        ],
    },
    101: {
        "ficha": {
            "centro": "Escuela pública de demostración N.º 2", "tipo_centro": "Escuela común (ANEP)", "grado": "6.º año",
            "modalidad": "Jornada parcial con acompañante", "dias_horas": "3 días · 4 horas",
            "at": "Sí", "at_nombre": "Acompañante de demostración", "ref_nombre": "Directora (demostración)", "ref_rol": "Directora",
            "estado": "Inclusión parcial (horario reducido)",
            "obs": "Se trabaja hacia la ampliación progresiva del horario.",
        },
        "gestiones": [
            {"fecha": "2026-03-09", "interlocutor": "Madre", "rol": "Familia", "medio": "WhatsApp",
             "tema": "Educativa / pedagógica", "contenido": "Retomó la escuela sin dificultades; el acompañante concurre tres días por semana."},
            {"fecha": "2026-05-20", "interlocutor": "Directora", "rol": "Centro educativo", "medio": "Reunión presencial",
             "tema": "Coordinación interinstitucional", "contenido": "Reunión de coordinación: el centro pide material sobre apoyos visuales.",
             "acuerdos": "Enviar el material antes de fin de mes."},
            {"fecha": "2026-08-18", "interlocutor": "Equipo de salud del prestador", "rol": "Equipo de salud", "medio": "Videollamada",
             "tema": "Clínica — sensible", "contenido": "Intercambio de coordinación con el equipo de salud. El detalle queda en la historia clínica."},
        ],
    },
    107: {
        "ficha": {"estado": "Sin escolarizar", "obs": "La familia consulta opciones de ingreso a un centro educativo."},
        "gestiones": [
            {"fecha": "2026-10-06", "interlocutor": "Padre", "rol": "Familia", "medio": "Reunión presencial",
             "tema": "Trámite o gestión", "contenido": "Se orienta a la familia sobre los pasos para solicitar la inscripción.",
             "acuerdos": "Retomar el tema en la próxima entrevista."},
        ],
    },
}

#: HCE-DOC y fotos (C5, §5.155): lo que cargaría el técnico del grupo, **por la API** (multipart). Los archivos se
#: generan acá (`pdf_demo`, `png_demo`): texto de demostración, ninguna imagen ni dato real. La autorización de Martín
#: apunta a su documento «Autorización / consentimiento» (clave `autorizacion`); Sofía no tiene autorización, para
#: mostrar que guardar una foto no la necesita (§5.99).
DOCUMENTOS_DEMO = {
    102: [
        {"clave": "informe", "categoria": "Informe escolar", "nombre": "Informe escolar — primer semestre (demostración)",
         "fecha_original": "2026-07-10", "archivo": "informe-escolar.pdf", "texto": "Informe escolar de demostracion - datos ficticios"},
        {"clave": "historico", "categoria": "Registro histórico — HCE anterior (Evaluación General)",
         "nombre": "Evaluación general 2024 — HCE anterior (demostración)", "fecha_original": "2024-11-20",
         "archivo": "evaluacion-general-2024.pdf", "texto": "Registro historico de demostracion - HCE anterior"},
        {"clave": "autorizacion", "categoria": "Autorización / consentimiento", "nombre": "Autorización de uso de imagen firmada (demostración)",
         "fecha_original": "2026-03-02", "archivo": "autorizacion-imagen.pdf", "texto": "Autorizacion de uso de imagen - demostracion"},
    ],
    101: [
        {"clave": "informe", "categoria": "Informe médico externo", "nombre": "Informe de neuropediatría (demostración)",
         "fecha_original": "2026-02-18", "archivo": "informe-medico.pdf", "texto": "Informe medico externo de demostracion"},
    ],
}
FOTOS_DEMO = {
    102: [{"descripcion": "Taller de juego estructurado (demostración)", "fecha": "2026-09-10", "color": (64, 120, 170)}],
    101: [{"descripcion": "Actividad de expresión plástica (demostración)", "fecha": "2026-08-27", "color": (170, 110, 60)}],
}
#: La autorización de Martín: registrada, con la copia firmada (el documento `autorizacion` de arriba).
AUTORIZACION_DEMO = {102: {"registrada": True, "fecha": "2026-03-02", "documento": "autorizacion"}}
FOTO_GRUPAL_DEMO = {"grupo": "Escolares", "descripcion": "Salida al parque del grupo (demostración)", "fecha": "2026-10-15", "color": (90, 150, 90)}


#: Ateneos y jornadas (C6, §5.158): los cuatro tipos, cargados por la API **en este orden** (el servidor asigna
#: `AT-<año>-001` … `004`). Fechas de 2026 anteriores al 13/11; en `participantes`, **roles y no nombres**; contenido
#: neutro y de demostración. El clínico es de Martín, con Escolares 2026 de contexto; la jornada no lleva acuerdos. El
#: institucional lleva un PDF adjunto (categoría «Otro», generado en código).
ATENEOS_DEMO: list[dict[str, Any]] = [
    {"tipo": "clinico", "nna": 102, "grupo": "Escolares", "fecha": "2026-09-17",
     "titulo": "Revisión de proceso: transiciones en sala (demostración)",
     "participantes": "Técnicos responsables del grupo · Coordinación técnica",
     "situacion": "Episodios de desregulación en los cambios de actividad durante el segundo semestre.",
     "hipotesis": "La desregulación se asocia a la falta de anticipación visual de las transiciones.",
     "recursos": "Interés por la música como motivador · vínculo con el equipo · familia colaboradora en las rutinas.",
     "seguimiento": "Revisión de los acuerdos en el ateneo de grupo de noviembre.",
     "acuerdos": [
         {"acuerdo": "Implementar una agenda visual de transiciones en sala", "responsable_rol": "Técnico/a responsable 2",
          "plazo": "2026-10-15"},
         {"acuerdo": "Registrar la frecuencia de episodios antes y después de la agenda visual",
          "responsable_rol": "Técnico/a responsable 1", "plazo": "2026-11-30"},
     ]},
    {"tipo": "grupo", "grupo": "Preadolescentes", "fecha": "2026-10-08",
     "titulo": "Balance del segundo semestre del grupo (demostración)",
     "participantes": "Técnicos responsables · Coordinación técnica",
     "situacion": "Balance de la dinámica grupal y de los apoyos visuales en uso en la sala.",
     "hipotesis": "Los apoyos visuales compartidos ordenan mejor las consignas grupales que los individuales.",
     "recursos": "Dinámica grupal consolidada · materiales visuales elaborados por el equipo.",
     "seguimiento": "Verificación en el primer ateneo de grupo del próximo año.",
     "acuerdos": [
         {"acuerdo": "Unificar los apoyos visuales de la sala para todo el grupo", "responsable_rol": "Coordinación técnica",
          "plazo": "2026-12-15"},
     ]},
    {"tipo": "institucional", "fecha": "2026-06-18",
     "titulo": "Estructura de los registros de ateneo (demostración)",
     "participantes": "Equipo técnico · Dirección",
     "situacion": "Análisis de cómo se registraron los ateneos del primer semestre.",
     "hipotesis": "Explicitar la hipótesis y los recursos en cada registro mejora el seguimiento de los acuerdos.",
     "recursos": "Plantilla de registro acordada por el equipo.",
     "seguimiento": "Nueva revisión de los registros a fin de año.",
     "documento": {"categoria": "Otro", "nombre": "Acta de la reunión (demostración)", "archivo": "acta-ateneo.pdf",
                   "texto": "Acta de ateneo institucional - demostracion, datos ficticios"}},
    {"tipo": "jornada", "fecha": "2026-05-08",
     "titulo": "Aplicación calibrada del IDEA (demostración)",
     "participantes": "Evaluadores IDEA de la institución",
     "capacitador": "Equipo técnico interno (Dirección técnica)", "modalidad": "Presencial",
     "contenidos": "Reglas comunes de aplicación · anclajes con ejemplos · errores frecuentes.",
     "materiales": "Criterios de aplicación del IDEA (documento institucional).",
     "evaluacion": "Ejercicio de puntuación independiente y puesta en común."},
]


def pdf_demo(texto: str) -> bytes:
    """Un PDF 1.4 **mínimo y válido** (una página A4 con una línea de texto ASCII), con la tabla xref bien calculada."""
    linea = "".join(c for c in texto if c not in "()\\" and 32 <= ord(c) < 127)
    contenido = f"BT /F1 14 Tf 72 770 Td ({linea}) Tj ET".encode("ascii")
    objetos = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(contenido)).encode() + b" >>\nstream\n" + contenido + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    salida = bytearray(b"%PDF-1.4\n")
    offsets = []
    for n, cuerpo in enumerate(objetos, start=1):
        offsets.append(len(salida))
        salida += f"{n} 0 obj\n".encode() + cuerpo + b"\nendobj\n"
    xref = len(salida)
    salida += f"xref\n0 {len(objetos) + 1}\n0000000000 65535 f \n".encode()
    salida += b"".join(f"{o:010d} 00000 n \n".encode() for o in offsets)
    salida += f"trailer\n<< /Size {len(objetos) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(salida)


def png_demo(rgb: tuple[int, int, int], ancho: int = 160, alto: int = 120) -> bytes:
    """Un PNG RGB chico y válido: un degradé del color dado (ninguna imagen real)."""
    def trozo(tipo: bytes, datos: bytes) -> bytes:
        return struct.pack(">I", len(datos)) + tipo + datos + struct.pack(">I", zlib.crc32(tipo + datos) & 0xFFFFFFFF)

    filas = bytearray()
    for y in range(alto):
        filas.append(0)
        k = 0.6 + 0.4 * y / max(alto - 1, 1)
        filas += bytes(int(c * k) for c in rgb) * ancho
    cabecera = struct.pack(">IIBBBBB", ancho, alto, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + trozo(b"IHDR", cabecera) + trozo(b"IDAT", zlib.compress(bytes(filas), 9)) + trozo(b"IEND", b"")


SOFIA_LB = {
    "dim": [4, 2, 4, 2, 2, 2, 4, 4, 2, 2, 1, 2], "obs": {}, "fecha_consenso": "2026-03-20", "sesiones": 5,
    "sintesis": "Perfil leve (total 31/96). Mayor afectación relativa en flexibilidad y en la relación con pares. Lenguaje formal preservado con dificultades pragmáticas claras. Nivel de soporte orientativo: 1.",
    "objetivos": "1) Habilidades conversacionales con pares (inicio y cierre). 2) Tolerancia a cambios de plan. 3) Identificación y expresión de emociones propias.",
}
#: PA de Sofía en borrador: ítems y semanas cargados, sin fecha ni síntesis (`fecha:""` → sin cargar).
SOFIA_PA = {"items": [3, 4, 3, 3, 3, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 4, 3, 3, 4, 3, 3, 4, 3, 3], "obs": {}, "semanas": 16}

#: LB de Joaquín en borrador, con `NS` en D3 y D12; sin fecha, síntesis ni objetivos.
JOAQUIN_LB = {
    "dim": [8, 8, "NS", 8, 8, 6, 6, 6, 8, 8, 6, "NS"],
    "obs": {3: "NS: se requiere más observación en juego compartido antes de puntuar D3."}, "sesiones": 5,
}

LB_OTROS = {103: [6, 4, 6, 4, 6, 4, 4, 6, 4, 4, 4, 3], 105: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3], 108: [4, 4, 4, 4, 4, 4, 4, 4, 4, 2, 4, 2]}
LB_OTROS_CAMPOS = {
    "fecha_consenso": "2026-03-25", "sesiones": 5,
    "sintesis": "Línea base IDEA de referencia (datos de demostración).",
    "objetivos": "Objetivos del período a definir con el equipo.",
}


class DemoNoCargable(RuntimeError):
    """La demo no se puede cargar en esta base (ya está, o falta algo que no se crea por la API)."""


@dataclass
class Resumen:
    expedientes: dict[int, int] = field(default_factory=dict)  # id de la demo → hce_id
    firmados: list[str] = field(default_factory=list)          # «Martín · HCE-LB», … (el CI: registrado)
    borradores: list[str] = field(default_factory=list)
    warnings: list[dict[str, Any]] = field(default_factory=list)  # avisos que devolvió la API
    ids: dict[str, int] = field(default_factory=dict)          # «102.lb», «102.ic»… → id del módulo
    severidad: list[str] = field(default_factory=list)         # «Martín», … (HCE-SEV registrada)
    organismos: list[str] = field(default_factory=list)        # «Martín», … (HCE-ORG con algún vínculo)
    inclusion: list[str] = field(default_factory=list)         # «Martín», … (HCE-INC con ficha)
    documentos: list[str] = field(default_factory=list)        # «Martín (3)», … (HCE-DOC con documentos)
    fotos: list[str] = field(default_factory=list)             # «Martín», «grupo Escolares», …
    autorizacion: list[str] = field(default_factory=list)      # «Martín», … (autorización de imagen registrada)
    ateneos: list[str] = field(default_factory=list)           # «AT-2026-001 (clinico)», … (C6)
    grupos: dict[str, int] = field(default_factory=dict)       # nombre real → grupo_id
    profesionales: dict[str, int] = field(default_factory=dict)

    def texto(self) -> str:
        return "\n".join([
            f"Expedientes: {len(self.expedientes)} · grupos: {', '.join(sorted(self.grupos))}",
            f"Cerrados — CI registrado; LB/PA/PB/IC firmados ({len(self.firmados)}): {', '.join(self.firmados)}",
            f"Borradores ({len(self.borradores)}): {', '.join(self.borradores)}",
            f"Severidad DSM-5-TR registrada ({len(self.severidad)}): {', '.join(self.severidad)}",
            f"Organismos (INAU/BPS) registrados ({len(self.organismos)}): {', '.join(self.organismos)}",
            f"Fichas de inclusión registradas ({len(self.inclusion)}): {', '.join(self.inclusion)}",
            f"Documentos cargados: {', '.join(self.documentos)} · fotos: {', '.join(self.fotos)}",
            f"Autorización de imagen registrada ({len(self.autorizacion)}): {', '.join(self.autorizacion)}",
            f"Ateneos y jornadas ({len(self.ateneos)}): {', '.join(self.ateneos)}",
            f"Avisos no bloqueantes de la API: {len(self.warnings)}",
        ])


# ── Bootstrap (fuera de la API) ──────────────────────────────────────────────
def preparar_usuarios(db, *, admin_email: str, admin_password: str, demo_password: str) -> list[str]:
    """Crea (si faltan) el admin y los dos profesionales de la demo con `crear_usuario`.

    **Escribe en la base directamente**: es lo único del seed que no pasa por la API, porque la API
    no da de alta usuarios (§5.90/§5.101). Sólo `flush`; commitea quien llama. Devuelve qué creó.
    """
    from sqlalchemy import func, select

    from app.core.constantes import ROL_ADMIN, ROL_TECNICO
    from app.crear_usuario import crear_usuario
    from app.models.identidad import Profesional
    from app.services.auth import normalizar_email

    creados = []
    for email, nombre, rol, password, especialidad in (
        (admin_email, "Coordinación (demo)", ROL_ADMIN, admin_password, None),
        (GONZALEZ["email"], GONZALEZ["nombre"], ROL_TECNICO, demo_password, GONZALEZ["especialidad"]),
        (TORRES["email"], TORRES["nombre"], ROL_TECNICO, demo_password, TORRES["especialidad"]),
    ):
        existe = db.scalar(select(Profesional.id).where(func.lower(Profesional.email) == normalizar_email(email)))
        if existe is None:
            crear_usuario(db, email=email, nombre=nombre, rol=rol, password=password, especialidad=especialidad)
            creados.append(email)
    return creados


# ── Carga (sólo HTTP) ────────────────────────────────────────────────────────
class _Api:
    """Envoltorio mínimo: un token por usuario y error claro ante una respuesta inesperada."""

    def __init__(self, cliente, resumen: Resumen):
        self.cliente = cliente
        self.resumen = resumen
        self.cabeceras: dict[str, str] = {}

    def entrar(self, email: str, password: str) -> dict[str, Any]:
        r = self.cliente.post("/auth/login", json={"email": email, "password": password})
        if r.status_code != 200:
            raise DemoNoCargable(f"No se pudo entrar como {email}: {r.status_code} {r.text}")
        cuerpo = r.json()
        self.cabeceras = {"Authorization": f"Bearer {cuerpo['access_token']}"}
        return cuerpo["usuario"]

    def _pedir(self, metodo: str, ruta: str, esperado: int, **kw) -> Any:
        r = self.cliente.request(metodo, ruta, headers=self.cabeceras, **kw)
        if r.status_code != esperado:
            raise DemoNoCargable(f"{metodo} {ruta} → {r.status_code} (se esperaba {esperado}): {r.text}")
        return r.json()

    def get(self, ruta: str, **kw) -> Any:
        return self._pedir("GET", ruta, 200, **kw)

    def subir(self, ruta: str, nombre_archivo: str, contenido: bytes, tipo_mime: str, campos: dict) -> dict:
        """Alta multipart (C5): un archivo y campos de formulario; 201 esperado."""
        r = self.cliente.request("POST", ruta, headers=self.cabeceras, files={"archivo": (nombre_archivo, contenido, tipo_mime)},
                                 data={k: v for k, v in campos.items() if v is not None})
        if r.status_code != 201:
            raise DemoNoCargable(f"POST {ruta} → {r.status_code} (se esperaba 201): {r.text}")
        respuesta = r.json()
        self.resumen.warnings.extend(respuesta.get("warnings", []))
        return respuesta["data"]

    def escribir(self, metodo: str, ruta: str, cuerpo: dict | None = None, esperado: int = 200) -> dict:
        respuesta = self._pedir(metodo, ruta, esperado, json=cuerpo if cuerpo is not None else {})
        self.resumen.warnings.extend(respuesta.get("warnings", []))
        return respuesta["data"]


def grupos_faltantes(existentes) -> list[str]:
    """Los grupos de `UBICACION_DEMO` que no están entre los nombres `existentes` (del año `ANIO`)."""
    return sorted(set(UBICACION_DEMO.values()) - set(existentes))


def _sin_grupos(faltan: list[str]) -> DemoNoCargable:
    return DemoNoCargable(
        f"Faltan los grupos {', '.join(faltan)} de {ANIO}: correr primero `python -m app.seed_catalogos`. "
        "No se escribió nada."
    )


def _ci_canonica(ci: str) -> str:
    return "".join(c for c in ci if c.isalnum())


def cis_cargadas(get: Callable[..., Any]) -> list[str]:
    """Las CI de la demo que ya existen, buscadas por la API (`get(ruta, params=...)` → JSON)."""
    return [
        nna["persona"]["ci"] for nna in NNA.values()
        if any(_ci_canonica(h["persona"]["ci"]) == _ci_canonica(nna["persona"]["ci"])
               for h in get("/hce", params={"ci": _ci_canonica(nna["persona"]["ci"]), "incluir_inactivos": "true"}))
    ]


def _dim(valores, obs: dict[int, str]) -> dict:
    salida = {f"D{i + 1}": {"valor": v} for i, v in enumerate(valores)}
    for n, texto in obs.items():
        salida[f"D{n}"]["obs"] = texto
    return salida


def _items(valores, obs: dict[int, str]) -> dict:
    salida = {str(i + 1): {"valor": v} for i, v in enumerate(valores)}
    for n, texto in obs.items():
        salida[str(n)]["obs"] = texto
    return salida


def cargar_demo(
    cliente, *, admin_email: str, admin_password: str, demo_password: str,
    progreso: Callable[[str], None] | None = None,
) -> Resumen:
    """Carga la demo **sólo por HTTP**. `cliente`: `httpx.Client` (o `TestClient`) con `base_url`.

    Aborta con `DemoNoCargable` **antes de escribir** si alguna CI de la demo ya existe o si falta
    alguno de los grupos reales de `UBICACION_DEMO`. Una falla posterior deja una carga parcial
    (§5.108: una transacción por request).
    """
    decir = progreso or (lambda _: None)
    resumen = Resumen()
    api = _Api(cliente, resumen)

    # 1. Admin: comprobaciones (sin escribir) y asignación de técnicos.
    api.entrar(admin_email, admin_password)
    ya = cis_cargadas(api.get)
    if ya:
        raise DemoNoCargable(f"La demo ya está cargada (existen las CI {', '.join(ya)}). No se escribió nada.")
    grupos = {g["nombre"]: g["id"] for g in api.get("/grupos", params={"anio": ANIO})}
    faltan = grupos_faltantes(grupos)
    if faltan:
        raise _sin_grupos(faltan)
    resumen.grupos = {n: grupos[n] for n in UBICACION_DEMO.values()}

    gonzalez = api.entrar(GONZALEZ["email"], demo_password)
    torres = api.entrar(TORRES["email"], demo_password)
    resumen.profesionales = {GONZALEZ["nombre"]: gonzalez["id"], TORRES["nombre"]: torres["id"]}
    api.entrar(admin_email, admin_password)
    for nombre, grupo_id in resumen.grupos.items():
        api.escribir("PATCH", f"/grupos/{grupo_id}", {
            "tecnico1_id": gonzalez["id"], "tecnico1_rol": GONZALEZ["especialidad"],
            "tecnico2_id": torres["id"], "tecnico2_rol": TORRES["especialidad"],
        })
        decir(f"Grupo {nombre} {ANIO}: {GONZALEZ['nombre']} + {TORRES['nombre']}")

    # 2. Todo lo clínico lo carga el Dr. González (`tecnico`).
    api.entrar(GONZALEZ["email"], demo_password)
    evaluadores = {"evaluador_t1_id": gonzalez["id"], "evaluador_t2_id": torres["id"]}

    for demo_id, nna in NNA.items():
        hce = api.escribir("POST", "/hce", {
            "persona": nna["persona"], "grupo_id": grupos[UBICACION_DEMO[nna["color"]]], **nna["hce"],
        }, esperado=201)
        resumen.expedientes[demo_id] = hce["id"]
        if "baja" in nna:
            api.escribir("PATCH", f"/hce/{hce['id']}", {"activo": False, "fecha_baja": nna["baja"]})
        decir(f"Expediente {nna['persona']['nombre']} ({demo_id}) → hce {hce['id']}")

    def etiqueta(demo_id: int, modulo: str) -> str:
        return f"{NNA[demo_id]['persona']['nombre']} · {modulo}"

    def ci(demo_id: int) -> None:
        api.escribir("POST", f"/hce/{resumen.expedientes[demo_id]}/consentimiento", {
            "firmante": NNA[demo_id]["persona"]["referente"], "fecha": CI_FECHAS[demo_id],
            "autorizaciones": {"evaluacion": True, "registro": True, "comunicacion": True},
        }, esperado=201)
        resumen.firmados.append(etiqueta(demo_id, "HCE-CI"))

    def lb(demo_id: int, datos: dict, firmar: bool) -> None:
        cuerpo = {"anio": ANIO, "dim": _dim(datos["dim"], datos["obs"]), **evaluadores,
                  **{k: v for k, v in datos.items() if k not in ("dim", "obs")}}
        idea = api.escribir("POST", f"/hce/{resumen.expedientes[demo_id]}/idea", cuerpo, esperado=201)
        resumen.ids[f"{demo_id}.lb"] = idea["id"]
        if firmar:
            api.escribir("POST", f"/idea/{idea['id']}/firmar")
            resumen.firmados.append(etiqueta(demo_id, "HCE-LB"))
        else:
            resumen.borradores.append(etiqueta(demo_id, "HCE-LB"))

    def protocolo(demo_id: int, tipo: str, datos: dict, firmar: bool) -> None:
        cuerpo = {"tipo": tipo, "anio": ANIO, "items": _items(datos["items"], datos["obs"]), **evaluadores,
                  **{k: v for k, v in datos.items() if k not in ("items", "obs")}}
        prot = api.escribir("POST", f"/hce/{resumen.expedientes[demo_id]}/protocolo", cuerpo, esperado=201)
        resumen.ids[f"{demo_id}.p{tipo.lower()}"] = prot["id"]
        modulo = f"HCE-P{tipo}"
        if firmar:
            api.escribir("POST", f"/protocolo/{prot['id']}/firmar")
            resumen.firmados.append(etiqueta(demo_id, modulo))
        else:
            resumen.borradores.append(etiqueta(demo_id, modulo))

    # Arquetipo 1 — Martín (102): ciclo completo firmado + recibí.
    ci(102)
    lb(102, MARTIN_LB, firmar=True)
    protocolo(102, "A", MARTIN_PA, firmar=True)
    protocolo(102, "B", MARTIN_PB, firmar=True)
    ic = api.escribir("POST", f"/hce/{resumen.expedientes[102]}/informe-cierre", {"anio": ANIO, **MARTIN_IC}, esperado=201)
    resumen.ids["102.ic"] = ic["id"]
    api.escribir("POST", f"/informe-cierre/{ic['id']}/firmar", {"firmantes": [gonzalez["id"], torres["id"]]})
    api.escribir("POST", f"/informe-cierre/{ic['id']}/recibi", {
        "firmante": NNA[102]["persona"]["referente"], "fecha": MARTIN_RECIBI_FECHA,
    }, esperado=201)
    resumen.firmados.append(etiqueta(102, "HCE-IC"))
    decir("Martín: CI → LB → PA → PB → IC firmados + recibí")

    # Arquetipo 2 — Sofía (101): CI + LB firmados; PA en borrador.
    ci(101)
    lb(101, SOFIA_LB, firmar=True)
    protocolo(101, "A", SOFIA_PA, firmar=False)
    # Arquetipo 3 — Joaquín (104): CI; LB en borrador con NS.
    ci(104)
    lb(104, JOAQUIN_LB, firmar=False)
    # Arquetipo 4 — Bruno (107): sin CI (no se carga nada).
    # Otros: CI + LB firmados.
    for demo_id, dim in LB_OTROS.items():
        ci(demo_id)
        lb(demo_id, {"dim": dim, "obs": {}, **LB_OTROS_CAMPOS}, firmar=True)
    decir("Sofía, Joaquín, Valentina, Lucía y Camila cargados; Bruno sin CI; Tomás dado de baja")
    # HCE-SEV (C2): la registra el técnico del grupo, como en la pantalla; el autor es el usuario del token.
    for demo_id, sev in SEVERIDAD.items():
        api.escribir("POST", f"/hce/{resumen.expedientes[demo_id]}/severidad", sev, esperado=201)
        resumen.severidad.append(NNA[demo_id]["persona"]["nombre"])
    decir(f"Severidad DSM-5-TR: {', '.join(resumen.severidad)}; los demás sin registro")
    # HCE-ORG (C3): también por la API, como el técnico del grupo. El vencimiento de la AYEX es relativo a hoy.
    hoy = date.today()
    vencimientos = {102: hoy + timedelta(days=MARTIN_AYEX_DIAS), 101: hoy + timedelta(days=SOFIA_AYEX_DIAS)}
    for demo_id, org in ORGANISMOS_DEMO.items():
        ruta = f"/hce/{resumen.expedientes[demo_id]}/organismos"
        if "inau" in org:
            api.escribir("POST", f"{ruta}/inau", org["inau"], esperado=201)
        if "bps" in org:
            api.escribir("POST", f"{ruta}/bps", {**org["bps"], "vencimiento": vencimientos[demo_id].isoformat()}, esperado=201)
        for registro in org["registros"]:
            api.escribir("POST", f"{ruta}/registros", registro, esperado=201)
        resumen.organismos.append(NNA[demo_id]["persona"]["nombre"])
    decir(f"Organismos INAU/BPS: {', '.join(resumen.organismos)}; los demás sin vínculos")
    # HCE-INC (C4): la ficha y sus gestiones, por la API y como el técnico del grupo. `fecha_estado` la fija el servidor.
    for demo_id, inc in INCLUSION_DEMO.items():
        ruta = f"/hce/{resumen.expedientes[demo_id]}/inclusion"
        api.escribir("POST", ruta, inc["ficha"], esperado=201)
        for gestion in inc["gestiones"]:
            api.escribir("POST", f"{ruta}/bitacora", gestion, esperado=201)
        resumen.inclusion.append(NNA[demo_id]["persona"]["nombre"])
    decir(f"Inclusión: {', '.join(resumen.inclusion)}; los demás sin ficha")
    # HCE-DOC y fotos (C5): por la API (multipart), como el técnico del grupo. Archivos generados en código.
    categorias = {c["nombre"]: c["id"] for c in api.get("/documentos/categorias")}
    docs_ids: dict[int, dict[str, int]] = {}
    for demo_id, docs in DOCUMENTOS_DEMO.items():
        hid = resumen.expedientes[demo_id]
        for d in docs:
            creado = api.subir(f"/hce/{hid}/documentos", d["archivo"], pdf_demo(d["texto"]), "application/pdf", {
                "categoria_id": str(categorias[d["categoria"]]), "nombre": d["nombre"], "fecha_original": d["fecha_original"],
            })
            docs_ids.setdefault(demo_id, {})[d["clave"]] = creado["id"]
            resumen.ids[f"{demo_id}.doc.{d['clave']}"] = creado["id"]
        resumen.documentos.append(f"{NNA[demo_id]['persona']['nombre']} ({len(docs)})")
    for demo_id, fotos in FOTOS_DEMO.items():
        for f in fotos:
            api.subir(f"/hce/{resumen.expedientes[demo_id]}/fotos", "foto.png", png_demo(f["color"]), "image/png",
                      {"descripcion": f["descripcion"], "fecha": f["fecha"]})
        resumen.fotos.append(NNA[demo_id]["persona"]["nombre"])
    for demo_id, aut in AUTORIZACION_DEMO.items():
        api.escribir("POST", f"/hce/{resumen.expedientes[demo_id]}/autorizacion-imagen", {
            "registrada": aut["registrada"], "fecha": aut["fecha"], "documento_id": docs_ids[demo_id][aut["documento"]],
        }, esperado=201)
        resumen.autorizacion.append(NNA[demo_id]["persona"]["nombre"])
    g = FOTO_GRUPAL_DEMO
    api.subir(f"/grupos/{resumen.grupos[g['grupo']]}/fotos", "foto-grupo.png", png_demo(g["color"]), "image/png",
              {"descripcion": g["descripcion"], "fecha": g["fecha"]})
    resumen.fotos.append(f"grupo {g['grupo']}")
    decir(f"Documentos: {', '.join(resumen.documentos)}; fotos: {', '.join(resumen.fotos)}; "
          f"autorización de imagen: {', '.join(resumen.autorizacion)}")
    # Ateneos y jornadas (C6): por la API, como el técnico; el servidor asigna el código y el autor.
    for at in ATENEOS_DEMO:
        cuerpo = {k: v for k, v in at.items() if k not in ("nna", "grupo", "documento")}
        if "nna" in at:
            cuerpo["hce_referida_id"] = resumen.expedientes[at["nna"]]
        if "grupo" in at:
            cuerpo["grupo_id"] = resumen.grupos[at["grupo"]]
        creado = api.escribir("POST", "/ateneos", cuerpo, esperado=201)
        resumen.ids[f"ateneo.{at['tipo']}"] = creado["id"]
        if "documento" in at:
            d = at["documento"]
            api.subir(f"/ateneos/{creado['id']}/documentos", d["archivo"], pdf_demo(d["texto"]), "application/pdf",
                      {"categoria_id": str(categorias[d["categoria"]]), "nombre": d["nombre"]})
        resumen.ateneos.append(f"{creado['codigo']} ({at['tipo']})")
    decir(f"Ateneos: {', '.join(resumen.ateneos)}")
    return resumen


# ── CLI ──────────────────────────────────────────────────────────────────────
def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.seed_demo", description=__doc__.splitlines()[0])
    parser.add_argument("--url", required=True, help="Base de la API corriendo, p. ej. http://localhost:8000")
    args = parser.parse_args(argv)

    from app.core.destino import confirmar_destino

    if not confirmar_destino(api=args.url):  # antes de todo: ni credenciales ni red ni base
        return 1

    admin_email = os.environ.get("IPPU_EMAIL")
    admin_password = os.environ.get("IPPU_PASSWORD")
    if not admin_email or not admin_password:
        print("Faltan IPPU_EMAIL / IPPU_PASSWORD (credenciales del admin) en el entorno.", file=sys.stderr)
        return 1
    demo_password = os.environ.get("IPPU_DEMO_PASSWORD") or admin_password

    import httpx

    from app.core.database import SessionLocal

    try:
        with httpx.Client(base_url=args.url, timeout=30) as cliente:
            cliente.get("/health").raise_for_status()
            return ejecutar(
                cliente, SessionLocal,
                admin_email=admin_email, admin_password=admin_password, demo_password=demo_password,
            )
    except httpx.HTTPError as exc:
        print(f"No se pudo hablar con la API en {args.url}: {exc}", file=sys.stderr)
        return 1


def ejecutar(cliente, sesiones, *, admin_email: str, admin_password: str, demo_password: str) -> int:
    """Lo que hace la CLI, con el cliente HTTP y la fábrica de sesiones inyectados (la suite los
    apunta a la base de test). Devuelve el código de salida.

    **Ninguna escritura antes de las dos comprobaciones**: que la demo no esté cargada y que existan
    los grupos de `UBICACION_DEMO`. Los grupos se miran en la base, no por la API, porque en una base
    nueva el admin todavía no existe y no hay con quién entrar.
    """
    from app.crear_usuario import DatoInvalido
    from app.services.referencias import listar_grupos

    try:
        # 1. Comprobación previa por la API (si el admin ya puede entrar), sin escribir.
        _comprobar_vacia(cliente, admin_email, admin_password)
        with sesiones() as db:
            # 2. Grupos, antes del bootstrap: sin `seed_catalogos` no se crea ni un usuario.
            faltan = grupos_faltantes(g.nombre for g in listar_grupos(db, ANIO))
            if faltan:
                raise _sin_grupos(faltan)
            # 3. Bootstrap de usuarios (fuera de la API).
            creados = preparar_usuarios(
                db, admin_email=admin_email, admin_password=admin_password, demo_password=demo_password,
            )
            db.commit()
        for email in creados:
            print(f"Usuario creado (bootstrap fuera de la API): {email}")
        # 4. Todo lo demás, por HTTP.
        resumen = cargar_demo(
            cliente, admin_email=admin_email, admin_password=admin_password,
            demo_password=demo_password, progreso=print,
        )
    except (DemoNoCargable, DatoInvalido) as exc:
        print(f"No se cargó la demo: {exc}", file=sys.stderr)
        return 1
    print(resumen.texto())
    return 0


def _comprobar_vacia(cliente, admin_email: str, admin_password: str) -> None:
    """Antes del bootstrap: si el admin ya puede entrar, mira por la API si la demo está cargada.
    Si todavía no existe, no hay nada que mirar con él; `cargar_demo` igual lo vuelve a comprobar
    antes de escribir datos clínicos."""
    r = cliente.post("/auth/login", json={"email": admin_email, "password": admin_password})
    if r.status_code != 200:
        return
    cabeceras = {"Authorization": f"Bearer {r.json()['access_token']}"}

    def get(ruta, **kw):
        respuesta = cliente.get(ruta, headers=cabeceras, **kw)
        respuesta.raise_for_status()
        return respuesta.json()

    ya = cis_cargadas(get)
    if ya:
        raise DemoNoCargable(f"La demo ya está cargada (existen las CI {', '.join(ya)}). No se escribió nada.")


if __name__ == "__main__":
    sys.exit(main())
