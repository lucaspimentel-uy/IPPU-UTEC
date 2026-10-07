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

Sólo CI/LB/PA/PB/IC: ni documentos, ni fotos, ni INC, PAI ni SEV.

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

Con la API corriendo (`uvicorn app.main:app`). Credenciales del admin en el entorno, misma
convención que `crear_usuario`: `IPPU_EMAIL` / `IPPU_PASSWORD`. La contraseña de los dos
profesionales de la demo es `IPPU_DEMO_PASSWORD` (por omisión, la del admin: sólo desarrollo). Sale
con código 1 si la demo ya estaba cargada o si faltan los grupos (en los dos casos, sin escribir
nada) o si algo falla. Orden de `ejecutar`: (1) ¿la demo ya está? (por la API, si el admin ya
existe) → (2) ¿están los grupos? (en la base) → (3) bootstrap de usuarios → (4) `cargar_demo`.
"""
from __future__ import annotations

import argparse
import os
import sys
from collections.abc import Callable
from dataclasses import dataclass, field
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
    grupos: dict[str, int] = field(default_factory=dict)       # nombre real → grupo_id
    profesionales: dict[str, int] = field(default_factory=dict)

    def texto(self) -> str:
        return "\n".join([
            f"Expedientes: {len(self.expedientes)} · grupos: {', '.join(sorted(self.grupos))}",
            f"Cerrados — CI registrado; LB/PA/PB/IC firmados ({len(self.firmados)}): {', '.join(self.firmados)}",
            f"Borradores ({len(self.borradores)}): {', '.join(self.borradores)}",
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
    return resumen


# ── CLI ──────────────────────────────────────────────────────────────────────
def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.seed_demo", description=__doc__.splitlines()[0])
    parser.add_argument("--url", required=True, help="Base de la API corriendo, p. ej. http://localhost:8000")
    args = parser.parse_args(argv)

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
