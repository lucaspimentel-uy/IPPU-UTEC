"""Límites del asistente (plan §8) por reglas deterministas, antes del modelo y fuera de él.

Orden fijo: LIM-7 (crisis) → LIM-9 (inyección / rol declarado) → LIM-6 (enmascarar datos)
→ LIM-1, 2, 3, 4, 8, 10 → recuperación. LIM-5 (sin respaldo) se decide después de buscar, con el umbral
(F1-c2); LIM-11 lo arma asistente/respuesta.py cuando hay dos fragmentos que no coinciden.

Los patrones se escriben en minúsculas y sin tildes, y se comparan contra el texto normalizado con la misma
función que usa el índice. Para crisis y riesgo clínico, ante la duda, se rechaza.
Ningún límite cierra la sesión: `continuar` es siempre True en v1 (plan §8, LIM-7).
"""
import re
from dataclasses import dataclass, field

from asistente import mensajes
from asistente.indice import normalizar, tokenizar

ESCALAR_HUMANO = "escalar_humano"
RECHAZAR = "rechazar"
CITAR_Y_DERIVAR = "citar_procedimiento_y_derivar"
RECUPERAR = "recuperar"


def _r(*patrones: str) -> re.Pattern:
    return re.compile("|".join(f"(?:{p})" for p in patrones))


# --- LIM-7 · crisis -------------------------------------------------------------------------------
CRISIS = _r(
    r"\bautoles", r"\bsuicid", r"quitarse la vida", r"\bmatar(se|me|lo|la)\b", r"hacer(se|me)? dano",
    r"\blastimar(se|me)\b", r"\bse (esta )?(golpea|golpeando|corta|cortando|lastima|lastimando)\b",
    r"golpea\w* la cabeza", r"\bse quiere morir", r"\bviolencia\b", r"\babus(o|aron|aba)\b",
    r"\b(le|la|lo) (pega|pegan|pegaron|pegaba)\b", r"\bconvulsi", r"\bno respira", r"\bdesmay",
    r"\burgencia\b", r"\bemergencia\b", r"\bsangr(a|ando|e)\b", r"\bintoxic", r"\bse escap(o|a)\b",
)

# --- LIM-9 · instrucciones que cambian las reglas y roles declarados --------------------------------
INYECCION = _r(
    r"\b(ignora|ignorar|ignore|olvida|olvidate|olvidar|saltea|salteate|desactiva)\w*( de)? (todas )?(tus|las|sus)"
    r"( \w+)?? (instrucciones|reglas|limites|restricciones)( anteriores| previas)?",
    r"\b(desde|a partir de) ahora\b[^.?!\n]*",
    r"\b(actua|actuar|comportate|haz de cuenta|hace de cuenta|fingi|finge) (como|que)[^.?!:\n]*",
    r"\b(sos|eres|seras|serias) (un |una )?(psiquiatra|medic[oa]|doctor[a]?|psicolog[oa]|neurolog[oa]"
    r"|terapeuta|abogad[oa]|juez|asistente sin limites)\b",
    r"\[?\b(nota|instruccion|instrucciones|mensaje) (para|al) (el )?asistente\b[^\]\n]*\]?",
    r"\b(system prompt|prompt del sistema|modo (desarrollador|developer|sin limites))\b",
    r"\b(sin|ignorando) (limites|restricciones|citas)\b",
)
ROL_DECLARADO = _r(
    r"\b(yo )?soy (el |la )?(director|directora|psiquiatra|medic[oa]|doctor[a]?|psicolog[oa]|coordinador[a]?"
    r"|administrador[a]?|admin|duen[oa]|jef[ea]|responsable)( de (ippu|la fundacion|la institucion))?\b",
    r"\b(como|en mi rol de) (director|directora|coordinador[a]?|administrador[a]?)\b[^,.?!\n]*",
    r"\b(te )?(autorizo|habilito|doy permiso)\b[^,.?!\n]*",
    r"\b(habilitame|autorizame|desbloquea\w*)\b",
    r"\btengo (permiso|autorizacion|acceso total)\b[^,.?!\n]*",
)

# --- LIM-6 · datos personales (sobre el texto original) --------------------------------------------
_CI = re.compile(r"(?<![\w.])[\dxX]{1,2}[.\s]?[\dxX]{3}[.\s]?[\dxX]{3}\s?-\s?[\dxX](?![\w])|(?<![\w.])\d{7,8}(?![\w.])")
_CORREO = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
_TELEFONO = re.compile(r"(?<![\w])\+?\d[\d\s-]{6,}\d(?![\w])")
_MAYUSCULA = r"[A-ZÁÉÍÓÚÑ][a-záéíóúüñ]+"
_NOMBRE_TRAS_MARCADOR = re.compile(
    r"(?i:\b(?:mi|su|el|la|este|esta|un|una) (?:hij[oa]|niñ[oa]|nene|nena|paciente|alumn[oa]|nna|gurí|gurisa)"
    r"|\bse llama|\bllamad[oa]|\bde nombre|\bes por)"
    rf"(?:,)?\s+[\"«“']?({_MAYUSCULA}(?:\s+{_MAYUSCULA}){{0,2}})[\"»”']?"
)
_NOMBRE_ENTRE_COMILLAS = re.compile(rf"[\"«“]({_MAYUSCULA}(?:\s+{_MAYUSCULA}){{1,3}})[\"»”]")
_CODIGO = re.compile(r"\b[A-ZÁÉÍÓÚÑ]{3,}-\d{2,}\b")
_FECHA = re.compile(r"\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}")

