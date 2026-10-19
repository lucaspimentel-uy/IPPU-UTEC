"""Los patrones de crisis (LIM-7) quedan fijados: si alguien cambia CRISIS en asistente/limites.py, este test falla.

Para cambiar la crisis a propósito hay que actualizar también esta copia literal, y eso queda a la vista en el diff.
Cambios hechos a propósito: F1-c6 (§5.145 c) suma raíces y variantes; la lista de la F1-c1 sigue intacta y primera.
"""
from asistente.limites import CRISIS

PATRONES_F1C1 = (
    r"\bautoles", r"\bsuicid", r"quitarse la vida", r"\bmatar(se|me|lo|la)\b", r"hacer(se|me)? dano",
    r"\blastimar(se|me)\b", r"\bse (esta )?(golpea|golpeando|corta|cortando|lastima|lastimando)\b",
    r"golpea\w* la cabeza", r"\bse quiere morir", r"\bviolencia\b", r"\babus(o|aron|aba)\b",
    r"\b(le|la|lo) (pega|pegan|pegaron|pegaba)\b", r"\bconvulsi", r"\bno respira", r"\bdesmay",
    r"\burgencia\b", r"\bemergencia\b", r"\bsangr(a|ando|e)\b", r"\bintoxic", r"\bse escap(o|a)\b",
)

PATRONES_F1C6 = (
    r"\bmat(ar(se|me|te|lo|la|los|las)?|ando(se)?|o|a|an|aron|aba)\b", r"\bmori(r|rse|rme|ria|ra)?\b",
    r"\bmuer(o|e|en|a|as|an)\b", r"\bmuert", r"\bmuri(o|eron|endo)\b", r"\bahorc",
    r"\bcort(e|es|arse|arme|andose|ado|ada|ados|adas)\b", r"\b(se|me|te) (esta |estaba )?cort(o|a|aba|ando|e)\b",
    r"\bsangr", r"\bgolpe", r"\b(le|la|lo|les|los|las|me|nos|se|te) peg(a|an|o|aron|aba|aban|ue|uen|ando)\b",
    r"\bpeg(ar|a|an|o|ando)(le|les|lo|la|los|las|me|se|nos)\b", r"\babus", r"\bescap", r"\bperdi",
    r"\bse (nos |les? |me )?pierd", r"\bextravi", r"\bsin respirar\b", r"\bahog", r"\bconvuls", r"\bamenaz",
    r"\b(tir|arroj|lanz)(ar|arse|arme|o|a|aba|ando|andose)\s+(de|del|desde|por)\b",
    r"\b(hac|hag|hiz|hic)\w* dano\b", r"\bdan(arse|arme|arlo|arla|andose)\b", r"\blastim(o|aron|ado|ada|andose)\b",
)


def test_los_patrones_de_crisis_no_cambiaron():
    assert CRISIS.pattern == "|".join(f"(?:{p})" for p in PATRONES_F1C1 + PATRONES_F1C6)


# F1-c6c (§5.146 d): la lista cerrada de frases técnicas también queda fijada. CRISIS no cambia.
FRASES_TECNICAS_FIJADAS = (r"\bpuntos? de corte\b", r"\bperdida de habilidades\b", r"\bcortes? de (luz|energia|servicio)\b")


def test_la_lista_de_frases_tecnicas_no_cambio():
    from asistente.limites import FRASES_TECNICAS
    assert FRASES_TECNICAS.pattern == "|".join(f"(?:{p})" for p in FRASES_TECNICAS_FIJADAS)
