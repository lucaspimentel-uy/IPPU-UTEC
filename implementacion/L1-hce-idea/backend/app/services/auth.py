"""Login y usuario del token (§5.101) — M11.3-d1.

**Quién puede qué ya no vive acá**: desde la Fase 4 (A1) lo decide una sola matriz, `app/services/matriz.py` (roles,
relación tratante / no tratante, ventana con motivo). Este módulo sólo autentica.

El servicio no importa FastAPI (regla de `app/services/__init__.py`); la extracción del
token de la cabecera está en `app/routers/dependencias.py`.
"""
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.seguridad import (
    MENSAJE_SIN_TOKEN, MENSAJE_TOKEN_INVALIDO, gastar_verificacion, leer_token, verificar_password,
)
from app.models.identidad import Profesional
from app.services.errores import Unauthorized

_CREDENCIALES_INVALIDAS = "Email o contraseña incorrectos"


def normalizar_email(email: str) -> str:
    """El email se compara sin mayúsculas y sin blancos alrededor."""
    return email.strip().lower()


def autenticar(db: Session, email: str, password: str) -> Profesional:
    """El profesional **activo y con contraseña** cuyo email y contraseña coinciden; si no, 401.

    El mismo mensaje para «no existe», «contraseña incorrecta», «inactivo» y «sin
    contraseña»: no se revela cuál de las cuatro fue.
    """
    profesional = db.scalars(
        select(Profesional).where(func.lower(Profesional.email) == normalizar_email(email))
    ).first()
    if profesional is None or not profesional.activo or not profesional.hashed_password:
        # Mismo costo que una contraseña incorrecta (§5.119): el tiempo de respuesta no
        # distingue un email inexistente de uno existente.
        gastar_verificacion(password)
        raise Unauthorized(_CREDENCIALES_INVALIDAS, [(None, _CREDENCIALES_INVALIDAS)])
    if not verificar_password(password, profesional.hashed_password):
        raise Unauthorized(_CREDENCIALES_INVALIDAS, [(None, _CREDENCIALES_INVALIDAS)])
    return profesional


def usuario_de_token(db: Session, token: str | None) -> Profesional:
    """El profesional del token, o 401 si falta, es inválido o venció, o si el profesional
    ya no existe, está inactivo o perdió la contraseña (dar de baja a alguien corta sus
    sesiones abiertas sin esperar a que venza el token)."""
    profesional_id = leer_token(token) if token else None
    profesional = db.get(Profesional, profesional_id) if profesional_id is not None else None
    if profesional is None or not profesional.activo or not profesional.hashed_password:
        mensaje = MENSAJE_SIN_TOKEN if not token else MENSAJE_TOKEN_INVALIDO
        raise Unauthorized(mensaje, [(None, mensaje)])
    return profesional


