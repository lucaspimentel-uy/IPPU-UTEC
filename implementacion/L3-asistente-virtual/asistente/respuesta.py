"""Armado de respuestas que no dependen del modelo de lenguaje."""


def formatear_contradiccion(frag_a, frag_b) -> str:
    """LIM-11: dos fragmentos autorizados que no coinciden. Muestra los dos con documento y sección y no elige.

    Acepta cualquier objeto con `documento`, `seccion` y `texto` (Fragmento o Resultado del índice).
    """
    return "\n".join(
        [
            "Los documentos autorizados no coinciden sobre esto. Te muestro los dos; no elijo entre ellos:",
            f"- {frag_a.documento}, «{frag_a.seccion}»: {frag_a.texto}",
            f"- {frag_b.documento}, «{frag_b.seccion}»: {frag_b.texto}",
            "Para resolverlo, consultalo con el equipo de IPPU.",
        ]
    )
