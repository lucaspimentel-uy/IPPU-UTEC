"""Mensajes fijos del asistente (plan §8).

Borrador; texto final lo valida IPPU; C bloqueado para producción (falta el contacto y el protocolo de crisis).
A, B y C son copia literal del plan §8 (tests/test_limites.py lo comprueba).
"""

# LIM-1 a 4 y LIM-10.
A = (
    "No puedo responder sobre diagnóstico, tratamiento, casos particulares, decisiones clínicas ni redactar "
    "registros clínicos. Consultalo con el profesional tratante o con el equipo de IPPU."
)

# LIM-5 (y LIM-9 cuando no queda una pregunta legítima).
B = "No está en los documentos autorizados."

# LIM-7.
C = (
    "Esto requiere atención de una persona ahora. Contacto: [CONTACTO Y PROTOCOLO DE CRISIS — A DEFINIR POR "
    "IPPU]. Ya avisé al equipo; podés seguir escribiendo acá."
)

# Los dos siguientes NO están en el plan: borradores de esta rebanada, a validar junto con A/B/C.
# LIM-8: el texto con el procedimiento citado se arma en la F1-d.
DERIVACION = (
    "Esto no lo decide el asistente. Te muestro el procedimiento de los documentos autorizados; la decisión es "
    "del equipo de IPPU."
)

# LIM-6: aviso cuando se quitaron datos personales de la consulta.
AVISO_DATOS = "No cargues nombres, cédulas ni otros datos del NNA: los quité de tu consulta antes de seguir."
