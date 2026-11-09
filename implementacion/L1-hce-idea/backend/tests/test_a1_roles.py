"""A1 · etapa 1 — los cuatro roles, `token_version` y la tabla `acceso_hce` (`docs/diseno/fase4-acceso.md` a, d, h).

Cada rechazo tiene su caso que pasa: el CHECK del rol con las cuatro claves y sin `admin`; `crear_usuario` con las cuatro
claves y el mensaje de `admin`; los CHECK de `acceso_hce` (relación, motivo, motivo según la relación, `vence >= inicio`)
y su FK RESTRICT al expediente.
"""
from datetime import date

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app.core.constantes import MOTIVOS_ACCESO, ROLES
from app.models.acceso import AccesoHce
from app.models.identidad import HceDiurna, Persona, Profesional
from tests.test_d0_guardia_destino import ARGS_USUARIO, VARIABLE, _profesionales, base_destino, entorno, sesiones_de_test  # noqa: F401


def test_los_roles_son_las_cuatro_claves_del_diseno():
    assert list(ROLES) == ["tecnico", "coordinacion", "administrativo", "direccion_nt"]
    assert all(len(clave) <= 20 for clave in ROLES)  # caben en String(20)


@pytest.mark.parametrize("rol", list(ROLES))
def test_el_check_acepta_cada_rol(db, rol):
    db.add(Profesional(nombre="X", email=f"{rol}@ippu.test", rol=rol))
    db.flush()


def test_el_check_rechaza_admin(db):
    db.add(Profesional(nombre="X", email="viejo@ippu.test", rol="admin"))
    with pytest.raises(IntegrityError, match="ck_profesional_rol_valido"):
        db.flush()


def test_token_version_nace_en_cero(db):
    p = Profesional(nombre="X", email="tv@ippu.test", rol="tecnico")
    db.add(p)
    db.flush()
    assert db.scalar(text("SELECT token_version FROM profesional WHERE id = :i"), {"i": p.id}) == 0


# ── crear_usuario ────────────────────────────────────────────────────────────
@pytest.mark.parametrize("rol", list(ROLES))
def test_crear_usuario_acepta_las_cuatro_claves(sesiones_de_test, entorno, capsys, rol):  # noqa: F811
    from app.crear_usuario import main

    entorno.setenv(VARIABLE, base_destino())
    antes = _profesionales(sesiones_de_test)
    assert main(["--email", f"n-{rol}@ippu.test", "--nombre", "Nuevo", "--rol", rol]) == 0, capsys.readouterr().err
    assert _profesionales(sesiones_de_test) == antes + 1


def test_crear_usuario_rechaza_admin_con_el_mensaje_y_sin_escribir(sesiones_de_test, entorno, capsys):  # noqa: F811
    from app.crear_usuario import main

    entorno.setenv(VARIABLE, base_destino())
    antes = _profesionales(sesiones_de_test)
    assert main(["--email", "n@ippu.test", "--nombre", "Nuevo", "--rol", "admin"]) == 1
    assert _profesionales(sesiones_de_test) == antes
    assert "El rol admin ya no existe: usá coordinacion." in capsys.readouterr().err


def test_crear_usuario_rechaza_un_rol_inventado(sesiones_de_test, entorno, capsys):  # noqa: F811
    from app.crear_usuario import main

    entorno.setenv(VARIABLE, base_destino())
    assert main(["--email", "n@ippu.test", "--nombre", "Nuevo", "--rol", "superusuario"]) == 1
    assert "el rol tiene que ser uno de: tecnico, coordinacion, administrativo, direccion_nt" in capsys.readouterr().err


def test_la_funcion_crear_usuario_tambien_rechaza_admin(db):
    from app.crear_usuario import DatoInvalido, crear_usuario

    with pytest.raises(DatoInvalido, match="El rol admin ya no existe: usá coordinacion."):
        crear_usuario(db, email="x@ippu.test", nombre="X", rol="admin", password="una-clave-larga")


# ── acceso_hce ───────────────────────────────────────────────────────────────
@pytest.fixture
def base(db):
    p = Profesional(nombre="Coord", email="c@ippu.test", rol="coordinacion")
    persona = Persona(nombre="A", apellido="B", ci="11111111", fecha_nac=date(2016, 1, 1))
    hce = HceDiurna(persona=persona, hc_historico=1001)
    db.add_all([p, persona, hce])
    db.flush()
    return p, hce


def _fila(p, hce, **campos):
    datos = {"hce_id": hce.id, "usuario_id": p.id, "rol": "coordinacion", "relacion": "supervision",
             "motivo_codigo": "supervision", "vence": text("now() + interval '120 minutes'"), "token_version": 0}
    datos.update(campos)
    return AccesoHce(**datos)


def test_una_ventana_de_supervision_entra(db, base):
    db.add(_fila(*base))
    db.flush()


@pytest.mark.parametrize("relacion", ["tratante", "gestion"])
def test_tratante_y_gestion_van_sin_motivo(db, base, relacion):
    db.add(_fila(*base, relacion=relacion, motivo_codigo=None))
    db.flush()


@pytest.mark.parametrize("relacion", ["tratante", "gestion"])
def test_tratante_y_gestion_con_motivo_se_rechazan(db, base, relacion):
    db.add(_fila(*base, relacion=relacion))
    with pytest.raises(IntegrityError, match="ck_acceso_hce_motivo_segun_relacion"):
        db.flush()


@pytest.mark.parametrize("relacion", ["no_tratante", "supervision", "titular"])
def test_las_demas_relaciones_sin_motivo_se_rechazan(db, base, relacion):
    db.add(_fila(*base, relacion=relacion, motivo_codigo=None))
    with pytest.raises(IntegrityError, match="ck_acceso_hce_motivo_segun_relacion"):
        db.flush()


def test_relacion_fuera_del_dominio_se_rechaza(db, base):
    db.add(_fila(*base, relacion="dueño"))
    with pytest.raises(IntegrityError, match="ck_acceso_hce_relacion_valida"):
        db.flush()


def test_motivo_fuera_del_catalogo_se_rechaza(db, base):
    assert "curiosidad" not in MOTIVOS_ACCESO
    db.add(_fila(*base, motivo_codigo="curiosidad"))
    with pytest.raises(IntegrityError, match="ck_acceso_hce_motivo_valido"):
        db.flush()


def test_vence_antes_de_inicio_se_rechaza_y_vence_igual_a_inicio_entra(db, base):
    db.add(_fila(*base, relacion="titular", motivo_codigo="copia_familia", motivo_texto="A la madre, todo",
                 vence=text("now()")))
    db.flush()
    db.add(_fila(*base, vence=text("now() - interval '1 minute'")))
    with pytest.raises(IntegrityError, match="ck_acceso_hce_vence_desde_inicio"):
        db.flush()


def test_el_registro_sobrevive_al_expediente_restrict(db, base):
    p, hce = base
    db.add(_fila(p, hce))
    db.flush()
    with pytest.raises(IntegrityError, match="fk_acceso_hce_hce_id_hce_diurna"):
        db.execute(text("DELETE FROM hce_diurna WHERE id = :i"), {"i": hce.id})
