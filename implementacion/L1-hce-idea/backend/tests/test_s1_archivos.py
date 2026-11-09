"""S1 · B9, B10 y B11 (`handoff.md` §5.163 b): el almacenamiento de archivos no escribe antes de verificar, una subida
rechazada no deja carpetas, y los caracteres invisibles (Cf y Cc) se quitan de los nombres.

Convención del repo: cada rechazo va con el caso que pasa. «Sin carpeta» se afirma sobre el disco real de la carpeta
temporal de cada test (`carpeta_uploads`, conftest): la raíz no existe, o no tiene nada adentro.
"""
import io
import zipfile
from pathlib import Path

import pytest

from app.core.constantes import ARCHIVO_TAMANO_MAXIMO, ATENEO_DOCUMENTO_TIPOS, DOCUMENTO_TIPOS
from app.services import archivos
from app.services.errores import ArchivoDemasiadoGrande, ValidationFailed
from test_c5_documentos import HTML, INFORME, PDF, REF, _archivos, _raiz, _subir, categorias, hoy  # noqa: F401  (fixtures)
from test_c5_fotos import PNG
from test_c5_fotos import _subir as _subir_foto
from test_m11_3b_idea_flujo import _hce


def _sin_nada_en_disco() -> bool:
    raiz = _raiz()
    return not raiz.exists() or not any(raiz.rglob("*"))


def _carpetas() -> list[Path]:
    raiz = _raiz()
    return sorted(p for p in raiz.rglob("*") if p.is_dir()) if raiz.exists() else []


# ── B10: el tipo se decide antes de crear nada ───────────────────────────────
def test_un_tipo_equivocado_es_422_y_no_crea_ninguna_carpeta(client, categorias):
    hid = _hce(client)
    r = _subir(client, hid, categorias[INFORME], contenido=HTML, nombre_archivo="x.pdf")
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "archivo"
    assert _sin_nada_en_disco()
    assert _subir(client, hid, categorias[INFORME]).status_code == 201   # el caso que pasa: un PDF de verdad
    assert len(_archivos()) == 1


def test_un_archivo_vacio_es_422_y_no_crea_ninguna_carpeta(client, categorias):
    hid = _hce(client)
    r = _subir(client, hid, categorias[INFORME], contenido=b"")
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "archivo"
    assert _sin_nada_en_disco()
    assert _subir(client, hid, categorias[INFORME]).status_code == 201


def test_un_archivo_de_mas_de_10_mb_es_413_y_no_deja_ninguna_carpeta(client, categorias):
    hid = _hce(client)
    r = _subir(client, hid, categorias[INFORME], contenido=PDF + b"0" * ARCHIVO_TAMANO_MAXIMO)
    assert r.status_code == 413 and r.json()["code"] == "too_large"
    assert _sin_nada_en_disco()      # ni el temporal, ni `hce/<id>`, ni `hce`
    justo = PDF + b"0" * (ARCHIVO_TAMANO_MAXIMO - len(PDF))
    assert _subir(client, hid, categorias[INFORME], contenido=justo).status_code == 201   # 10 MB exactos pasan


def test_un_rechazo_no_quita_la_carpeta_que_ya_tenia_archivos(client, categorias):
    """Sólo se quita la carpeta que **creó** ese llamado: la de un expediente con un documento sigue ahí."""
    hid = _hce(client)
    assert _subir(client, hid, categorias[INFORME]).status_code == 201
    assert _subir(client, hid, categorias[INFORME], contenido=HTML).status_code == 422
    assert _subir(client, hid, categorias[INFORME], contenido=PDF + b"0" * ARCHIVO_TAMANO_MAXIMO).status_code == 413
    assert [p.name for p in _carpetas()] == ["hce", str(hid)] and len(_archivos()) == 1


def test_un_pptx_rechazado_no_deja_carpeta_y_uno_valido_pasa(db_api):
    """Un ZIP que no es una presentación pasa la cabecera y falla **después** de crear la carpeta: se quita."""
    falso = io.BytesIO()
    with zipfile.ZipFile(falso, "w") as zf:
        zf.writestr("[Content_Types].xml", "<Types/>")
    with pytest.raises(ValidationFailed):
        archivos.guardar(db_api, io.BytesIO(falso.getvalue()), dueno="ateneo", dueno_id=7, permitidos=ATENEO_DOCUMENTO_TIPOS)
    assert _sin_nada_en_disco()
    guardado = archivos.guardar(db_api, io.BytesIO(PDF), dueno="ateneo", dueno_id=7, permitidos=ATENEO_DOCUMENTO_TIPOS)
    assert guardado.tipo == "pdf" and archivos.ruta_de(guardado.ref).is_file()


