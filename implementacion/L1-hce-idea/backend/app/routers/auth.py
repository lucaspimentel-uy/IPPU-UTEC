"""Login mínimo (§5.101) — M11.3-d1.

`POST /auth/login` es, con `/health` y la documentación, lo único que no pide token. El
token va después en `Authorization: Bearer <access_token>`. Reglas: `app/services/auth.py`.
"""
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.seguridad import crear_token
from app.models.identidad import Profesional
from app.routers.dependencias import sesion_lectura, usuario_actual
from app.routers.hce import _ejemplo
from app.schemas.auth import EJEMPLO_TOKEN, LoginEntrada, Token, UsuarioActual
from app.schemas.comunes import RespuestaError
from app.services import auth as servicio

router = APIRouter(prefix="/auth", tags=["auth"])

_ERROR_401 = {401: {"model": RespuestaError, "description": "Email o contraseña incorrectos (`code: unauthorized`)."}}


@router.post(
    "/login",
    response_model=Token,
    summary="Iniciar sesión (email + contraseña → JWT)",
    responses={**_ejemplo(200, EJEMPLO_TOKEN), **_ERROR_401},
)
def login(datos: LoginEntrada, db: Annotated[Session, Depends(sesion_lectura)]):
    """Devuelve el token para la cabecera `Authorization: Bearer …` y quién es el usuario.

    **401** con el mismo mensaje si el email no existe, la contraseña no coincide, el
    profesional está inactivo o no tiene contraseña (no se revela cuál). No escribe nada:
    el registro de accesos con motivo es posterior al 26/11 (§5.101). El token vence a los
    `ACCESS_TOKEN_EXPIRE_MINUTES`; después, cualquier ruta responde 401 y hay que volver a
    entrar.
    """
    profesional = servicio.autenticar(db, datos.email, datos.password)
    return Token(
        access_token=crear_token(profesional.id),
        expira_en_minutos=settings.access_token_expire_minutes,
        usuario=UsuarioActual.model_validate(profesional),
    )


@router.get(
    "/yo",
    response_model=UsuarioActual,
    summary="El usuario del token",
    responses={**_ejemplo(200, EJEMPLO_TOKEN["usuario"]), 401: {"model": RespuestaError, "description": "Sin token, o vencido."}},
)
def yo(usuario: Annotated[Profesional, Depends(usuario_actual)]):
    """Para que la pantalla verifique, al recargar, que el token guardado sigue valiendo."""
    return UsuarioActual.model_validate(usuario)
