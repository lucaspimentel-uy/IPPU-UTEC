"""Login mínimo y alcance por grupo (§5.101) — M11.3-d1.

Dos roles, los que ya existen en `profesional.rol` (`ck_profesional_rol_valido`):

- **`admin`** ve y escribe todo.
- **`tecnico`** ve sólo los expedientes cuyo grupo (`hce_diurna.grupo_id`, el grupo
  **actual** del expediente) lo tiene como `tecnico1_id` o `tecnico2_id`. Un expediente
  sin grupo no lo ve ningún técnico.

**Un expediente fuera del alcance es 404, no 403**, con el mismo mensaje que uno que no
existe: la respuesta no revela que el expediente existe. Lo mismo vale para lo que cuelga
de él (IDEA, protocolo, informe de cierre, VF): el chequeo se hace sobre su `hce_id`.

El servicio no importa FastAPI (regla de `app/services/__init__.py`); la extracción del
token de la cabecera está en `app/routers/dependencias.py`.
"""
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.constantes import ROL_ADMIN, ROL_TECNICO
from app.core.seguridad import leer_token, verificar_password
from app.models.identidad import Grupo, HceDiurna, Profesional
from app.services.errores import ForbiddenAction, NotFound, Unauthorized

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
    if (
        profesional is None
        or not profesional.activo
        or not verificar_password(password, profesional.hashed_password)
    ):
        raise Unauthorized(_CREDENCIALES_INVALIDAS, [(None, _CREDENCIALES_INVALIDAS)])
    return profesional


def usuario_de_token(db: Session, token: str | None) -> Profesional:
    """El profesional del token, o 401 si falta, es inválido o venció, o si el profesional
    ya no existe, está inactivo o perdió la contraseña (dar de baja a alguien corta sus
    sesiones abiertas sin esperar a que venza el token)."""
    profesional_id = leer_token(token) if token else None
    profesional = db.get(Profesional, profesional_id) if profesional_id is not None else None
    if profesional is None or not profesional.activo or not profesional.hashed_password:
        mensaje = "Falta el token de acceso" if not token else "El token de acceso es inválido o venció"
        raise Unauthorized(mensaje, [(None, mensaje)])
    return profesional


def es_admin(usuario: Profesional) -> bool:
    return usuario.rol == ROL_ADMIN


def _es_tecnico_del_grupo(usuario: Profesional, grupo: Grupo | None) -> bool:
    return grupo is not None and usuario.id in (grupo.tecnico1_id, grupo.tecnico2_id)


def puede_ver(usuario: Profesional, hce: HceDiurna) -> bool:
    return es_admin(usuario) or (usuario.rol == ROL_TECNICO and _es_tecnico_del_grupo(usuario, hce.grupo))


def exigir_hce_visible(db: Session, usuario: Profesional, hce_id: int | None) -> None:
    """404 si el expediente no existe **o** el usuario no lo puede ver (mismo mensaje)."""
    hce = db.get(HceDiurna, hce_id) if hce_id is not None else None
    if hce is None or not puede_ver(usuario, hce):
        raise NotFound(f"No existe el expediente {hce_id}")


def condicion_de_alcance(usuario: Profesional):
    """Condición SQL para la búsqueda (sobre el `JOIN` con `grupo`): `None` = sin filtro."""
    if es_admin(usuario):
        return None
    return or_(Grupo.tecnico1_id == usuario.id, Grupo.tecnico2_id == usuario.id)


def exigir_grupo_propio(db: Session, usuario: Profesional, grupo_id: int | None) -> None:
    """Un técnico sólo asigna un expediente a **uno de sus grupos** (al crearlo o al cambiarle
    el grupo): si no, el expediente saldría de su alcance en el mismo acto. 403 — acá no hay
    nada que ocultar, el grupo lo eligió él. `grupo_id` inexistente lo rechaza (422) el
    servicio de HCE; acá sólo se mira la pertenencia."""
    if es_admin(usuario):
        return
    grupo = db.get(Grupo, grupo_id) if grupo_id is not None else None
    if grupo_id is not None and grupo is None:
        return
    if not _es_tecnico_del_grupo(usuario, grupo):
        raise ForbiddenAction(
            "Un técnico sólo puede asignar el expediente a un grupo propio",
            [("grupo_id", "Tiene que ser un grupo en el que sos técnico/a")],
        )
