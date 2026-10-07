"""IDEA (HCE-LB): alta, edición, totales, banda, firma, addendas y «qué IDEA rige». M11.3-b.

El IDEA es **anual** (§5.36): una instancia por `(hce_id, anio)`. Sus 12 dimensiones van
en `idea.dim`, un dict `{"D1": {"valor": 0..8 | "NS" | None, "obs": str | None}, ...}`;
una dimensión que nunca se tocó **no tiene entrada**.

## Reglas que fija este módulo

- **Totales** (§5.105, Documento Técnico §5.1): `total` (0–96) y `esc_a..esc_d` (0–24) son
  la suma de las dimensiones **numéricas**; `NS` y las vacías **quedan afuera**. Las
  escalas son tríos consecutivos (`core/constantes.py::IDEA_ESCALAS`). Se **recalculan en
  cada guardado mientras el IDEA no está firmado** y **quedan congelados al firmar**. Si
  ninguna dimensión de la escala (o del IDEA) tiene número, el total es `NULL`, no 0: un
  0 se leería como «sin trastorno».
- **La banda se deriva al leer** desde `banda_idea` (`banda_de`): nunca se guarda ni se
  hardcodea un corte, así que mover un corte cambia la banda que se devuelve, también
  para un IDEA ya firmado (D4).
- **Una sola firma** (§5.98: un único puntaje de consenso, acordado en persona): firmar
  exige `evaluador_t1_id` y `evaluador_t2_id` cargados, distintos y activos, y `firmas`
  guarda a los dos. `usuario_id` de la auditoría queda `NULL` hasta que exista el login.
- **Integridad para firmar** (Documento Técnico §4.3, fila HCE-LB): 12 dimensiones
  puntuadas —sin `NS` ni vacías—, fecha de consenso, síntesis clínica y objetivos del
  período. Los «recomendados» de esa fila (≥ 5 sesiones previas, extensión de la síntesis)
  **no se implementan**: el documento dice «advierten y piden constancia», pero no define el
  mecanismo ni fue decidido en §5.116 (queda anotado en el informe de la sesión).
- **Qué IDEA rige** (§5.97): un documento muestra el de su año (`idea_de_anio`); la vista de
  la HCE, el **firmado de mayor `anio`**; uno sin firmar del año en curso va aparte como
  «en curso» (`idea_vigente`).
- **Auditoría:** crear escribe una fila `carga`; cada **campo** que cambia en un PATCH, una
  fila `edicion`; de `dim`, **una por dimensión cambiada**, con `campo='dim.Dn'`.
"""
from collections.abc import Mapping
from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constantes import (
    ESTADO_EN_CURSO, ESTADO_FIRMADO, IDEA_DIMENSIONES, IDEA_ESCALAS, IDEA_MANUAL_VERSION,
    IDEA_NS, IDEA_VALOR_MAX, IDEA_VALOR_MIN, MODULO_HCE_LB,
)
from app.models.catalogos import BandaIdea
from app.models.identidad import Profesional
from app.models.modulos import Idea
from app.services import fechas, firma, flujo
from app.services.auditoria import registrar_cambios, registrar_carga
from app.services.errores import ConflictError, NotFound, ValidationFailed
from app.services.hce import obtener_hce
from app.services.texto import normalizar_opcionales, normalizar_texto

CAMPOS_TEXTO = ("sintesis", "objetivos")
CAMPOS_ESCALARES = ("fecha_consenso", "sesiones", *CAMPOS_TEXTO, "evaluador_t1_id", "evaluador_t2_id")
_UQ_IDEA = "uq_idea_hce_anio"
_ENTRADA_VACIA = {"valor": None, "obs": None}


# ── Totales y banda ──────────────────────────────────────────────────────────
def _numerico(valor: Any) -> bool:
    return isinstance(valor, int) and not isinstance(valor, bool)


def _valor_de(dim: Mapping | None, codigo: str) -> Any:
    entrada = (dim or {}).get(codigo)
    return entrada.get("valor") if isinstance(entrada, Mapping) else None


