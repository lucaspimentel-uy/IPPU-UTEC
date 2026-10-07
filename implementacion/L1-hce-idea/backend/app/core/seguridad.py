"""Contraseñas y tokens del login mínimo (§5.101, M11.3-d1).

Sin lógica de negocio: hashear/verificar una contraseña y emitir/leer un JWT. Quién
puede entrar y qué ve lo decide `app/services/auth.py`.

- **Contraseñas:** `bcrypt` directo. `passlib` 1.7.4 (sin mantenimiento) no funciona con
  `bcrypt` ≥ 4.1 —falla al hashear su prueba interna de 72 bytes—, por eso se retiró de
  `requirements.txt` y se usa la librería que ya estaba instalada como su backend.
  bcrypt sólo mira los primeros **72 bytes**; una contraseña más larga se rechaza al
  crearla (`crear_usuario`), nunca se trunca en silencio.
- **Tokens:** JWT HS256 con `python-jose`. `sub` = `profesional.id` (texto, como pide el
  RFC 7519), `exp` = ahora + `ACCESS_TOKEN_EXPIRE_MINUTES`. La clave es `SECRET_KEY`.
"""
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

ALGORITMO = "HS256"
#: Límite de bcrypt: lo que pase de acá no participaría del hash.
BCRYPT_MAX_BYTES = 72


def hashear_password(password: str) -> str:
    datos = password.encode("utf-8")
    if len(datos) > BCRYPT_MAX_BYTES:
        raise ValueError(f"La contraseña no puede superar {BCRYPT_MAX_BYTES} bytes")
    return bcrypt.hashpw(datos, bcrypt.gensalt()).decode("ascii")


def verificar_password(password: str, hashed: str | None) -> bool:
    """`False` (nunca una excepción) si no hay hash, el hash está roto o no coincide."""
    if not hashed:
        return False
    datos = password.encode("utf-8")
    if len(datos) > BCRYPT_MAX_BYTES:
        return False
    try:
        return bcrypt.checkpw(datos, hashed.encode("ascii"))
    except ValueError:
        return False


#: Hash de una contraseña que nadie conoce, calculado **una vez al importar** y con el costo por
#: omisión (el mismo que `hashear_password`). Lo usa `gastar_verificacion` para que un login con un
#: email inexistente, inactivo o sin contraseña tarde lo mismo que uno con la contraseña mal
#: (§5.119): sin esto, la diferencia de tiempo (sin bcrypt vs. con bcrypt) dice qué emails existen.
_HASH_FICTICIO = bcrypt.hashpw(b"hash-ficticio-para-igualar-el-tiempo-del-login", bcrypt.gensalt())


def gastar_verificacion(password: str) -> None:
    """Corre `bcrypt.checkpw` contra `_HASH_FICTICIO` y descarta el resultado."""
    bcrypt.checkpw(password.encode("utf-8")[:BCRYPT_MAX_BYTES], _HASH_FICTICIO)


def crear_token(profesional_id: int, *, minutos: int | None = None) -> str:
    vence = datetime.now(UTC) + timedelta(
        minutes=settings.access_token_expire_minutes if minutos is None else minutos
    )
    return jwt.encode({"sub": str(profesional_id), "exp": vence}, settings.secret_key, algorithm=ALGORITMO)


def leer_token(token: str) -> int | None:
    """El `profesional.id` del token, o `None` si es inválido, está vencido o no trae `sub`."""
    try:
        carga = jwt.decode(token, settings.secret_key, algorithms=[ALGORITMO])
    except JWTError:
        return None
    sub = carga.get("sub")
    return int(sub) if isinstance(sub, str) and sub.isdigit() else None
