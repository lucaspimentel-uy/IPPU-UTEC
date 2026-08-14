"""Mixins compartidos entre módulos del modelo.

`FirmaMixin` vive en `modulos.py` porque sólo aplica al flujo firmable; lo de
acá cruza los tres archivos.
"""
from datetime import date

from sqlalchemy import Date, String
from sqlalchemy.orm import Mapped, mapped_column


class OrigenMigracionMixin:
    """Procedencia de un registro traído de la HCE anterior (§10 · M12.1).

    La estrategia de migración del Prototipo v4 es: **sólo el IDEA entra
    estructurado**, el resto queda como documento legacy, hay acta de cierre,
    coexistencia acotada y verificación por muestreo. Nada de eso funciona si
    después no se puede distinguir un dato cargado en el sistema nuevo de uno
    traído del viejo — de ahí estos cuatro campos.

    Reemplazan al `idea.migrado_origen JSONB` de M11.2: eran los mismos datos en
    una bolsa sin forma, imposible de filtrar («mostrame todo lo migrado del
    sistema X que todavía nadie verificó») y sin garantía de que dos cargas
    usaran las mismas claves. No había datos: no hay migración de datos que
    hacer.

    **Todos nullable**: un registro creado en el sistema nuevo los deja en NULL,
    y `sistema_origen IS NULL` es exactamente «este dato nació acá».

    `responsable_migracion` es **texto y no FK a `profesional`**: quien firma el
    acta de migración puede no ser usuario del sistema, y en cualquier caso el
    valor tiene que sobrevivir a que esa persona se dé de baja.
    """

    #: Nombre del sistema del que vino el dato. NULL = nació en este sistema.
    sistema_origen: Mapped[str | None] = mapped_column(String(120))
    #: Fecha que el dato tenía en el sistema viejo (≠ fecha de la migración).
    fecha_original: Mapped[date | None] = mapped_column(Date)
    #: Cuándo se cargó acá.
    fecha_migracion: Mapped[date | None] = mapped_column(Date)
    #: Quién respondió por la carga (nombre, no FK — ver el docstring).
    responsable_migracion: Mapped[str | None] = mapped_column(String(120))
