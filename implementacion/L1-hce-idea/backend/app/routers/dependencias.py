"""Dependencias compartidas por los routers."""
from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.identidad import Profesional
from app.models.modulos import Idea, InformeCierre, Protocolo
from app.services import auth
from app.services.errores import NotFound


def sesion_transaccional(db: Session = Depends(get_db)) -> Iterator[Session]:
    """**Una transacción por request**: commit al volver el endpoint, rollback si falla.

    Se apoya en `get_db` (que abre y cierra la sesión) y le agrega el único
    `commit` del request. Los servicios no commitean (`app/services/__init__.py`).

    - El endpoint vuelve sin excepción → `commit()`.
    - Cualquier excepción (de dominio, de validación, un bug) → `rollback()` de
      todo lo que el request escribió, y la excepción sigue su camino hacia el
      manejador que arma la respuesta de error.

    Los endpoints tienen que **armar la respuesta antes de volver**
    (`Schema.model_validate(...)` dentro de la función): el commit expira los
    objetos del ORM y no se debe depender de que se serialicen después.

    **Un commit que falla tiene que salir como error, no como 2xx.** Eso depende de
    que FastAPI corra el código de salida de las dependencias *antes* de enviar la
    respuesta, que es el comportamiento de `fastapi==0.115.x`; versiones posteriores
    (~0.118+, según su changelog) lo mueven *después*, y un `commit()` fallido pasaría a ser un 201 con
    datos que no se guardaron. `tests/test_m11_3a3_convenciones.py` lo verifica, y
    `requirements.txt` fija la versión por esto.
    """
    try:
        yield db
        db.commit()
    except BaseException:
        db.rollback()
        raise


def sesion_lectura(db: Session = Depends(get_db)) -> Session:
    """Sesión de los **GET**: nunca commitea (§5.115 d).

    Un GET no escribe, así que no hay nada que confirmar; `get_db` cierra la sesión
    al terminar y eso descarta la transacción implícita. Usar esto en vez de
    `sesion_transaccional` evita un `COMMIT` por cada lectura y deja el `commit`
    como señal de «este request escribió».
    """
    return db


# ── Login mínimo y alcance por grupo (§5.101 · M11.3-d1) ─────────────────────
# `HTTPBearer` y no `OAuth2PasswordBearer`: el login recibe JSON (`{email, password}`),
# no el formulario de OAuth2; en Swagger, «Authorize» pide el token y lo manda en
# `Authorization: Bearer …`. `auto_error=False` para que la falta de token salga con el
# sobre de error de siempre (`unauthorized`, 401) y no con el 403 propio de FastAPI.
_bearer = HTTPBearer(
    auto_error=False,
    description="Token de `POST /auth/login` (`access_token`).",
)


def usuario_actual(
    credenciales: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Session = Depends(get_db),
) -> Profesional:
    """El profesional autenticado, o **401**. `main.py` la pone en **todos** los routers salvo
    `/health`, `/auth/login` y la documentación; los endpoints que escriben la piden además
    para dejar su `id` en `auditoria.usuario_id` (FastAPI la resuelve una sola vez)."""
    return auth.usuario_de_token(db, credenciales.credentials if credenciales else None)


def hce_visible(
    hce_id: int,
    usuario: Annotated[Profesional, Depends(usuario_actual)],
    db: Session = Depends(get_db),
) -> None:
    """**404** si el expediente `{hce_id}` del path no existe o queda fuera del alcance del usuario."""
    auth.exigir_hce_visible(db, usuario, hce_id)


def _visible_por(modelo, parametro: str, nombre: str):
    """Dependencia para las rutas por id de algo que cuelga de un expediente (`/idea/{idea_id}`…).

    Lee **sólo la columna `hce_id`**, sin cargar la entidad: si la cargara, el `FOR UPDATE`
    que el servicio pide después (PATCH, firma, addenda) traería la fila bloqueada pero el
    mapa de identidad conservaría el estado leído antes del lock, y dos firmas simultáneas
    podrían ver las dos «sin firmar». Si la fila no existe no hace nada: el servicio da el 404
    de siempre. Si existe y queda fuera del alcance, el **mismo** 404 que si no existiera.
    """
    columna_id = modelo.id

    def dependencia(
        request: Request,
        usuario: Annotated[Profesional, Depends(usuario_actual)],
        db: Session = Depends(get_db),
    ) -> None:
        crudo = request.path_params.get(parametro, "")
        if not crudo.isdigit():
            return  # la validación del path ya lo rechaza con 422
        hce_id = db.scalar(select(modelo.hce_id).where(columna_id == int(crudo)))
        if hce_id is None:
            return
        try:
            auth.exigir_hce_visible(db, usuario, hce_id)
        except NotFound:
            raise NotFound(f"No existe {nombre} {crudo}") from None

    return dependencia


idea_visible = _visible_por(Idea, "idea_id", "el IDEA")
protocolo_visible = _visible_por(Protocolo, "protocolo_id", "el protocolo")
informe_visible = _visible_por(InformeCierre, "informe_id", "el informe de cierre")