def calcular_totales(dim: Mapping | None) -> dict[str, int | None]:
    """`total`, `esc_a..esc_d` y `puntuadas` (cuántas dimensiones tienen número).

    Suma sólo las dimensiones **numéricas**: `NS` y las vacías no cuentan. Una escala sin
    ninguna dimensión numérica, o un IDEA sin ninguna, da `None` (no 0).
    """
    resultado: dict[str, int | None] = {}
    puntuadas = 0
    total = 0
    for letra, codigos in IDEA_ESCALAS.items():
        numeros = [v for c in codigos if _numerico(v := _valor_de(dim, c))]
        resultado[f"esc_{letra.lower()}"] = sum(numeros) if numeros else None
        puntuadas += len(numeros)
        total += sum(numeros)
    resultado["total"] = total if puntuadas else None
    resultado["puntuadas"] = puntuadas
    return resultado


def banda_de(db: Session, total: int | None) -> dict[str, Any] | None:
    """La banda del `total` según el catálogo `banda_idea` (D4); `None` si no hay total o ningún tramo lo cubre.

    **Nunca hay un corte en el código**: IPPU puede mover un corte por `UPDATE` y la
    banda devuelta cambia. Si dos tramos se superponen gana el de menor `orden`.
    """
    if total is None:
        return None
    banda = db.scalars(
        select(BandaIdea)
        .where(BandaIdea.total_min <= total, total <= BandaIdea.total_max)
        .order_by(BandaIdea.orden, BandaIdea.id)
    ).first()
    if banda is None:
        return None
    return {
        "perfil": banda.perfil, "total_min": banda.total_min, "total_max": banda.total_max,
        "nivel_dsm": banda.nivel_dsm, "texto": banda.texto,
    }


# ── Lectura ──────────────────────────────────────────────────────────────────
def obtener_idea(db: Session, idea_id: int) -> Idea:
    idea = db.get(Idea, idea_id)
    if idea is None:
        raise NotFound(f"No existe el IDEA {idea_id}")
    return idea


def listar_ideas(db: Session, hce_id: int) -> list[Idea]:
    """Los IDEA del expediente, el de mayor año primero. 404 si no existe el expediente."""
    obtener_hce(db, hce_id)
    return list(db.scalars(select(Idea).where(Idea.hce_id == hce_id).order_by(Idea.anio.desc())))


def idea_de_anio(db: Session, hce_id: int, anio: int) -> Idea | None:
    """El IDEA **de ese año**, firmado o no, o `None` (§5.97: un documento o informe muestra
    el IDEA de su propio año). Quien lo usa para un documento (el IC, M11.3-c) mira `.firmado`."""
    return db.scalars(select(Idea).where(Idea.hce_id == hce_id, Idea.anio == anio)).first()


def idea_vigente(db: Session, hce_id: int) -> dict[str, Idea | None]:
    """`{vigente, en_curso}` (§5.97): el **firmado de mayor `anio`** y, aparte, el **sin firmar
    del año en curso**. Este último no desplaza al primero. 404 si no existe el expediente."""
    obtener_hce(db, hce_id)
    vigente = db.scalars(
        select(Idea).where(Idea.hce_id == hce_id, Idea.firmado.is_(True)).order_by(Idea.anio.desc())
    ).first()
    en_curso = db.scalars(
        select(Idea).where(
            Idea.hce_id == hce_id, Idea.anio == fechas.anio_actual(), Idea.firmado.is_not(True)
        )
    ).first()
    return {"vigente": vigente, "en_curso": en_curso}


def vista(db: Session, idea: Idea) -> dict[str, Any]:
    """El IDEA como lo devuelve la API: las 12 dimensiones completas (las no cargadas, en
    blanco), totales guardados, `banda` **derivada ahora** del catálogo y `estado`."""
    dim = {
        c: {"valor": _valor_de(idea.dim, c), "obs": (idea.dim or {}).get(c, {}).get("obs")}
        for c in IDEA_DIMENSIONES
    }
    return {
        "id": idea.id, "hce_id": idea.hce_id, "anio": idea.anio, "dim": dim,
        "fecha_consenso": idea.fecha_consenso, "sesiones": idea.sesiones,
        "sintesis": idea.sintesis, "objetivos": idea.objetivos,
        "evaluador_t1_id": idea.evaluador_t1_id, "evaluador_t2_id": idea.evaluador_t2_id,
        "total": idea.total, "esc_a": idea.esc_a, "esc_b": idea.esc_b,
        "esc_c": idea.esc_c, "esc_d": idea.esc_d,
        "puntuadas": calcular_totales(idea.dim)["puntuadas"],
        "banda": banda_de(db, idea.total),
        "estado": ESTADO_FIRMADO if idea.firmado else ESTADO_EN_CURSO,
        "firmado": bool(idea.firmado),
        "firmas": idea.firmas or [], "addendas": idea.addendas or [],
        "manual_version": idea.manual_version,
    }


