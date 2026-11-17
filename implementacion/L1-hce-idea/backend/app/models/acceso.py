"""El registro de accesos a la HC — Fase 4, A1 (`docs/diseno/fase4-acceso.md` d, F4-9, §5.164).

**Una tabla propia y no `auditoria` con `tipo='acceso'`** (sección d): `auditoria.hce_id` cascadea con el expediente y el
registro de accesos tiene que sobrevivirle (FK **RESTRICT**); la ventana se busca en cada pedido por `(usuario,
expediente, vencimiento)`, un índice chico acá; `GET /hce/{id}/auditoria` (C1) no cambia; y los lectores son otros
(F4-10, A2).

**Una fila por ventana, no por GET.** Una ventana es el permiso de un usuario sobre un expediente durante
`VENTANA_ACCESO_MINUTOS`, desde el pedido que la abre. Es **vigente** si `ahora < vence`, su `relacion` abre la lectura
(`ACCESO_RELACIONES_VENTANA`) y su `token_version` es la del usuario (F4-12): termina sola, sin escribir nada. La copia de
la HC a la familia (`titular`) no abre ninguna: `vence = inicio`.

**Sólo inserción**, como `auditoria`: ningún servicio hace UPDATE ni DELETE (`REVOKE` recomendado en el despliegue).
A1 escribe las filas de `POST /hce/{id}/accesos`; A2 (§5.178), las automáticas del tratante, de la gestión y del ateneo
clínico, sobre esta misma tabla (`app/services/registro_accesos.py`).

**Los intentos van aparte (`acceso_intento`, A2, §5.178 e):** una consulta por C.I. o una C.I. equivocada no son un
acceso (no se abrió ninguna HC), así que no ensucian el registro que pide el Protocolo §8; pero tienen que dejar
rastro (hallazgo 2 de la auditoría del 2026-11-13: se podían probar C.I. sin que quedara nada).
"""
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constantes import (
    ACCESO_GESTION, ACCESO_RELACIONES, ACCESO_TRATANTE, INTENTO_CI_ERRADA, INTENTO_ENCONTRADO, INTENTO_RECHAZADO,
    INTENTO_RESULTADOS, INTENTO_TIPOS, MOTIVOS_ACCESO,
)
from app.core.database import Base


def _en(columna: str, valores) -> str:
    return "{} IN ({})".format(columna, ", ".join(f"'{v}'" for v in valores))


class AccesoHce(Base):
    """Un acceso a una HC: quién, cuándo, a qué expediente y por qué (Protocolo §8, Anexo III)."""
    __tablename__ = "acceso_hce"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    #: La HC consultada. **RESTRICT**: el registro sobrevive al expediente (no se borra uno con accesos registrados).
    hce_id: Mapped[int] = mapped_column(ForeignKey("hce_diurna.id", ondelete="RESTRICT"), index=True)
    #: Quien accede; con la credencial individual es la **firma** del acceso (§5.162 g).
    usuario_id: Mapped[int] = mapped_column(ForeignKey("profesional.id", ondelete="RESTRICT"), index=True)
    #: El rol al momento del acceso (el rol cambia; la fila no).
    rol: Mapped[str] = mapped_column(String(20))
    relacion: Mapped[str] = mapped_column(String(20))
    #: Clave de `MOTIVOS_ACCESO`. NULL sólo —y siempre— en `tratante` y `gestion` (se registran sin motivo).
    motivo_codigo: Mapped[str | None] = mapped_column(String(30))
    motivo_texto: Mapped[str | None] = mapped_column(Text)
    #: Si el acceso fue por un ateneo clínico (A2, el registro automático).
    ateneo_id: Mapped[int | None] = mapped_column(ForeignKey("ateneo.id", ondelete="RESTRICT"), index=True)
    inicio: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    #: Fin de la ventana; igual a `inicio` en `titular` (no abre ninguna).
    vence: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    #: La versión de las sesiones del usuario con que se abrió (F4-12).
    token_version: Mapped[int] = mapped_column(Integer)

    __table_args__ = (
        CheckConstraint(_en("relacion", ACCESO_RELACIONES), name="relacion_valida"),
        CheckConstraint(f"motivo_codigo IS NULL OR {_en('motivo_codigo', MOTIVOS_ACCESO)}", name="motivo_valido"),
        CheckConstraint(
            f"(motivo_codigo IS NULL) = (relacion IN ('{ACCESO_TRATANTE}', '{ACCESO_GESTION}'))",
            name="motivo_segun_relacion",
        ),
        CheckConstraint("vence >= inicio", name="vence_desde_inicio"),
        Index("ix_acceso_hce_usuario_hce_vence", "usuario_id", "hce_id", "vence"),
    )


class AccesoIntento(Base):
    """Un intento de llegar a un expediente por su C.I. (A2, §5.178 e): cada `POST /hce/consulta` que se ejecutó y cada
    `POST /hce/{id}/accesos` rechazado porque la C.I. no es la del expediente. **Sólo inserción. No guarda la C.I.
    escrita**: guarda quién, cuándo, qué se intentó y qué expediente quedó señalado."""
    __tablename__ = "acceso_intento"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("profesional.id", ondelete="RESTRICT"), index=True)
    #: El rol al momento del intento.
    rol: Mapped[str] = mapped_column(String(20))
    tipo: Mapped[str] = mapped_column(String(20))
    #: El expediente encontrado por la consulta, o el destino de la C.I. equivocada; NULL si la consulta no encontró nada.
    hce_id: Mapped[int | None] = mapped_column(ForeignKey("hce_diurna.id", ondelete="RESTRICT"), index=True)
    resultado: Mapped[str] = mapped_column(String(20))
    momento: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    __table_args__ = (
        CheckConstraint(_en("tipo", INTENTO_TIPOS), name="tipo_valido"),
        CheckConstraint(_en("resultado", INTENTO_RESULTADOS), name="resultado_valido"),
        #: La C.I. equivocada siempre es un rechazo; una consulta, nunca.
        CheckConstraint(
            f"(tipo = '{INTENTO_CI_ERRADA}') = (resultado = '{INTENTO_RECHAZADO}')", name="resultado_segun_tipo",
        ),
        #: Hay expediente salvo —y sólo— cuando la consulta no encontró nada.
        CheckConstraint(
            f"(hce_id IS NOT NULL) = (resultado IN ('{INTENTO_ENCONTRADO}', '{INTENTO_RECHAZADO}'))",
            name="expediente_segun_resultado",
        ),
    )
