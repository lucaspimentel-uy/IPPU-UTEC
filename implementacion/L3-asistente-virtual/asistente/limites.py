"""Límites del asistente (plan §8) por reglas deterministas, antes del modelo y fuera de él.

Orden fijo: LIM-7 (crisis) → LIM-9 (inyección / rol declarado) → LIM-6 (enmascarar datos)
→ LIM-10, LIM-1 y «caso particular + pedido» (LIM-8, 3, 4, 2) → recuperación. LIM-5 (sin respaldo) se decide después de buscar, con el umbral
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
# Dos o más palabras seguidas con mayúscula inicial, fuera del comienzo de la oración (F1-c4). No se enmascaran
# siglas ni estos nombres de documentos e instituciones; ante la duda, se enmascara.
_SECUENCIA_MAYUSCULAS = re.compile(r"(?<![\w\[])[A-ZÁÉÍÓÚÑ][\wáéíóúüñ]*(?:[ \t]+[A-ZÁÉÍÓÚÑ][\wáéíóúüñ]*)+")
_NO_SON_NOMBRES = frozenset("IDEA IPPU UTEC LIDIA HCE Protocolo MIDES BPS ASSE INAU ANEP".split())
_COMIENZO_DE_ORACION = re.compile(r"(^|[.?!:;]\s*)[¿¡«\"(\s]*$")
_FECHA = re.compile(r"\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4}")

# --- LIM-1, 2, 3, 4, 8 y 10 · «caso particular + pedido de juicio o acción» (F1-c4) ------------------
# Dos detectores sobre la consulta ya limpia (LIM-9) y enmascarada (LIM-6), en texto normalizado.
# Ante la duda, se rechaza. Reglas de decisión, en este orden:
#   redactar + objeto de registro → LIM-10 · diagnóstico pedido → LIM-1 (las dos, haya caso o no)
#   caso particular + compartir con terceros → LIM-8
#   caso particular + interpretar → LIM-3 · + decidir → LIM-4 · + tratar (o no se distingue) → LIM-2
# Una pregunta general (sin caso particular) sobre el IDEA, el flujo o los procedimientos NO se rechaza.

_VERBOS_CON_CLITICO = (
    "doy|damos|das|da|dan|mando|mandamos|manda|paso|pasamos|cambio|cambiamos|subo|subimos|bajo|bajamos|dejo|dejamos"
    "|saco|sacamos|derivo|derivamos|reingreso|reingresamos|egreso|egresamos|aplico|aplicamos|indico|indicamos"
    "|recomiendo|recomendamos|recomiendan|digo|decimos|envio|enviamos|entrego|entregamos|muestro|mostramos|comparto"
    "|compartimos|puedo|podemos|debo|debemos|tengo|tenemos|hago|hacemos|pongo|ponemos|medico|medicamos|interno"
    "|internamos|conviene|convendria|sirve|serviria|toca|dio|salio|calmo|calmamos|trato|tratamos|manejo|manejamos"
)
CASO_PARTICULAR = _r(
    rf"\b(se )?(le|lo|la|les|los|las) ({_VERBOS_CON_CLITICO})\b",                      # «le doy», «lo pasamos», «se lo mando»
    r"\b\w+(ar|er|ir)(selo|sela|selos|selas|le|lo|la|les|los|las)\b",                # «derivarlo», «entregarla»
    r"\bmi (hij[oa]|nen[ea]|alumn[oa]|paciente|sobrin[oa]|niet[oa]|guri|gurisa)\b",
    r"\b(este|esta|ese|esa|aquel|aquella) (nen[ea]|nin[oa]|guri|gurisa|chiquilin[a]?|alumn[oa]|paciente|nna"
    r"|adolescente|joven|chic[oa]|muchach[oa])\b",
    r"\b(el|la|del|de la|al|a la) (nen[ea]|nin[oa]|guri|gurisa|chiquilin[a]?|chic[oa])\b",
    r"\b(el|la) (de|del) (la sala|sala|grupo|taller|turno)\b",
    r"\btiene \d+ (anos|meses)\b", r"\bde \d+ anos\b",                                   # edad concreta
    r"\b(saco|obtuvo|le dio|dio|le salio|puntuo|tuvo|saca|obtiene)\s+(un |una )?-?\d+(?!\s*(anos|meses|semanas|dias))",
    r"\b(hoy|ayer|anoche|esta manana|esta tarde|esta semana|la semana pasada|desde hace|todas las (noches|mananas)"
    r"|cada vez que)\b",                                                                  # situación observada
    r"\[nombre\]",                                                                        # un nombre ya enmascarado
)

DIAGNOSTICO_PEDIDO = _r(
    r"\bdiagnostic(a|ame|ale|alo|ala|ar|ari\w*)\b",
    r"\b(que|cual) (seria|es|sera|podria ser) (el |su )?diagnostico\b",
    r"\b(que|cual) diagnostico\b",
    r"\bdiagnostico (mas probable|probable|posible|presuntivo|tiene|le corresponde|le pondrias|le pones|seria)\b",
    r"\b(dame|decime|deci|dime|tirame|pasame|sugerime|sugeri) (el |un |su )?diagnostico\b",
    r"\b(es|sera|seria|podria ser|puede ser|tiene|tendra|podria tener) (un |una )?(tea|autismo|autista|asperger|tgd)\b",
    r"\b(esta|estara|estaria) (dentro del|en el) espectro\b",
    r"\besto (que describo )?es (tea|autismo)\b",
    r"\bque nivel de (apoyo|soporte)[^?]* (tiene|le corresponde|es)\b",
    r"\b(que|cual) (nivel|grado) (de \w+ )?tiene\b",
    r"\bque tiene\s*\?\s*$",
)

_OBJETOS_DE_REGISTRO = (r"(evolucion|evoluciones|informe|nota|notas|registro|historia|ficha|sintesis|anamnesis"
                        r"|valoracion|addenda|adenda|objetivos|recomendaciones|orientaciones|epicrisis|acta|ic|vf|pa|pb)")
REDACTAR = re.compile(
    rf"\b(?P<verbo>(redact|escrib|complet|confeccion|elabor|rellen|llen|arm|hac|gener)\w*)\b[^?.]{{0,40}}\b"
    rf"{_OBJETOS_DE_REGISTRO}\b"
)
# Si el verbo viene después de alguna de estas marcas, la pregunta es sobre el procedimiento, no un pedido.
_PROCEDIMIENTO = re.compile(r"\b(quien|quienes|se|como|cuando|donde|debe|deben|tiene que|tienen que|hay que|cada cuanto)"
                            r"\b[^?.]{0,12}$")

COMPARTIR = _r(
    r"\b(mand|envi|pas|compart|entreg|doy|dar|damos|muestr|mostr|reenvi)\w*\b[^?.]{0,50}\b(escuela|maestr|profesor"
    r"|colegio|liceo|docente|inau|bps|msp|asse|juez|juzgado|fiscal|abogad|policia|prensa|otra institucion"
    r"|mutualista|medico de afuera|tercer|club|empresa)",
    r"\bse (lo|la|los|las) (mando|mandamos|paso|pasamos|doy|damos|envio|enviamos|entrego|entregamos|muestro"
    r"|mostramos|reenvio|comparto|compartimos)\b",
    r"\b(estoy|estamos) obligad", r"\bme (pueden|podrian) (demandar|denunciar)", r"\bes (legal|ilegal)\b",
    r"\b(oficio judicial|orden del juez|citacion judicial)\b", r"\bnos (estan|esta) pidiendo la (hc|historia)",
)
INTERPRETAR = _r(
    r"\b(que significa|que quiere decir|que indica|como (lo |la )?interpreto|como se interpreta|que lectura)\b",
    r"\bsignifica\b",
    r"\bes (grave|preocupante|normal|bueno|malo|mucho|poco|bajo|alto|leve|severo|esperable)\b",
    r"\besta (bien|mal|grave|atrasad\w*|adelantad\w*|dentro de lo esperable)\b",
    r"\b(retrocedi\w*|empeor\w*|va bien|va mal)\b",
)
DECIDIR = _r(
    r"\balta\b", r"\bcambi\w* de grupo\b", r"\bpas\w* (a|al) (otro )?grupo\b", r"\bpas\w* de grupo\b",
    r"\b(subir|bajar)(lo|la)?\b", r"\breingres\w*", r"\begres\w*", r"\bderiv\w*", r"\bintern\w*",
    r"\bsac\w* del (grupo|taller|servicio)\b", r"\besperamos\b", r"\b(ya )?(esta|estaria) para\b",
    r"\b(dejarlo|dejarla|lo dejamos|la dejamos)\b",
)
TRATAR = _r(
    r"\b(que|cual)\b[^?.]{0,40}\b(metodo|tecnica|terapia|tratamiento|medicacion|medicamento|actividad|estrategia"
    r"|taller|abordaje|intervencion|ejercicio)\w*",
    r"\b(dosis|medicac|medicament|pastilla|remedio|melatonina|jarabe|gotas|farmac|psicofarmac|suplemento)\w*",
    r"\bque (le )?(doy|damos|puedo dar|podemos dar|aplico|aplicamos|hago|hacemos|indico|recomiendan|recomendas"
    r"|recomiendo)\b",
    r"\bque (le )?(puedo|podemos) (dar|hacer|aplicar|indicar)\b",
    r"\bque hago con (el|ella|\[nombre\])\b",
    r"\bcomo (lo|la) (calmo|calmamos|trato|tratamos|manejo|manejamos|ayudo|ayudamos)\b",
)


def caso_particular(consulta: str) -> bool:
    """La consulta refiere a un NNA concreto (pronombres con verbo, «mi hijo», «este nene», edad, puntaje, …)."""
    return bool(CASO_PARTICULAR.search(normalizar(consulta)))


def _pide_redactar(normal: str) -> bool:
    for m in REDACTAR.finditer(normal):
        if m.group("verbo").endswith(("an", "en")):             # «hacen», «completan»: describe, no pide
            continue
        if not _PROCEDIMIENTO.search(normal[: m.start()]):
            return True
    return False


def pedido_clinico(consulta: str) -> set[str]:
    """Qué juicio o acción pide la consulta: diagnostico, redactar, compartir, interpretar, decidir, tratar."""
    normal = normalizar(consulta)
    pedidos = {nombre for nombre, patron in (("diagnostico", DIAGNOSTICO_PEDIDO), ("compartir", COMPARTIR),
                                             ("interpretar", INTERPRETAR), ("decidir", DECIDIR), ("tratar", TRATAR))
               if patron.search(normal)}
    if _pide_redactar(normal):
        pedidos.add("redactar")
    return pedidos


def clasificar(consulta: str) -> tuple[str, str, str] | None:
    """(LIM, acción, mensaje) para LIM-1, 2, 3, 4, 8 y 10, o None si la consulta no es un pedido clínico."""
    pedidos = pedido_clinico(consulta)
    if "redactar" in pedidos:
        return "LIM-10", RECHAZAR, mensajes.A
    if "diagnostico" in pedidos:
        return "LIM-1", RECHAZAR, mensajes.A
    if not caso_particular(consulta):
        return None
    if "compartir" in pedidos:
        return "LIM-8", CITAR_Y_DERIVAR, mensajes.DERIVACION
    if "interpretar" in pedidos:
        return "LIM-3", RECHAZAR, mensajes.A
    if "decidir" in pedidos:
        return "LIM-4", RECHAZAR, mensajes.A
    if "tratar" in pedidos:
        return "LIM-2", RECHAZAR, mensajes.A
    return None


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
    texto = _enmascarar_secuencias(texto)
    return texto, texto != original


def _enmascarar_secuencias(texto: str) -> str:
    partes, desde = [], 0
    for m in _SECUENCIA_MAYUSCULAS.finditer(texto):
        palabras, inicio = m.group().split(), m.start()
        if _COMIENZO_DE_ORACION.search(texto[: m.start()]):          # la primera va con mayúscula por gramática
            inicio = m.start() + texto[m.start():].index(palabras[1], len(palabras[0]))
            palabras = palabras[1:]
        if (len(palabras) < 2 or "Documento Técnico" in m.group() or _NO_SON_NOMBRES & set(palabras)
                or all(p.isupper() for p in palabras)):
            continue
        partes.append(texto[desde:inicio] + "[NOMBRE]")
        desde = m.end()
    return "".join(partes) + texto[desde:]


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

    clinico = clasificar(texto)
    if clinico:
        lim, accion, mensaje = clinico
        disparados.append(lim)
        return Decision(lim, accion, mensaje, texto, True, tuple(disparados), tuple(avisos))

    if hubo_instrucciones and len(tokenizar(texto)) < 2:
        return Decision("LIM-9", RECHAZAR, mensajes.B, texto, True, tuple(disparados), tuple(avisos))

    lim = "LIM-6" if hubo_datos else ("LIM-9" if hubo_instrucciones else None)
    mensaje = mensajes.AVISO_DATOS if hubo_datos else None
    return Decision(lim, RECUPERAR, mensaje, texto, True, tuple(disparados), tuple(avisos))