# --- LIM-1 · diagnóstico ----------------------------------------------------------------------------
DIAGNOSTICO = _r(
    r"\bdiagnostic(a|ame|ale|alo|ala|ar|ari\w*)\b",
    r"\b(que|cual) (es el |seria el |seria su |es su )?diagnostico\b",
    r"\bdiagnostico (tiene|le corresponde|le pondrias|le pones|seria)\b",
    r"\b(tiene|es|seria) (tea|autismo|autista|asperger)\b",
    r"\besto (que describo )?es (tea|autismo)\b",
    r"\bque nivel de (apoyo|soporte)[^?]* (tiene|le corresponde|es)\b",
    r"\b(que|cual) (nivel|grado) (de \w+ )?tiene\b",
    r"\bque tiene\s*\?\s*$",
)

# --- LIM-2 · indicación terapéutica individual ------------------------------------------------------
TERAPIA = _r(
    r"\b(que|cual)\b[^?.]{0,40}\b(metodo|tecnica|terapia|tratamiento|medicacion|medicamento|taller|intervencion"
    r"|abordaje|actividad|estrategia)\w*\b[^?.]{0,40}\b(convien|recomend|sirv|aplic|indic|deberi|elegi|usar|uso|damos)\w*",
    r"\b(medicac|medicament|dosis|farmac|psicofarmac|pastilla)\w*",
    r"\b(le|les) (doy|damos|aplico|aplicamos|indico|indicamos|recomiendo|recomendamos)\b(?! (de |el )?alta)",
)

# --- LIM-3 · interpretar el caso de un NNA concreto -------------------------------------------------
CASO_PARTICULAR = _r(
    r"\b(saco|obtuvo|le dio|le salio|puntuo|tuvo|saca|obtiene)\s+(un |una )?-?\d+(?!\s*(anos|meses|semanas|dias))",
    r"\bsignifica[^?]{0,30}\bpara (el|ella|mi \w+|su \w+|este \w+|esta \w+|el nino|la nina)\b",
    r"\b(su|sus) (puntaje|resultado|total|delta|perfil|evaluacion|idea)\w*\b[^?]{0,40}\b(significa|indica|quiere decir|muestra)",
    r"\b(mi hij[oa]|este nna|este nino|esta nina|el nene|la nena)\b[^?]{0,60}\b(significa|quiere decir|esta (bien|mal)|es grave|retroced|avanz)",
)

# --- LIM-4 · decisión clínica -----------------------------------------------------------------------
DECISION = _r(
    r"\b(lo|la|los|las|le|les) (damos|doy|dan) (de |el )?alta\b",
    r"\bdar(le|les)? (el )?alta\b",
    r"\b(lo|la|los|las) (cambio|cambiamos|paso|pasamos|reingreso|reingresamos|derivo|derivamos|egreso|egresamos"
    r"|internamos|sacamos|dejamos)\b",
    r"\b(deberiamos|debemos|conviene|corresponde|hay que) (darle|darlo|cambiarlo|cambiarla|derivarlo|derivarla"
    r"|reingresarlo|reingresarla|egresarlo|egresarla|internarlo|internarla|sacarlo|sacarla)\b",
)

# --- LIM-8 · compartir con terceros o consejo legal sobre un caso -----------------------------------
TERCEROS = _r(
    r"\b(puedo|podemos|se puede|debo|debemos|tengo que|tenemos que)\b[^?.]{0,20}\b(mandar|enviar|pasar|compartir"
    r"|entregar|dar|mostrar|reenviar)\w*\b[^?.]{0,60}\b(escuela|maestr|colegio|liceo|docente|inau|bps|msp|juez"
    r"|juzgado|fiscal|abogad|policia|familia|padre|madre|otra institucion|tercer|prensa)",
    r"\b(estoy|estamos) obligad", r"\bme (pueden|podrian) (demandar|denunciar)", r"\bes (legal|ilegal)\b",
    r"\b(oficio judicial|orden del juez|citacion judicial)\b", r"\bnos (estan|esta) pidiendo la (hc|historia)",
)