# ── Validación de entrada ────────────────────────────────────────────────────
def _preparar_escalares(
    db: Session, datos: Mapping[str, Any], errores: list[tuple[str | None, str]],
) -> dict[str, Any]:
    d = normalizar_opcionales({c: datos[c] for c in CAMPOS_ESCALARES if c in datos}, CAMPOS_TEXTO)
    sesiones = d.get("sesiones")
    if sesiones is not None and (not _numerico(sesiones) or sesiones < 0):
        errores.append(("sesiones", "Debe ser un número entero mayor o igual a 0"))
    for campo in ("evaluador_t1_id", "evaluador_t2_id"):
        profesional_id = d.get(campo)
        if profesional_id is not None and db.get(Profesional, profesional_id) is None:
            errores.append((campo, f"No existe el profesional {profesional_id}"))
    return d


def _fusionar_dim(
    actual: Mapping | None, cambios: Mapping[str, Any] | None, errores: list[tuple[str | None, str]],
) -> tuple[dict[str, dict], dict[str, Any], dict[str, Any]]:
    """Aplica `cambios` (`{"D5": {"valor"?, "obs"?}}`) sobre `actual` **dimensión por dimensión**.

    De cada entrada que vino sólo se pisan las claves presentes (`{"valor": 4}` no borra
    la `obs`). Devuelve `(dim resultante, antes, despues)`, estos dos últimos indexados por
    `campo` de auditoría (`dim.D5`) y **sólo con las dimensiones que cambiaron de verdad**.
    """
    resultante: dict[str, dict] = {k: dict(v) for k, v in (actual or {}).items()}
    antes: dict[str, Any] = {}
    despues: dict[str, Any] = {}
    for codigo, entrada in (cambios or {}).items():
        if codigo not in IDEA_DIMENSIONES:
            errores.append((f"dim.{codigo}", f"No es una dimensión del IDEA (D1 a D{len(IDEA_DIMENSIONES)})"))
            continue
        previa = resultante.get(codigo)
        nueva = {**_ENTRADA_VACIA, **(previa or {}), **{k: v for k, v in (entrada or {}).items() if k in _ENTRADA_VACIA}}
        nueva["obs"] = normalizar_texto(nueva["obs"])
        valor = nueva["valor"]
        if valor is not None and valor != IDEA_NS and not (
            _numerico(valor) and IDEA_VALOR_MIN <= valor <= IDEA_VALOR_MAX
        ):
            errores.append((
                f"dim.{codigo}.valor",
                f"Debe ser un número entero de {IDEA_VALOR_MIN} a {IDEA_VALOR_MAX} o «{IDEA_NS}»",
            ))
            continue
        if previa is None and nueva == _ENTRADA_VACIA:
            continue  # una dimensión nunca cargada que sigue en blanco no crea entrada
        if previa != nueva:
            antes[f"dim.{codigo}"] = previa
            despues[f"dim.{codigo}"] = nueva
            resultante[codigo] = nueva
    return resultante, antes, despues


def _exigir_evaluadores_distintos(
    t1: int | None, t2: int | None, errores: list[tuple[str | None, str]],
) -> None:
    # Lo rechaza también el CHECK `evaluadores_distintos`, pero como 500: se adelanta como 422.
    if t1 is not None and t1 == t2:
        errores.append(("evaluador_t2_id", "Tiene que ser distinto del evaluador 1"))


def _flush_traduciendo(db: Session) -> None:
    """`flush()` que convierte la violación de `uq_idea_hce_anio` (carrera entre dos altas) en 409."""
    try:
        db.flush()
    except IntegrityError as exc:
        diag = getattr(exc.orig, "diag", None)
        if getattr(diag, "constraint_name", None) == _UQ_IDEA:
            raise ConflictError(
                "Ya existe un IDEA de ese año para el expediente",
                [("anio", "Ya existe un IDEA de ese año para el expediente")],
            ) from exc
        raise


