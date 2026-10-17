"""Crea un `profesional` con contraseña para el login mínimo (§5.101) — M11.3-d1.

Uso (desde la carpeta del backend, con el venv activo):

    python -m app.crear_usuario --email ana@ippu.test --nombre "Ana Pereira" --rol tecnico
    python -m app.crear_usuario --email admin@ippu.test --nombre "Coordinación" --rol admin

La contraseña se pide por teclado (no queda en el historial de la terminal). Para scripts
—el seed de M11.5-a— se puede pasar en la variable de entorno `IPPU_PASSWORD`. Escribe en
`DATABASE_URL` (la base de desarrollo) **y sólo si `IPPU_SEED_DESTINO` vale el nombre de esa base**
(`app/core/destino.py`, §5.139): imprime el destino y, si no coincide, sale con 1 sin escribir.

No hay alta de usuarios por la API a propósito: la administración de usuarios es parte del
sub-módulo de administración, posterior al 26/11 (§5.90). Asignar el técnico a un grupo
(`grupo.tecnico1_id`/`tecnico2_id`) tampoco tiene pantalla todavía (§5.90/§5.92).

Sale con código 1 si el email ya existe (no pisa a nadie) o si un dato es inválido.
"""
import argparse
import getpass
import os
import sys

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.constantes import ROL_ADMIN, ROL_TECNICO
from app.core.destino import confirmar_destino
from app.core.seguridad import BCRYPT_MAX_BYTES, hashear_password
from app.models.identidad import Profesional
from app.services.auth import normalizar_email

#: Largo mínimo de la contraseña. Login mínimo para un prototipo sin datos reales: alcanza
#: con impedir las triviales; la política completa es de la Fase 4.
PASSWORD_MIN = 8


class DatoInvalido(ValueError):
    pass


def crear_usuario(
    db: Session, *, email: str, nombre: str, rol: str, password: str, especialidad: str | None = None,
) -> Profesional:
    """Valida, hashea y agrega el profesional (sólo `flush`; el que llama commitea)."""
    email = normalizar_email(email)
    if "@" not in email:
        raise DatoInvalido("El email no es válido")
    if not nombre.strip():
        raise DatoInvalido("El nombre es obligatorio")
    if rol not in (ROL_ADMIN, ROL_TECNICO):
        raise DatoInvalido(f"El rol tiene que ser {ROL_ADMIN} o {ROL_TECNICO}")
    if len(password) < PASSWORD_MIN:
        raise DatoInvalido(f"La contraseña tiene que tener al menos {PASSWORD_MIN} caracteres")
    if len(password.encode("utf-8")) > BCRYPT_MAX_BYTES:
        raise DatoInvalido(f"La contraseña no puede superar {BCRYPT_MAX_BYTES} bytes")
    if db.scalar(select(Profesional.id).where(func.lower(Profesional.email) == email)) is not None:
        raise DatoInvalido(f"Ya existe un profesional con el email {email}")
    profesional = Profesional(
        nombre=nombre.strip(), email=email, rol=rol, especialidad=especialidad,
        hashed_password=hashear_password(password), activo=True,
    )
    db.add(profesional)
    db.flush()
    return profesional


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.crear_usuario", description=__doc__.splitlines()[0])
    parser.add_argument("--email", required=True)
    parser.add_argument("--nombre", required=True)
    parser.add_argument("--rol", required=True, choices=(ROL_ADMIN, ROL_TECNICO))
    parser.add_argument("--especialidad", default=None, help="Va a `firmas[].rol` cuando firme.")
    args = parser.parse_args(argv)

    if not confirmar_destino():  # antes de pedir la contraseña
        return 1

    password = os.environ.get("IPPU_PASSWORD")
    if password is None:
        password = getpass.getpass("Contraseña: ")
        if getpass.getpass("Repetir: ") != password:
            print("Las contraseñas no coinciden.", file=sys.stderr)
            return 1

    from app.core.database import SessionLocal

    with SessionLocal() as db:
        try:
            profesional = crear_usuario(
                db, email=args.email, nombre=args.nombre, rol=args.rol,
                password=password, especialidad=args.especialidad,
            )
            db.commit()
        except DatoInvalido as exc:
            print(f"No se creó: {exc}", file=sys.stderr)
            return 1
        print(f"Creado: profesional {profesional.id} · {profesional.email} · rol {profesional.rol}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