# --- LIM-10 · redactar o completar registros clínicos ----------------------------------------------
_REGISTRO = (r"(informe|sintesis|evaluacion|registro|protocolo|anamnesis|valoracion|historia|addenda|objetivos"
             r"|recomendaciones|orientaciones|ic|vf|pa|pb)\b")
REDACCION = _r(
    rf"\b(redact|escrib|complet|arm|hac|gener|llen|rellen)\w*me\b[^?]{{0,40}}\b{_REGISTRO}",
    rf"\b(podes|puedes|podrias|me) (redactar|escribir|completar|armar|hacer|generar|llenar)\b[^?]{{0,40}}\b{_REGISTRO}",
    rf"(^|[.?!:]\s*)(redacta|escribi|completa|arma|genera|llena)\b[^?]{{0,40}}\b{_REGISTRO}",
)

_CLINICOS = (
    ("LIM-1", DIAGNOSTICO, RECHAZAR, mensajes.A),
    ("LIM-2", TERAPIA, RECHAZAR, mensajes.A),
    ("LIM-3", CASO_PARTICULAR, RECHAZAR, mensajes.A),
    ("LIM-4", DECISION, RECHAZAR, mensajes.A),
    ("LIM-8", TERCEROS, CITAR_Y_DERIVAR, mensajes.DERIVACION),
    ("LIM-10", REDACCION, RECHAZAR, mensajes.A),
)


@dataclass(frozen=True)
class Decision:
    lim: str | None
    accion: str
    mensaje: str | None
    consulta_enmascarada: str
    continuar: bool = True
    disparados: tuple[str, ...] = field(default=())
    avisos: tuple[str, ...] = field(default=())


def _quitar(texto: str, patron: re.Pattern) -> tuple[str, bool]:
    """Borra del texto original los tramos que el patrón encuentra en el texto normalizado (mismo largo)."""
    tramos = [m.span() for m in patron.finditer(normalizar(texto))]
    for ini, fin in reversed(tramos):
        texto = texto[:ini] + " " + texto[fin:]
    return texto, bool(tramos)


def limpiar_instrucciones(texto: str) -> tuple[str, bool]:
    """LIM-9: quita instrucciones y roles declarados. Sirve para la consulta y para un fragmento recuperado."""
    texto, inyeccion = _quitar(texto, INYECCION)
    texto, rol = _quitar(texto, ROL_DECLARADO)
    return re.sub(r"\s{2,}", " ", texto).strip(" ,.;:"), inyeccion or rol


def enmascarar(texto: str) -> tuple[str, bool]:
    """LIM-6: reemplaza correos, cédulas, teléfonos, códigos y nombres por marcadores."""
    original = texto
    texto = _CORREO.sub("[CORREO]", texto)
    texto = _CI.sub("[CI]", texto)
    texto = _TELEFONO.sub(
        lambda m: m.group() if _FECHA.fullmatch(m.group()) or sum(c.isdigit() for c in m.group()) < 7 else "[TELÉFONO]",
        texto,
    )
    texto = _CODIGO.sub("[ID]", texto)
    texto = _NOMBRE_ENTRE_COMILLAS.sub("[NOMBRE]", texto)
    texto = _NOMBRE_TRAS_MARCADOR.sub(lambda m: m.group(0).replace(m.group(1), "[NOMBRE]"), texto)
    return texto, texto != original


def evaluar(consulta: str) -> Decision:
    """Decide qué hace el asistente con una consulta antes de buscar. Nunca devuelve la consulta original."""
    disparados: list[str] = []
    avisos: list[str] = []

    if CRISIS.search(normalizar(consulta)):
        texto, _ = enmascarar(limpiar_instrucciones(consulta)[0])
        return Decision("LIM-7", ESCALAR_HUMANO, mensajes.C, texto, True, ("LIM-7",))

    texto, hubo_instrucciones = limpiar_instrucciones(consulta)
    if hubo_instrucciones:
        disparados.append("LIM-9")
        avisos.append("Se ignoraron instrucciones o roles declarados: no habilitan nada.")

    texto, hubo_datos = enmascarar(texto)
    if hubo_datos:
        disparados.append("LIM-6")
        avisos.append(mensajes.AVISO_DATOS)

    normal = normalizar(texto)
    for lim, patron, accion, mensaje in _CLINICOS:
        if patron.search(normal):
            disparados.append(lim)
            return Decision(lim, accion, mensaje, texto, True, tuple(disparados), tuple(avisos))

    if hubo_instrucciones and len(tokenizar(texto)) < 2:
        return Decision("LIM-9", RECHAZAR, mensajes.B, texto, True, tuple(disparados), tuple(avisos))

    lim = "LIM-6" if hubo_datos else ("LIM-9" if hubo_instrucciones else None)
    mensaje = mensajes.AVISO_DATOS if hubo_datos else None
    return Decision(lim, RECUPERAR, mensaje, texto, True, tuple(disparados), tuple(avisos))
