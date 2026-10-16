"""Los patrones de crisis (LIM-7) quedan fijados: si alguien cambia CRISIS en asistente/limites.py, este test falla.

Para cambiar la crisis a propósito hay que actualizar también esta copia literal, y eso queda a la vista en el diff.
"""
from asistente.limites import CRISIS

PATRONES_FIJADOS = (
    r"\bautoles", r"\bsuicid", r"quitarse la vida", r"\bmatar(se|me|lo|la)\b", r"hacer(se|me)? dano",
    r"\blastimar(se|me)\b", r"\bse (esta )?(golpea|golpeando|corta|cortando|lastima|lastimando)\b",
    r"golpea\w* la cabeza", r"\bse quiere morir", r"\bviolencia\b", r"\babus(o|aron|aba)\b",
    r"\b(le|la|lo) (pega|pegan|pegaron|pegaba)\b", r"\bconvulsi", r"\bno respira", r"\bdesmay",
    r"\burgencia\b", r"\bemergencia\b", r"\bsangr(a|ando|e)\b", r"\bintoxic", r"\bse escap(o|a)\b",
)


def test_los_patrones_de_crisis_no_cambiaron():
    assert CRISIS.pattern == "|".join(f"(?:{p})" for p in PATRONES_FIJADOS)
