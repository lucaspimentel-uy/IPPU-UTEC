"""Límites del asistente (plan §8) por reglas deterministas, antes del modelo y fuera de él.

Orden fijo: LIM-7 (crisis) → LIM-9 (inyección / rol declarado) → LIM-6 (enmascarar datos)
→ LIM-10, LIM-1 y «caso particular + pedido» (LIM-8, 3, 4, 2) → compuerta de pregunta documental (F1-c6) →
recuperación. La compuerta es una lista de permitidos: sólo pasa una pregunta general sobre los documentos; lo
demás se rechaza con A o B (§5.145 a). LIM-5 (sin respaldo) se decide después de buscar, con el umbral
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
COMPUERTA = "compuerta"


def _r(*patrones: str) -> re.Pattern:
    return re.compile("|".join(f"(?:{p})" for p in patrones))


# --- LIM-7 · crisis -------------------------------------------------------------------------------
CRISIS = _r(
    r"\bautoles", r"\bsuicid", r"quitarse la vida", r"\bmatar(se|me|lo|la)\b", r"hacer(se|me)? dano",
    r"\blastimar(se|me)\b", r"\bse (esta )?(golpea|golpeando|corta|cortando|lastima|lastimando)\b",
    r"golpea\w* la cabeza", r"\bse quiere morir", r"\bviolencia\b", r"\babus(o|aron|aba)\b",
    r"\b(le|la|lo) (pega|pegan|pegaron|pegaba)\b", r"\bconvulsi", r"\bno respira", r"\bdesmay",
    r"\burgencia\b", r"\bemergencia\b", r"\bsangr(a|ando|e)\b", r"\bintoxic", r"\bse escap(o|a)\b",
    # F1-c6: raíces y variantes, sumadas a la lista de arriba, que no se toca (§5.145 c). Ante la duda, C: se
    # aceptan falsos positivos («punto de corte», «pérdida de habilidades», «de golpe»); los valida IPPU.
    r"\bmat(ar(se|me|te|lo|la|los|las)?|ando(se)?|o|a|an|aron|aba)\b", r"\bmori(r|rse|rme|ria|ra)?\b",
    r"\bmuer(o|e|en|a|as|an)\b", r"\bmuert", r"\bmuri(o|eron|endo)\b", r"\bahorc",
    r"\bcort(e|es|arse|arme|andose|ado|ada|ados|adas)\b", r"\b(se|me|te) (esta |estaba )?cort(o|a|aba|ando|e)\b",
    r"\bsangr", r"\bgolpe", r"\b(le|la|lo|les|los|las|me|nos|se|te) peg(a|an|o|aron|aba|aban|ue|uen|ando)\b",
    r"\bpeg(ar|a|an|o|ando)(le|les|lo|la|los|las|me|se|nos)\b", r"\babus", r"\bescap", r"\bperdi",
    r"\bse (nos |les? |me )?pierd", r"\bextravi", r"\bsin respirar\b", r"\bahog", r"\bconvuls", r"\bamenaz",
    r"\b(tir|arroj|lanz)(ar|arse|arme|o|a|aba|ando|andose)\s+(de|del|desde|por)\b",
    r"\b(hac|hag|hiz|hic)\w* dano\b", r"\bdan(arse|arme|arlo|arla|andose)\b", r"\blastim(o|aron|ado|ada|andose)\b",
)
# Excepciones técnicas (F1-c6c, §5.146 d): lista cerrada y sólo en una pregunta documental. Se quita sólo el tramo y
# se vuelve a buscar la crisis en el resto: si queda cualquier raíz, sale C. Las valida IPPU. CRISIS no cambia.
FRASES_TECNICAS = _r(r"\bpuntos? de corte\b", r"\bperdida de habilidades\b", r"\bcortes? de (luz|energia|servicio)\b")

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
# Toda palabra con mayúscula inicial fuera del comienzo de la oración es un nombre (F1-c6, §5.145; en la F1-c4 eran
# dos o más seguidas). Si la oración empieza con dos palabras con mayúscula, se enmascaran las dos, salvo que la
# primera sea una palabra gramatical («El Protocolo…», «¿Qué…»). No se enmascaran las siglas (todo en mayúscula) ni
# la lista corta de §5.134; ante la duda, se enmascara. Límites conocidos: un nombre en minúscula, un nombre solo al
# comienzo de la oración y un nombre escrito todo en mayúscula (se lee como sigla).
_PALABRA_MAYUSCULA = re.compile(r"(?<![\w\[])[A-ZÁÉÍÓÚÑ][\wáéíóúüñ]*")
_NO_SON_NOMBRES = frozenset("IDEA IPPU UTEC LIDIA HCE Protocolo Manual MIDES BPS ASSE INAU ANEP".split())  # Manual: §5.146 e
# Dos o más palabras seguidas todo en mayúscula son un nombre, salvo que todas sean siglas conocidas (F1-c6c, §5.146 e):
# las de §5.134 y las del dominio. Una sola palabra en mayúscula se sigue leyendo como sigla.
_PALABRA_TODO_MAYUSCULA = re.compile(r"(?<![\w\[])[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÜÑ\d]*(?!\w)")
_SIGLAS_CONOCIDAS = frozenset(
    "IDEA IPPU UTEC LIDIA HCE MIDES BPS ASSE INAU ANEP HC NNA DT IC VF PA PB LB PAI TEA CI CIE DSM NS MSP AYEX".split()
)
_DOCUMENTO_TECNICO = re.compile(r"Documento Técnico")
_COMIENZO_DE_ORACION = re.compile(r"(^|[.?!:;¿¡\n])[\s¿¡«\"(\-–•*]*$")
_GRAMATICALES = frozenset(
    "el la los las lo un una unos unas al del a ante bajo con contra de desde en entre hacia hasta para por segun sin "
    "sobre tras y e o u ni pero si que cual cuales quien quienes como cuando donde cuanto cuanta cuantos cuantas mi "
    "mis tu tus su sus este esta estos estas ese esa esos esas aquel aquella yo vos usted ustedes hay es son".split()
)
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


def clasificar(consulta: str, sin_enmascarar: str | None = None) -> tuple[str, str, str] | None:
    """(LIM, acción, mensaje) para LIM-1, 2, 3, 4, 8 y 10, o None si la consulta no es un pedido clínico.

    `sin_enmascarar` es la misma consulta antes de LIM-6: un término con mayúscula que LIM-6 tapa («Asperger») sigue
    contando como pedido. Sólo se lee para detectar; nunca se devuelve ni se guarda (§5.130 d).
    """
    pedidos = pedido_clinico(consulta) | (pedido_clinico(sin_enmascarar) if sin_enmascarar else set())
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


# --- Compuerta de pregunta documental (F1-c6, §5.145 a) ----------------------------------------------------
# Lista de permitidos, después de clasificar() y sobre la consulta ya limpia (LIM-9) y enmascarada (LIM-6). Pasa
# sólo si se cumplen todas: (1) es sólo preguntas —con un saludo o un «si…,» hipotético delante, como mucho— y cada
# una empieza con un interrogativo o es de sí o no sobre un sujeto institucional o impersonal; (2) no hay caso
# particular; (3) no hay 1.ª ni 2.ª persona ni clíticos de caso («le doy», «se lo paso»); (4) no hay órdenes.
# Lo que no pasa se rechaza (fail-closed): A si hay alguna señal de caso o de pedido, B si no.
_PREPOSICION = r"(?:a partir de|a|ante|bajo|con|contra|de|desde|en|entre|hacia|hasta|para|por|segun|sin|sobre|tras|cada)"
_INTERROGATIVO = re.compile(
    rf"(?:{_PREPOSICION} )?(?:que|cual|cuales|quien|quienes|como|cuando|donde|adonde|cuanto|cuanta|cuantos|cuantas"
    r"|porque)\b"
)
_INTERROGATIVO_CON_TILDE = re.compile(r"(?:qué|cuál|cuáles|quién|quiénes|cómo|cuándo|dónde|adónde|cuánt[oa]s?)\b")
_INSTITUCIONAL = (
    r"sistema|hce|hc|historias? clinicas?|protocolos?|manual|documentos?|dt|idea|escalas?|dimension(?:es)?|items?"
    r"|tecnic[oa]s?|profesional(?:es)?|equipos?|direccion|coordinacion|ippu|institucion(?:es)?|informes?|fichas?"
    r"|modulos?|plazos?|pai|ic|vf|pa|pb|lb|servicios?|grupos?|talleres?|consentimientos?|registros?|firmas?"
    r"|valoracion(?:es)?|evaluacion(?:es)?|total(?:es)?|puntajes?|nivel(?:es)?|familias?|titular(?:es)?"
)
_SUJETO_INSTITUCIONAL = rf"(?:{_INSTITUCIONAL}|nna)"
_SI_NO = re.compile(
    rf"(?:(?:el|la|los|las|un|una|unos|unas) )?{_SUJETO_INSTITUCIONAL}\b"   # «¿el protocolo…?», «¿los técnicos…?»
    rf"|(?:puede|pueden|debe|deben|tiene que|tienen que) (?:(?:el|la|los|las|un|una) )?{_SUJETO_INSTITUCIONAL}\b"
)
# Formas impersonales (F1-c6c, §5.146 c): pasan sólo si la pregunta nombra algo institucional o documental. Una consulta
# que junta un NNA (concreto o genérico) con un término clínico no pasa con ninguna forma de pregunta y la compuerta da A
# (F1-c6d, §5.147 a, que amplía §5.146 c).
_IMPERSONAL = re.compile(
    r"se (?!(?:lo|la|le|los|las|les|me|te|nos)\b)\w+"                        # «¿se puede…?», «¿se firma…?»
    r"|(?:hay|existen?|alcanza con|basta con|hace falta)\b"
    r"|(?:es|son) (?:obligatori|necesari|posible|requisito)\w*"
)
_TERMINO_DOCUMENTAL = re.compile(rf"\b(?:{_INSTITUCIONAL})\b")
_NNA_GENERICO = re.compile(
    r"\b(?:un|una|unos|unas) (?:nene|nena|nino|nina|chico|chica|usuario|usuaria|paciente|guri|gurisa|chiquilin"
    r"|chiquilina|alumno|alumna|adolescente|menor|bebe|hijo|hija|nna)s?\b"
)
_TERMINO_CLINICO = re.compile(
    r"\b(?:dosis|medicac|medicament|remedio|pastilla|farmac|psicofarmac|terapi|tratamient|tratar|deriv|diagnostic"
    r"|interconsult|psiquiatr|neurolog|psicolog|conduct|agresiv|sintoma|trastorno|intern|sedac|sedant|contencion)\w*"
)
_CONECTOR = re.compile(r"(?:y|e|o|pero|entonces|ademas|tambien)\b[\s,]*")
_CORTESIA = re.compile(
    r"(?:(?:hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches)\b[\s,.!:]*"
    r"|(?:tengo|tenemos) una (?:duda|consulta|pregunta)\b[\s,.!:]*"
    r"|(?:una )?(?:consulta|pregunta|duda)\s*[,.:]+\s*)+"
)
_CORTESIA_FINAL = re.compile(r"[\s,.!]*(?:(?:muchas |desde ya )?gracias|saludos)[\s.!]*$")
_PREAMBULO = re.compile(r"(?:si|cuando|en (?:el )?caso de(?: que)?|segun|para|despues de|antes de|durante)\b"
                        r"[^¿?.!;:,]*[,:]\s*")
_OTRA_ORACION = re.compile(r"[.!;]\s+\S")
# «lo» al comenzar la pregunta, o un pronombre tras el interrogativo, es un clítico: «¿lo derivamos?», «¿qué lo calma?»
_CLITICO_INICIAL = re.compile(
    rf"(?:(?:{_PREPOSICION} )?(?:que|cual|cuales|quien|quienes|como|cuando|donde) (?:lo|la|los|las)"
    r"|lo) (?!(?:que|mismo|mas|menos|demas|cual)\b)\w"
)
_CLITICO_INICIAL_EN_EL_TEXTO = re.compile(r"(?:^|¿)\s*" + _CLITICO_INICIAL.pattern)

# 1.ª y 2.ª persona, en texto normalizado; los clíticos le/les siempre, y lo/la/los/las tras «se», «no» o «ya».
PERSONA = _r(
    r"\b(me|mi|mis|te|tu|tus|vos|yo|conmigo|contigo|nos|nosotr[oa]s|nuestr[oa]s?|usted|ustedes)\b",
    r"\b(le|les)\s+\w", r"\b(se|no|ya)\s+(lo|la|los|las)\s+\w",
    r"\b(hago|digo|pongo|tengo|puedo|debo|quiero|necesito|envio|mando|doy|voy|estoy|soy|hice|pido|sigo|elijo|pregunto"
    r"|consulto|firmo|derivo|aplico|evaluo|atiendo|escribo|creo|pienso|opino|considero|veo|entiendo|hablo|informo"
    r"|comparto|muestro|entrego|interpreto|saco|dejo|subo|anoto|recomiendo|sugiero|propongo|decido|indico|receto|busco"
    r"|leo|lleno|armo|redacto|hare|podre|dire|sabre|tendre|debere)\b",
    r"\b(podes|puedes|tenes|tienes|queres|quieres|sabes|haces|decis|dices|ves|crees|pensas|piensas|opinas|recomendas"
    r"|recomiendas|sugeris|sugieres|harias|dirias|darias|podrias|deberias|sabrias|tendrias|explicas|contas|cuentas"
    r"|ayudas|necesitas|mandas|envias|pasas|escribis|escribes|redactas|completas|buscas|lees|entendes|entiendes"
    r"|conoces|sos|eres|seras)\b",
)
_PRIMERA_PLURAL = re.compile(r"\b\w{2,}(?:amos|emos|imos)\b")            # «damos», «hacemos», «pedimos»
_NO_SON_VERBOS_MOS = frozenset(
    "minimos maximos proximos ultimos intimos optimos legitimos prestamos animos primos extremos supremos ramos tramos "
    "reclamos racimos remos".split()
)
_NO_SON_VERBOS_MOS_FIN = ("onimos", "animos", "gramos", "isimos", "esimos")
# Voseo con tilde («podés», «tenés», «decís»), sobre el texto original.
_VOSEO = re.compile(r"\b\w+(?:ás|és|ís)\b", re.IGNORECASE)
_NO_SON_VOSEO = frozenset(
    "más además demás atrás detrás jamás quizás después través revés interés inglés francés cortés japonés portugués "
    "marqués estrés compás país anís".split()
)

# Órdenes: imperativo con enclítico («pasame», «decile»), con tilde final («redactá», «hacé», «decí»; también agarra
# el pretérito en 1.ª persona: «mandé») y una lista corta. Las agudas en «-rá» se saltean: son futuro («será»).
_ENCLITICO = re.compile(r"\b\w{2,}[aei](?:me|melo|mela|melos|melas)\b")
_NO_SON_ORDENES_ME = frozenset(
    "imprime exime suprime oprime comprime reprime redime dirime teme gime llame reclame derrame proclame".split()
)
ORDENES = _r(
    r"\b(dame|deme|dime|hazme|haz|decile|dale|mandale|pasale|explicale|contale|preguntale|hacele|ponele|decilo|hacelo"
    r"|mandalo|pasalo|redactalo|escribilo|completalo|armalo|mandala|pasala|hacela|redactala|completala|escribila"
    r"|armala|fijate|acordate|ponete|anotate|decinos|pasanos|mandanos|explicanos|contanos|mostranos|ayudanos|dinos)\b",
)
_AGUDA = re.compile(r"\b\w+[áéí]\b", re.IGNORECASE)
_NO_SON_ORDENES_AGUDAS = frozenset(
    "qué porqué bebé café puré comité carné té está esté prevé acá allá mamá papá sofá ojalá quizá aquí ahí allí así "
    "sí mí tí ají maní colibrí rubí esquí jabalí bisturí guaraní".split()
)


def _primera_o_segunda_persona(consulta: str) -> bool:
    normal = normalizar(consulta)
    if PERSONA.search(normal):
        return True
    if any(p not in _NO_SON_VERBOS_MOS and not p.endswith(_NO_SON_VERBOS_MOS_FIN)
           for p in _PRIMERA_PLURAL.findall(normal)):
        return True
    return any(m.group().lower() not in _NO_SON_VOSEO for m in _VOSEO.finditer(consulta))


def _es_orden(consulta: str) -> bool:
    normal = normalizar(consulta)
    if ORDENES.search(normal) or any(m.group() not in _NO_SON_ORDENES_ME for m in _ENCLITICO.finditer(normal)):
        return True
    return any(p not in _NO_SON_ORDENES_AGUDAS and not p.endswith("rá")
               for p in (m.group().lower() for m in _AGUDA.finditer(consulta)))


def _sin_cortesia(consulta: str) -> str:
    """La consulta sin el saludo o «tengo una consulta» del principio ni el «gracias» del final."""
    texto = consulta.strip()
    normal = normalizar(texto)                                      # mismo largo: los índices sirven en los dos
    inicio = m.end() if (m := _CORTESIA.match(normal)) else 0
    fin = m.start() if (m := _CORTESIA_FINAL.search(normal, inicio)) else len(normal)
    return texto[inicio:fin]


def _preguntas(consulta: str) -> list[str] | None:
    """Las preguntas de la consulta (normalizadas), o None si hay algo que no es pregunta."""
    original = consulta.strip()
    normal = normalizar(original)
    inicio = 0
    if not normal.startswith("¿") and (m := _PREAMBULO.match(normal)):
        inicio = m.end()
    preguntas = []
    for m in re.finditer(r"¿?[^¿?]+\?*", normal[inicio:]):
        tramo = m.group().strip()
        cuerpo = tramo.strip("¿? ")
        if not cuerpo:
            continue
        marcada = tramo.startswith("¿") or tramo.endswith("?")
        sin_marcas = original[inicio + m.start():inicio + m.end()].strip().strip("¿? ").lower()
        if _OTRA_ORACION.search(cuerpo) or not (marcada or _INTERROGATIVO_CON_TILDE.match(sin_marcas)):
            return None
        preguntas.append(cuerpo)
    return preguntas or None


def _nna_y_termino_clinico(consulta: str) -> bool:
    """La consulta junta un NNA, concreto (caso particular) o genérico («un nene»), con un término clínico."""
    normal = normalizar(consulta)
    return bool((_NNA_GENERICO.search(normal) or caso_particular(consulta)) and _TERMINO_CLINICO.search(normal))


def es_pregunta_documental(consulta: str) -> bool:
    """True sólo para una pregunta general sobre los documentos (lista de permitidos; ante la duda, False)."""
    consulta = _sin_cortesia(consulta)
    preguntas = _preguntas(consulta)
    if not preguntas or _nna_y_termino_clinico(consulta):         # NNA + término clínico: con cualquier forma (§5.147 a)
        return False
    for pregunta in preguntas:
        if m := _CONECTOR.match(pregunta):
            pregunta = pregunta[m.end():]
        if _CLITICO_INICIAL.match(pregunta):
            return False
        if _INTERROGATIVO.match(pregunta) or _SI_NO.match(pregunta):
            continue
        if not (_IMPERSONAL.match(pregunta) and _TERMINO_DOCUMENTAL.search(pregunta)):
            return False
    return not (caso_particular(consulta) or _primera_o_segunda_persona(consulta) or _es_orden(consulta))


def _senal_de_caso_o_pedido(consulta: str) -> bool:
    """Elige el mensaje de la compuerta: A si hay caso, pedido clínico, persona, orden, clítico de caso o un NNA con
    un término clínico; si no, B."""
    consulta = _sin_cortesia(consulta)
    return bool(caso_particular(consulta) or pedido_clinico(consulta) or _primera_o_segunda_persona(consulta)
                or _es_orden(consulta) or _CLITICO_INICIAL_EN_EL_TEXTO.search(normalizar(consulta))
                or _nna_y_termino_clinico(consulta))


def es_crisis(consulta: str) -> bool:
    """LIM-7 sobre la consulta original. Una frase técnica de la lista cerrada sólo deja de contar si la consulta es
    documental y, sin ese tramo, no queda ninguna raíz de crisis (§5.146 d)."""
    normal = normalizar(consulta)
    if not CRISIS.search(normal):
        return False
    resto = FRASES_TECNICAS.sub(" ", normal)
    if resto == normal or CRISIS.search(resto):
        return True
    return not es_pregunta_documental(enmascarar(limpiar_instrucciones(consulta)[0])[0])


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
    texto = _enmascarar_mayusculas_sostenidas(texto)
    texto = _enmascarar_mayusculas(texto)
    return texto, texto != original


def _enmascarar_mayusculas_sostenidas(texto: str) -> str:
    grupos: list[list[re.Match]] = []
    for m in _PALABRA_TODO_MAYUSCULA.finditer(texto):              # palabras separadas sólo por espacios → un grupo
        if grupos and not texto[grupos[-1][-1].end():m.start()].strip(" \t"):
            grupos[-1].append(m)
        else:
            grupos.append([m])
    partes, desde = [], 0
    for grupo in grupos:
        if len(grupo) < 2 or all(m.group() in _SIGLAS_CONOCIDAS for m in grupo):
            continue
        partes.append(texto[desde:grupo[0].start()] + "[NOMBRE]")
        desde = grupo[-1].end()
    return "".join(partes) + texto[desde:]


def _es_nombre(palabra: str) -> bool:
    return not (palabra in _NO_SON_NOMBRES or palabra.isupper())


def _enmascarar_mayusculas(texto: str) -> str:
    protegidas = [m.span() for m in _DOCUMENTO_TECNICO.finditer(texto)]
    palabras = [m for m in _PALABRA_MAYUSCULA.finditer(texto) if not any(a <= m.start() < b for a, b in protegidas)]
    tramos = []
    for i, m in enumerate(palabras):
        if not _es_nombre(m.group()):
            continue
        if _COMIENZO_DE_ORACION.search(texto[: m.start()]):          # la primera va con mayúscula por gramática…
            siguiente = palabras[i + 1] if i + 1 < len(palabras) else None
            pegada = (siguiente is not None and not texto[m.end():siguiente.start()].strip(" \t")
                      and _es_nombre(siguiente.group()))
            if not pegada or normalizar(m.group()) in _GRAMATICALES:  # …salvo que la siga otra con mayúscula
                continue
        tramos.append(m.span())
    partes, desde, i = [], 0, 0
    while i < len(tramos):                                          # palabras seguidas → un solo [NOMBRE]
        inicio, fin = tramos[i]
        while i + 1 < len(tramos) and not texto[fin:tramos[i + 1][0]].strip(" \t"):
            i += 1
            fin = tramos[i][1]
        partes.append(texto[desde:inicio] + "[NOMBRE]")
        desde, i = fin, i + 1
    return "".join(partes) + texto[desde:]


def evaluar(consulta: str) -> Decision:
    """Decide qué hace el asistente con una consulta antes de buscar. Nunca devuelve la consulta original."""
    disparados: list[str] = []
    avisos: list[str] = []

    if es_crisis(consulta):
        texto, _ = enmascarar(limpiar_instrucciones(consulta)[0])
        return Decision("LIM-7", ESCALAR_HUMANO, mensajes.C, texto, True, ("LIM-7",))

    texto, hubo_instrucciones = limpiar_instrucciones(consulta)
    if hubo_instrucciones:
        disparados.append("LIM-9")
        avisos.append("Se ignoraron instrucciones o roles declarados: no habilitan nada.")

    limpio = texto
    texto, hubo_datos = enmascarar(limpio)
    if hubo_datos:
        disparados.append("LIM-6")
        avisos.append(mensajes.AVISO_DATOS)

    clinico = clasificar(texto, limpio)
    if clinico:
        lim, accion, mensaje = clinico
        disparados.append(lim)
        return Decision(lim, accion, mensaje, texto, True, tuple(disparados), tuple(avisos))

    if hubo_instrucciones and len(tokenizar(texto)) < 2:
        return Decision("LIM-9", RECHAZAR, mensajes.B, texto, True, tuple(disparados), tuple(avisos))

    if not es_pregunta_documental(texto):
        disparados.append(COMPUERTA)
        mensaje = mensajes.A if _senal_de_caso_o_pedido(texto) else mensajes.B
        return Decision(COMPUERTA, RECHAZAR, mensaje, texto, True, tuple(disparados), tuple(avisos))

    lim = "LIM-6" if hubo_datos else ("LIM-9" if hubo_instrucciones else None)
    mensaje = mensajes.AVISO_DATOS if hubo_datos else None
    return Decision(lim, RECUPERAR, mensaje, texto, True, tuple(disparados), tuple(avisos))