def test_el_413_del_servicio_tampoco_deja_carpeta(db_api):
    with pytest.raises(ArchivoDemasiadoGrande):
        archivos.guardar(db_api, io.BytesIO(PDF + b"0" * ARCHIVO_TAMANO_MAXIMO), dueno="hce", dueno_id=3, permitidos=DOCUMENTO_TIPOS)
    assert _sin_nada_en_disco()


# ── B9: la carpeta se verifica antes del primer byte ─────────────────────────
def test_una_carpeta_que_resuelve_fuera_de_la_raiz_no_escribe_nada_y_da_el_500_generico(client, categorias, monkeypatch, tmp_path):
    """Una junction o un enlace simbólico en `<raíz>/hce/<id>` sacaba el archivo de la raíz. Se simula sin privilegios
    de enlaces simbólicos: `resolve()` de **esa** carpeta devuelve una ruta de afuera."""
    hid = _hce(client)
    fuera = tmp_path / "fuera"
    resolver = Path.resolve

    def resolver_con_junction(self, *args, **kwargs):
        if self.parts[-2:] == ("hce", str(hid)):
            return resolver(fuera)
        return resolver(self, *args, **kwargs)

    monkeypatch.setattr(Path, "resolve", resolver_con_junction)
    r = client.post(f"/hce/{hid}/documentos", files={"archivo": ("a.pdf", PDF, "application/pdf")}, data={"categoria_id": str(categorias[INFORME])})
    assert r.status_code == 500
    assert r.json() == {"code": "internal_error", "detail": [{"campo": None, "mensaje": "Error interno"}]}
    assert "fuera" not in r.text and str(tmp_path) not in r.text     # la causa va al log, no a la respuesta
    assert _sin_nada_en_disco() and not fuera.exists()
    monkeypatch.setattr(Path, "resolve", resolver)                        # sin el enlace
    assert _subir(client, hid, categorias[INFORME]).status_code == 201   # la misma subida, sin el enlace, pasa


def test_una_carpeta_fuera_de_la_raiz_deja_intacta_la_que_ya_existia(db_api, monkeypatch, tmp_path):
    """Si la carpeta ya existía con archivos, el rechazo no quita nada (no la creó este llamado)."""
    primero = archivos.guardar(db_api, io.BytesIO(PDF), dueno="hce", dueno_id=9, permitidos=DOCUMENTO_TIPOS)
    resolver = Path.resolve
    monkeypatch.setattr(Path, "resolve", lambda self, *a, **k: resolver(tmp_path / "fuera") if self.parts[-2:] == ("hce", "9") else resolver(self, *a, **k))
    with pytest.raises(RuntimeError):
        archivos.guardar(db_api, io.BytesIO(PDF), dueno="hce", dueno_id=9, permitidos=DOCUMENTO_TIPOS)
    assert archivos.ruta_de(primero.ref).is_file() and len(_archivos()) == 1


# ── Lo que pasa ──────────────────────────────────────────────────────────────
def test_un_pdf_valido_es_201_y_el_archivo_esta_y_una_segunda_subida_a_la_carpeta_existente_tambien(client, categorias):
    hid = _hce(client)
    a = _subir(client, hid, categorias[INFORME])
    assert a.status_code == 201, a.text
    [archivo] = _archivos()
    assert REF.match(archivo.relative_to(_raiz()).as_posix()) and archivo.read_bytes() == PDF
    b = _subir(client, hid, categorias[INFORME])                       # la carpeta ya existe
    assert b.status_code == 201, b.text
    assert len(_archivos()) == 2 and not list(_raiz().rglob("*.part"))


# ── B11: los caracteres invisibles se quitan de los nombres ──────────────────
AVISO = {"code": "nombre_con_caracteres_invisibles", "mensaje": "Se quitaron caracteres invisibles del nombre.", "campo": "nombre"}


@pytest.mark.parametrize("invisible", ["\u202e", "\u200b", "\x07"], ids=["U+202E", "U+200B", "U+0007"])
def test_el_nombre_de_un_documento_pierde_los_invisibles_y_avisa(client, categorias, invisible):
    hid = _hce(client)
    r = _subir(client, hid, categorias[INFORME], nombre=f"cod{invisible}.pdf")
    assert r.status_code == 201, r.text
    assert r.json()["data"]["nombre"] == "cod.pdf" and r.json()["warnings"] == [AVISO]
    # el caso que pasa: un nombre limpio no avisa y no cambia
    limpio = _subir(client, hid, categorias[INFORME], nombre="Informe — año 2º ñandú 🙂")
    assert limpio.status_code == 201 and limpio.json()["data"]["nombre"] == "Informe — año 2º ñandú 🙂"
    assert limpio.json()["warnings"] == []