# ── Escritura ────────────────────────────────────────────────────────────────
def crear_idea(
    db: Session, hce_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> tuple[Idea, list[dict[str, Any]]]:
    """Alta del IDEA de un año. Devuelve `(idea, avisos)`.

    404 si no existe el expediente · 422 si falta el año o algún dato es inválido ·
    409 si ya hay un IDEA de ese año. **Nunca devuelve avisos de secuencia hoy**: LB es el
    primer eslabón (el aviso lo calcula `flujo.avisos_de_secuencia`, igual que para PA/PB/IC).
    Escribe **una** fila `carga`; no audita campo por campo los valores iniciales.
    """
    obtener_hce(db, hce_id)
    errores: list[tuple[str | None, str]] = []
    anio = datos.get("anio")
    if not _numerico(anio) or not 1 <= anio <= 32767:
        errores.append(("anio", "Es obligatorio: un año entre 1 y 32767"))
    escalares = _preparar_escalares(db, datos, errores)
    dim, _, _ = _fusionar_dim(None, datos.get("dim"), errores)
    _exigir_evaluadores_distintos(escalares.get("evaluador_t1_id"), escalares.get("evaluador_t2_id"), errores)
    if errores:
        raise ValidationFailed(errores)
    if idea_de_anio(db, hce_id, anio) is not None:
        raise ConflictError(
            f"El expediente {hce_id} ya tiene un IDEA del {anio}",
            [("anio", "Ya existe un IDEA de ese año para el expediente")],
        )

    totales = calcular_totales(dim)
    idea = Idea(
        hce_id=hce_id, anio=anio, dim=dim or None, **escalares,
        **{k: v for k, v in totales.items() if k != "puntuadas"},
    )
    db.add(idea)
    _flush_traduciendo(db)
    registrar_carga(
        db, modulo=MODULO_HCE_LB, hce_id=hce_id, usuario_id=usuario_id,
        detalle=f"Alta de {MODULO_HCE_LB} (IDEA {anio}) del expediente {hce_id}",
    )
    avisos = flujo.avisos_de_secuencia(
        db, hce_id=hce_id, anio=anio, modulo=MODULO_HCE_LB, accion="creación", usuario_id=usuario_id,
    )
    return idea, avisos


def _obtener_para_escribir(db: Session, idea_id: int) -> Idea:
    """El IDEA **con la fila bloqueada** hasta el fin de la transacción, para que un PATCH
    y una firma simultáneos no se pisen (la firma validó sobre un estado que el PATCH cambió)."""
    idea = db.get(Idea, idea_id, with_for_update=True)
    if idea is None:
        raise NotFound(f"No existe el IDEA {idea_id}")
    return idea


def actualizar_idea(
    db: Session, idea_id: int, datos: Mapping[str, Any], *, usuario_id: int | None = None,
) -> Idea:
    """Edición parcial (sólo las claves presentes) de un IDEA **sin firmar**.

    **409** `signed_module` si ya está firmado · 422 si un dato es inválido. `dim` se
    fusiona dimensión por dimensión. **Recalcula** `total` y `esc_*`. Audita **por campo**:
    una fila por cada campo que cambió y una `dim.Dn` por cada dimensión que cambió; un
    PATCH idéntico no escribe ninguna.
    """
    idea = _obtener_para_escribir(db, idea_id)
    firma.exigir_no_firmado(idea, MODULO_HCE_LB)

    errores: list[tuple[str | None, str]] = []
    cambios = _preparar_escalares(db, datos, errores)
    dim, antes_dim, despues_dim = _fusionar_dim(idea.dim, datos.get("dim"), errores)
    _exigir_evaluadores_distintos(
        cambios.get("evaluador_t1_id", idea.evaluador_t1_id),
        cambios.get("evaluador_t2_id", idea.evaluador_t2_id),
        errores,
    )
    if errores:
        raise ValidationFailed(errores)

    antes = {c: getattr(idea, c) for c in cambios}
    for campo, valor in cambios.items():
        setattr(idea, campo, valor)
    if despues_dim:
        idea.dim = dim
    for campo, valor in calcular_totales(idea.dim).items():
        if campo != "puntuadas":
            setattr(idea, campo, valor)
    db.flush()

    registrar_cambios(
        db, modulo=MODULO_HCE_LB, hce_id=idea.hce_id, antes=antes, despues=cambios, usuario_id=usuario_id,
    )
    registrar_cambios(
        db, modulo=MODULO_HCE_LB, hce_id=idea.hce_id, antes=antes_dim, despues=despues_dim, usuario_id=usuario_id,
    )
    return idea


def _errores_de_firma(db: Session, idea: Idea) -> list[tuple[str | None, str]]:
    """Todo lo que impide firmar, **junto** y con su campo (el cliente arregla en una pasada)."""
    errores: list[tuple[str | None, str]] = []
    for codigo in IDEA_DIMENSIONES:
        valor = _valor_de(idea.dim, codigo)
        if valor is None:
            errores.append((f"dim.{codigo}", "Falta puntuar la dimensión"))
        elif valor == IDEA_NS:
            errores.append((f"dim.{codigo}", f"Está en {IDEA_NS} (observación insuficiente): puntuala para firmar"))
    if idea.fecha_consenso is None:
        errores.append(("fecha_consenso", "Es obligatoria para firmar"))
    if normalizar_texto(idea.sintesis) is None:
        errores.append(("sintesis", "La síntesis clínica es obligatoria para firmar"))
    if normalizar_texto(idea.objetivos) is None:
        errores.append(("objetivos", "Los objetivos del período son obligatorios para firmar"))

    t1, t2 = idea.evaluador_t1_id, idea.evaluador_t2_id
    for campo, profesional_id in (("evaluador_t1_id", t1), ("evaluador_t2_id", t2)):
        if profesional_id is None:
            errores.append((campo, "Falta el evaluador: firman los dos técnicos"))
        else:
            profesional = db.get(Profesional, profesional_id)
            if profesional is None or not profesional.activo:
                errores.append((campo, "El evaluador tiene que ser un profesional activo"))
    if t1 is not None and t1 == t2:
        errores.append(("evaluador_t2_id", "Tiene que ser distinto del evaluador 1"))
    return errores


def firmar_idea(
    db: Session, idea_id: int, *, usuario_id: int | None = None,
) -> tuple[Idea, list[dict[str, Any]]]:
    """Firma el IDEA (**un solo acto**, §5.98) y devuelve `(idea, avisos)`.

    **409** si ya está firmado · **422** con el detalle por campo de todo lo que falta
    (ver `_errores_de_firma`). Al firmar queda fijo el total y las escalas —recalculados una
    última vez—, `manual_version` (`IDEA_MANUAL_VERSION`, que un cambio posterior de la
    constante **no** toca) y `firmas` con los dos evaluadores. Todo en la transacción del
    request: si algo falla después, el IDEA vuelve a quedar sin firmar y sin fila de firma.
    """
    idea = _obtener_para_escribir(db, idea_id)
    firma.exigir_no_firmado(idea, MODULO_HCE_LB)  # firmar dos veces es 409, no 422
    errores = _errores_de_firma(db, idea)
    if errores:
        raise ValidationFailed(errores)

    def congelar() -> None:
        for campo, valor in calcular_totales(idea.dim).items():
            if campo != "puntuadas":
                setattr(idea, campo, valor)
        idea.manual_version = IDEA_MANUAL_VERSION

    avisos = firma.firmar_modulo(
        db, idea, codigo=MODULO_HCE_LB, hce_id=idea.hce_id, anio=idea.anio,
        firmantes=[db.get(Profesional, idea.evaluador_t1_id), db.get(Profesional, idea.evaluador_t2_id)],
        congelar=congelar, usuario_id=usuario_id,
    )
    return idea, avisos


def agregar_addenda(
    db: Session, idea_id: int, *, texto: str | None, profesional_id: int | None,
    usuario_id: int | None = None,
) -> Idea:
    """Addenda sobre un IDEA firmado (ver `firma.agregar_addenda`): 409 si no está firmado."""
    idea = _obtener_para_escribir(db, idea_id)
    firma.agregar_addenda(
        db, idea, codigo=MODULO_HCE_LB, hce_id=idea.hce_id,
        texto=texto, profesional_id=profesional_id, usuario_id=usuario_id,
    )
    return idea