@pytest.mark.parametrize("invisible", ["\u202e", "\u200b"], ids=["U+202E", "U+200B"])
def test_el_nombre_derivado_del_archivo_tambien_los_pierde(client, categorias, invisible):
    hid = _hce(client)
    r = _subir(client, hid, categorias[INFORME], nombre_archivo=f"informe{invisible}.pdf")
    assert r.status_code == 201, r.text
    assert r.json()["data"]["nombre"] == "informe.pdf" and r.json()["warnings"] == [AVISO]
    sin = _subir(client, hid, categorias[INFORME], nombre_archivo="informe.pdf")
    assert sin.json()["data"]["nombre"] == "informe.pdf" and sin.json()["warnings"] == []


def test_un_nombre_hecho_solo_de_invisibles_es_el_422_es_obligatorio_y_con_texto_pasa(client, categorias):
    hid = _hce(client)
    r = _subir(client, hid, categorias[INFORME], nombre="\u202e\u200b\x07")
    assert r.status_code == 422
    [d] = r.json()["detail"]
    assert d["campo"] == "nombre" and d["mensaje"].startswith("Es obligatorio")
    assert _sin_nada_en_disco()          # se valida antes de tocar el disco
    # derivado del archivo: sólo invisibles → el mismo 422
    r = _subir(client, hid, categorias[INFORME], nombre_archivo="\u202e\u200b")
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "nombre"
    assert _subir(client, hid, categorias[INFORME], nombre="x").status_code == 201


def test_editar_el_nombre_de_un_documento_quita_los_invisibles_y_avisa(client, categorias):
    hid = _hce(client)
    doc = _subir(client, hid, categorias[INFORME]).json()["data"]
    r = client.patch(f"/hce/{hid}/documentos/{doc['id']}", json={"nombre": "nuevo\u202e\u200b\x07"})
    assert r.status_code == 200, r.text
    assert r.json()["data"]["nombre"] == "nuevo" and r.json()["warnings"] == [AVISO]
    r = client.patch(f"/hce/{hid}/documentos/{doc['id']}", json={"nombre": "otro"})
    assert r.json()["data"]["nombre"] == "otro" and r.json()["warnings"] == []
    r = client.patch(f"/hce/{hid}/documentos/{doc['id']}", json={"nombre": "\u202e\u200b"})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "nombre"


@pytest.mark.parametrize("invisible", ["\u202e", "\u200b", "\x07"], ids=["U+202E", "U+200B", "U+0007"])
def test_la_descripcion_de_una_foto_pierde_los_invisibles_pero_conserva_los_saltos_de_linea(client, invisible):
    """La foto no guarda ningún nombre (el del archivo se descarta): lo que escribe quien sube es la descripción."""
    hid = _hce(client)
    r = _subir_foto(client, f"/hce/{hid}/fotos", descripcion=f"Taller{invisible}\nde juego\tlibre")
    assert r.status_code == 201, r.text
    assert r.json()["data"]["descripcion"] == "Taller\nde juego\tlibre"
    assert r.json()["warnings"] == [{**AVISO, "campo": "descripcion"}]
    limpia = _subir_foto(client, f"/hce/{hid}/fotos", descripcion="Taller\nde juego")
    assert limpia.json()["data"]["descripcion"] == "Taller\nde juego" and limpia.json()["warnings"] == []


def test_el_documento_de_un_ateneo_pierde_los_invisibles_y_avisa(client, categorias, hoy):
    ateneo = client.post("/ateneos", json={"tipo": "institucional", "fecha": "2026-09-18", "titulo": "Análisis"}).json()["data"]
    ruta = f"/ateneos/{ateneo['id']}/documentos"
    r = client.post(ruta, files={"archivo": ("acta.pdf", PDF, "application/pdf")}, data={"categoria_id": str(categorias["Otro"]), "nombre": "acta\u202e\u200b\x07"})
    assert r.status_code == 201, r.text
    assert r.json()["data"]["nombre"] == "acta" and r.json()["warnings"] == [AVISO]
    r = client.post(ruta, files={"archivo": ("acta\u202e.pdf", PDF, "application/pdf")}, data={"categoria_id": str(categorias["Otro"])})
    assert r.json()["data"]["nombre"] == "acta.pdf" and r.json()["warnings"] == [AVISO]
    r = client.post(ruta, files={"archivo": ("acta.pdf", PDF, "application/pdf")}, data={"categoria_id": str(categorias["Otro"]), "nombre": "limpio"})
    assert r.status_code == 201 and r.json()["warnings"] == []
    r = client.post(ruta, files={"archivo": ("acta.pdf", PDF, "application/pdf")}, data={"categoria_id": str(categorias["Otro"]), "nombre": "\u202e\u200b"})
    assert r.status_code == 422 and r.json()["detail"][0]["campo"] == "nombre"
