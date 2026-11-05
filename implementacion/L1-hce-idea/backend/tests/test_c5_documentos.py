"""C5 · HCE-DOC: `GET /documentos/categorias`, `/hce/{id}/documentos` (alta multipart, lista, metadatos, descarga) y
`/hce/{id}/autorizacion-imagen`.

Convención del repo: todo rechazo va emparejado con el caso que pasa. Los casos de seguridad de §5.155 (a)–(b) y (f)
son tests de aceptación: el tipo sale del contenido, el nombre del cliente nunca llega al disco, todo queda dentro de
la raíz, la descarga es un adjunto sin *sniffing* ni caché, y un request que falla no deja archivos huérfanos. La
carpeta de archivos es temporal en cada test (`carpeta_uploads`, conftest).
"""
import json
import re
from datetime import date
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core import config
from app.core.constantes import ARCHIVO_TAMANO_MAXIMO
from app.main import app
from app.models.catalogos import CategoriaDocumento
from app.models.transversales import Auditoria, AutorizacionImagen, Documento
from app.services import documentos as servicio_doc
from app.services import fechas
from test_m11_3b_idea_flujo import _hce  # noqa: F401  (ayuda)

HOY = date(2026, 11, 5)
CATALOGO = json.loads(
    (Path(__file__).resolve().parents[1] / "app" / "data" / "catalogos_iniciales.json").read_text(encoding="utf-8")
)["categoria_documento"]
INFORME, HISTORICO, AUTORIZACION, OTRO = (
    "Informe escolar", "Registro histórico — HCE anterior (Evaluación General)", "Autorización / consentimiento", "Otro",
)
#: Contenidos mínimos: lo único que mira el servidor son los primeros bytes (§5.155 b).
PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
HTML = b"<!doctype html><html><body><script>alert(1)</script></body></html>"
SVG = b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
REF = re.compile(r"^hce/\d+/[0-9a-f]{32}\.(pdf|jpg|png)$")


@pytest.fixture
def categorias(db_api):
    for fila in CATALOGO:
        db_api.add(CategoriaDocumento(**fila))
    db_api.commit()
    return {c.nombre: c.id for c in db_api.scalars(select(CategoriaDocumento))}


@pytest.fixture
def hoy(monkeypatch):
    monkeypatch.setattr(fechas, "hoy", lambda: HOY)
    return HOY


def _subir(client, hid: int, cat: int, contenido: bytes = PDF, nombre_archivo: str = "informe.pdf", ctype: str = "application/pdf",
           headers=None, **campos):
    datos = {"categoria_id": str(cat), **{k: v for k, v in campos.items() if v is not None}}
    return client.post(f"/hce/{hid}/documentos", files={"archivo": (nombre_archivo, contenido, ctype)}, data=datos, headers=headers)


def _doc(client, hid: int, cat: int, **kw) -> dict:
    r = _subir(client, hid, cat, **kw)
    assert r.status_code == 201, r.text
    return r.json()["data"]


def _raiz() -> Path:
    return config.raiz_de_archivos()


def _archivos() -> list[Path]:
    raiz = _raiz()
    return sorted(p for p in raiz.rglob("*") if p.is_file()) if raiz.exists() else []


def _ref(db_api, doc_id: int) -> str:
    db_api.expire_all()
    return db_api.scalar(select(Documento.archivo_ref).where(Documento.id == doc_id))


def _filas(db_api, hid: int, **filtro) -> list[Auditoria]:
    db_api.expire_all()
    q = select(Auditoria).where(Auditoria.hce_id == hid, Auditoria.modulo == "HCE-DOC")
    for k, v in filtro.items():
        q = q.where(getattr(Auditoria, k) == v)
    return list(db_api.scalars(q.order_by(Auditoria.id)))


def _campos(r) -> list[str | None]:
    return [d["campo"] for d in r.json()["detail"]]


# ── Raíz de archivos ─────────────────────────────────────────────────────────
def test_la_raiz_es_uploads_dir_mas_el_nombre_de_la_base_y_pytest_usa_una_temporal(carpeta_uploads, monkeypatch):
    base = config.make_url(config.settings.database_url).database
    assert _raiz() == (carpeta_uploads / base).resolve()
    # Por omisión, `uploads` relativo a la carpeta del backend (no al directorio de trabajo).
    monkeypatch.setattr(config.settings, "uploads_dir", "uploads")
    assert config.raiz_de_archivos() == (config.BACKEND_DIR / "uploads" / base).resolve()
    assert config.BACKEND_DIR.name == "backend" and (config.BACKEND_DIR / "app").is_dir()


@pytest.mark.parametrize("url", ["postgresql+psycopg://u:p@h:1/..", "postgresql+psycopg://u:p@h:1/a%2Fb"])
def test_un_nombre_de_base_que_no_sirve_de_carpeta_aborta(monkeypatch, url):
    monkeypatch.setattr(config.settings, "database_url", url)
    with pytest.raises(RuntimeError):
        config.raiz_de_archivos()
    monkeypatch.setattr(config.settings, "database_url", "postgresql+psycopg://u:p@h:1/ippu_ver")
    assert config.raiz_de_archivos().name == "ippu_ver"


# ── Categorías ───────────────────────────────────────────────────────────────
def test_las_categorias_son_las_12_en_orden_con_las_4_historicas(client, categorias, crear_profesional, token_de, hash_test):
    r = client.get("/documentos/categorias")
    assert r.status_code == 200 and "X-Total-Count" not in r.headers
    filas = r.json()
    assert [c["nombre"] for c in filas] == [c["nombre"] for c in sorted(CATALOGO, key=lambda c: c["orden"])]
    assert sum(c["es_registro_historico"] for c in filas) == 4
    assert all(c["nombre"].startswith("Registro histórico") == c["es_registro_historico"] for c in filas)
    tecnico = crear_profesional(nombre="Tina", hashed_password=hash_test)
    assert client.get("/documentos/categorias", headers=token_de(tecnico)).status_code == 200
    assert TestClient(app).get("/documentos/categorias").status_code == 401


# ── Alta: camino feliz ───────────────────────────────────────────────────────
def test_cargar_un_pdf_y_leerlo_en_la_lista(client, categorias, hoy):
    hid = _hce(client)
    r = _subir(client, hid, categorias[INFORME], nombre="  Informe escolar 1.er semestre  ", fecha_original="2026-07-10")
    assert r.status_code == 201, r.text
    assert r.json()["warnings"] == []
    d = r.json()["data"]
    assert (d["nombre"], d["categoria"], d["fecha_original"], d["fecha_carga"]) == (
        "Informe escolar 1.er semestre", {"id": categorias[INFORME], "nombre": INFORME}, "2026-07-10", HOY.isoformat())
    assert (d["tipo"], d["tamano_bytes"], d["tiene_archivo"], d["es_registro_historico"]) == ("pdf", len(PDF), True, False)
    lista = client.get(f"/hce/{hid}/documentos")
    assert lista.status_code == 200 and lista.headers["X-Total-Count"] == "1" and lista.json() == [d]
    assert client.get(f"/hce/{hid}/documentos/{d['id']}").json() == d


def test_sin_nombre_la_etiqueta_es_el_basename_del_archivo_y_con_nombre_el_texto(client, categorias, hoy):
    hid = _hce(client)
    assert _doc(client, hid, categorias[OTRO], nombre_archivo="C:\\Users\\x\\Desktop\\estudio.pdf")["nombre"] == "estudio.pdf"
    assert _doc(client, hid, categorias[OTRO], nombre_archivo="estudio.pdf", nombre="   ")["nombre"] == "estudio.pdf"
    assert _doc(client, hid, categorias[OTRO], nombre_archivo="estudio.pdf", nombre="Estudio auditivo")["nombre"] == "Estudio auditivo"
    largo = _doc(client, hid, categorias[OTRO], nombre_archivo="a" * 300 + ".pdf")["nombre"]
    assert len(largo) == 200  # el del archivo se recorta; el escrito, no (ver abajo)


def test_un_nombre_escrito_de_mas_de_200_es_422_y_de_200_pasa(client, categorias, hoy):
    hid = _hce(client)
    r = _subir(client, hid, categorias[OTRO], nombre="x" * 201)
    assert r.status_code == 422 and _campos(r) == ["nombre"]
    assert _archivos() == []  # se valida antes de tocar el disco
    assert _doc(client, hid, categorias[OTRO], nombre="x" * 200)["nombre"] == "x" * 200


def test_la_historica_se_deriva_de_la_categoria(client, categorias, hoy):
    hid = _hce(client)
    assert _doc(client, hid, categorias[HISTORICO])["es_registro_historico"] is True
    assert _doc(client, hid, categorias[INFORME])["es_registro_historico"] is False


def test_categoria_inexistente_o_ausente_es_422_y_una_valida_pasa(client, categorias, hoy):
    hid = _hce(client)
    assert _campos(_subir(client, hid, 987654)) == ["categoria_id"]
    r = client.post(f"/hce/{hid}/documentos", files={"archivo": ("a.pdf", PDF, "application/pdf")})
    assert r.status_code == 422 and _campos(r) == ["categoria_id"]
    assert _archivos() == []
    assert _subir(client, hid, categorias[INFORME]).status_code == 201


@pytest.mark.parametrize("intruso", ["es_registro_historico", "fecha_carga", "archivo_ref", "hce_id"])
def test_un_campo_de_formulario_que_el_alta_no_recibe_es_422_y_sin_el_pasa(client, categorias, hoy, intruso):
    hid = _hce(client)
    r = _subir(client, hid, categorias[INFORME], **{intruso: "true"})
    assert r.status_code == 422 and _campos(r) == [intruso]
    assert _archivos() == []
    assert _subir(client, hid, categorias[INFORME]).status_code == 201


def test_sin_archivo_es_422_en_archivo(client, categorias):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/documentos", data={"categoria_id": str(categorias[INFORME])})
    assert r.status_code == 422 and _campos(r) == ["archivo"]


def test_la_lista_va_del_mas_nuevo_al_mas_viejo_y_pagina(client, categorias, monkeypatch):
    hid = _hce(client)
    ids = []
    for dia in (3, 1, 3, 2):
        monkeypatch.setattr(fechas, "hoy", lambda d=dia: date(2026, 11, d))
        ids.append(_doc(client, hid, categorias[OTRO])["id"])
    esperado = [ids[2], ids[0], ids[3], ids[1]]  # fecha_carga desc, después id desc
    r = client.get(f"/hce/{hid}/documentos")
    assert [d["id"] for d in r.json()] == esperado and r.headers["X-Total-Count"] == "4"
    r = client.get(f"/hce/{hid}/documentos", params={"limit": 2, "offset": 2})
    assert [d["id"] for d in r.json()] == esperado[2:] and r.headers["X-Total-Count"] == "4"


# ── Seguridad del archivo (§5.155 a–b): aceptación ───────────────────────────
def test_un_pdf_renombrado_png_se_guarda_como_pdf(client, db_api, categorias, hoy):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME], contenido=PDF, nombre_archivo="foto.png", ctype="image/png")
    assert d["tipo"] == "pdf" and _ref(db_api, d["id"]).endswith(".pdf")


def test_un_jpeg_con_content_type_pdf_se_guarda_como_jpg(client, db_api, categorias, hoy):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME], contenido=JPEG, nombre_archivo="informe.pdf", ctype="application/pdf")
    assert d["tipo"] == "jpg" and _ref(db_api, d["id"]).endswith(".jpg")
    r = client.get(f"/hce/{hid}/documentos/{d['id']}/archivo")
    assert r.headers["content-type"] == "image/jpeg"


@pytest.mark.parametrize("contenido, nombre_archivo, ctype", [
    (HTML, "informe.pdf", "application/pdf"),
    (SVG, "imagen.svg", "image/svg+xml"),
    (SVG, "imagen.png", "image/png"),
    (b"GIF89a" + b"\x00" * 20, "a.gif", "image/gif"),
    (b"%PD", "corto.pdf", "application/pdf"),  # menos bytes que una firma
])
def test_html_svg_u_otro_contenido_es_422_en_archivo_y_no_deja_nada(client, db_api, categorias, hoy, contenido, nombre_archivo, ctype):
    hid = _hce(client)
    r = _subir(client, hid, categorias[INFORME], contenido=contenido, nombre_archivo=nombre_archivo, ctype=ctype)
    assert r.status_code == 422 and r.json()["code"] == "validation_error" and _campos(r) == ["archivo"]
    assert _archivos() == []  # ni el archivo ni el temporal
    db_api.expire_all()
    assert db_api.scalar(select(func.count()).select_from(Documento).where(Documento.hce_id == hid)) == 0
    assert _subir(client, hid, categorias[INFORME]).status_code == 201


def test_un_archivo_vacio_es_422_en_archivo_y_uno_con_contenido_pasa(client, categorias, hoy):
    hid = _hce(client)
    r = _subir(client, hid, categorias[INFORME], contenido=b"")
    assert r.status_code == 422 and _campos(r) == ["archivo"] and _archivos() == []
    assert _subir(client, hid, categorias[INFORME]).status_code == 201


def test_exactamente_10_mb_pasa_y_un_byte_mas_es_413(client, categorias, hoy):
    hid = _hce(client)
    assert ARCHIVO_TAMANO_MAXIMO == 10 * 1024 * 1024
    justo = PDF + b"0" * (ARCHIVO_TAMANO_MAXIMO - len(PDF))
    d = _doc(client, hid, categorias[INFORME], contenido=justo)
    assert d["tamano_bytes"] == ARCHIVO_TAMANO_MAXIMO
    antes = _archivos()
    r = _subir(client, hid, categorias[INFORME], contenido=justo + b"0")
    assert r.status_code == 413, r.text
    assert r.json()["code"] == "too_large" and _campos(r) == ["archivo"] and "10 MB" in r.json()["detail"][0]["mensaje"]
    assert _archivos() == antes  # el temporal a medias se borró
    assert client.get(f"/hce/{hid}/documentos").headers["X-Total-Count"] == "1"


@pytest.mark.parametrize("nombre_archivo", [
    "../../../etc/passwd.pdf", "..\\..\\Windows\\win.ini.pdf", "/abs/ruta/y.pdf", "C:\\Windows\\System32\\x.pdf", "..",
    "a/../../b.pdf", "ñandú «x».pdf",
])
def test_el_nombre_del_cliente_nunca_llega_a_la_ruta_y_todo_queda_dentro_de_la_raiz(client, db_api, categorias, hoy, nombre_archivo):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME], nombre_archivo=nombre_archivo, nombre="Etiqueta")
    ref = _ref(db_api, d["id"])
    assert REF.match(ref), ref
    assert ref.startswith(f"hce/{hid}/") and "\\" not in ref and ".." not in ref
    ruta = (_raiz() / ref).resolve()
    assert ruta.is_file() and ruta.is_relative_to(_raiz())
    assert _archivos() == [ruta]  # un solo archivo, y es ése


def test_una_ref_con_otra_forma_no_se_lee(client, db_api, categorias, hoy):
    """Defensa en profundidad: si una fila tuviera una `archivo_ref` fuera de la forma del servidor, no se sirve."""
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME])
    afuera = _raiz().parent / "secreto.pdf"
    afuera.write_bytes(PDF)
    db_api.execute(Documento.__table__.update().where(Documento.id == d["id"]).values(archivo_ref="../secreto.pdf"))
    db_api.commit()
    assert client.get(f"/hce/{hid}/documentos/{d['id']}/archivo").status_code == 404
    leido = client.get(f"/hce/{hid}/documentos/{d['id']}").json()
    assert (leido["tiene_archivo"], leido["tipo"], leido["tamano_bytes"]) == (False, None, None)


# ── Descarga (§5.155 f) ──────────────────────────────────────────────────────
def test_la_descarga_es_un_adjunto_sin_sniffing_ni_cache_con_los_mismos_bytes(client, categorias, hoy):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME], nombre="Informe «año» 1.º")
    r = client.get(f"/hce/{hid}/documentos/{d['id']}/archivo")
    assert r.status_code == 200 and r.content == PDF
    assert r.headers["content-type"] == "application/pdf"
    assert r.headers["x-content-type-options"] == "nosniff" and r.headers["cache-control"] == "no-store"
    disp = r.headers["content-disposition"]
    assert disp.startswith("attachment;") and "inline" not in disp
    assert "filename*=UTF-8''Informe%20%C2%ABa%C3%B1o%C2%BB%201.%C2%BA.pdf" in disp
    assert 'filename="Informe _a_o_ 1._.pdf"' in disp  # el respaldo ASCII


def test_la_descarga_no_duplica_la_extension_ni_lleva_barras(client, categorias, hoy):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME], nombre="carpeta/informe.PDF")
    disp = client.get(f"/hce/{hid}/documentos/{d['id']}/archivo").headers["content-disposition"]
    assert "filename*=UTF-8''carpeta_informe.PDF" in disp
    d = _doc(client, hid, categorias[INFORME], contenido=PNG, nombre="escaneo.pdf")  # un PNG que se llama .pdf
    assert "filename*=UTF-8''escaneo.pdf.png" in client.get(f"/hce/{hid}/documentos/{d['id']}/archivo").headers["content-disposition"]


def test_sin_archivo_en_disco_la_descarga_es_404_y_la_lista_lo_dice(client, categorias, hoy, db_api):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME])
    (_raiz() / _ref(db_api, d["id"])).unlink()
    assert client.get(f"/hce/{hid}/documentos/{d['id']}/archivo").status_code == 404
    fila = client.get(f"/hce/{hid}/documentos").json()[0]
    assert (fila["tiene_archivo"], fila["tamano_bytes"], fila["tipo"]) == (False, None, "pdf")


# ── Edición de metadatos ─────────────────────────────────────────────────────
def test_editar_nombre_categoria_y_fecha_de_un_no_historico(client, categorias, hoy):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME], fecha_original="2026-07-10")
    r = client.patch(f"/hce/{hid}/documentos/{d['id']}", json={"nombre": "  Nuevo nombre ", "categoria_id": categorias[OTRO], "fecha_original": None})
    assert r.status_code == 200 and r.json()["warnings"] == []
    n = r.json()["data"]
    assert (n["nombre"], n["categoria"]["nombre"], n["fecha_original"]) == ("Nuevo nombre", OTRO, None)
    assert (n["tipo"], n["tamano_bytes"], n["fecha_carga"]) == (d["tipo"], d["tamano_bytes"], d["fecha_carga"])  # el archivo no cambia
    assert client.get(f"/hce/{hid}/documentos/{d['id']}").json() == n


def test_un_historico_es_inmutable_409_y_un_no_historico_se_edita(client, categorias, hoy, db_api):
    hid = _hce(client)
    hist = _doc(client, hid, categorias[HISTORICO], fecha_original="2024-11-20")
    for cuerpo in ({"nombre": "Otro"}, {"fecha_original": None}, {"categoria_id": categorias[OTRO]}, {}):
        r = client.patch(f"/hce/{hid}/documentos/{hist['id']}", json=cuerpo)
        assert r.status_code == 409 and r.json()["code"] == "conflict", cuerpo
    assert client.get(f"/hce/{hid}/documentos/{hist['id']}").json() == hist
    assert _filas(db_api, hid, tipo="edicion") == []
    comun = _doc(client, hid, categorias[INFORME])
    assert client.patch(f"/hce/{hid}/documentos/{comun['id']}", json={"nombre": "Otro"}).status_code == 200


def test_pasar_a_una_categoria_historica_es_422_y_a_una_comun_pasa(client, categorias, hoy):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME])
    r = client.patch(f"/hce/{hid}/documentos/{d['id']}", json={"categoria_id": categorias[HISTORICO]})
    assert r.status_code == 422 and _campos(r) == ["categoria_id"]
    assert client.get(f"/hce/{hid}/documentos/{d['id']}").json()["es_registro_historico"] is False
    assert client.patch(f"/hce/{hid}/documentos/{d['id']}", json={"categoria_id": categorias[AUTORIZACION]}).status_code == 200


@pytest.mark.parametrize("cuerpo, campo", [
    ({"nombre": None}, "nombre"), ({"nombre": "  \t "}, "nombre"), ({"nombre": "x" * 201}, "nombre"),
    ({"categoria_id": None}, "categoria_id"), ({"categoria_id": 987654}, "categoria_id"),
    ({"es_registro_historico": True}, "es_registro_historico"), ({"fecha_carga": "2026-01-01"}, "fecha_carga"),
    ({"archivo_ref": "hce/1/x.pdf"}, "archivo_ref"),
])
def test_un_patch_invalido_es_422_por_campo_y_el_valido_pasa(client, categorias, hoy, cuerpo, campo):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME])
    r = client.patch(f"/hce/{hid}/documentos/{d['id']}", json=cuerpo)
    assert r.status_code == 422 and _campos(r) == [campo], r.text
    assert client.get(f"/hce/{hid}/documentos/{d['id']}").json() == d
    assert client.patch(f"/hce/{hid}/documentos/{d['id']}", json={"nombre": "x" * 200}).status_code == 200


def test_delete_de_un_documento_es_405(client, categorias, hoy):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME])
    for ruta in (f"/hce/{hid}/documentos/{d['id']}", f"/hce/{hid}/documentos/{d['id']}/archivo", f"/hce/{hid}/documentos"):
        assert client.delete(ruta).status_code == 405, ruta
    assert client.put(f"/hce/{hid}/documentos/{d['id']}", json={"nombre": "x"}).status_code == 405
    assert client.get(f"/hce/{hid}/documentos/{d['id']}").status_code == 200


def test_un_documento_de_otro_expediente_es_404_por_este_expediente(client, categorias, hoy):
    h1, h2 = _hce(client), _hce(client)
    d = _doc(client, h2, categorias[INFORME])
    for metodo, ruta, cuerpo in (("GET", "", None), ("PATCH", "", {"nombre": "x"}), ("GET", "/archivo", None)):
        r = client.request(metodo, f"/hce/{h1}/documentos/{d['id']}{ruta}", json=cuerpo)
        assert r.status_code == 404 and r.json()["code"] == "not_found", (metodo, ruta)
        assert client.request(metodo, f"/hce/{h2}/documentos/{d['id']}{ruta}", json=cuerpo).status_code == 200
    assert client.get(f"/hce/{h1}/documentos").json() == []


# ── Auditoría ────────────────────────────────────────────────────────────────
def test_la_carga_deja_una_fila_sin_nombre_ni_archivo_ni_id(client, db_api, admin, categorias, hoy):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME], nombre="Nombre-Secreto", nombre_archivo="archivo-secreto.pdf")
    h = _doc(client, hid, categorias[HISTORICO], nombre="Otro-Secreto")
    filas = _filas(db_api, hid, tipo="carga")
    assert len(filas) == 2 and all(f.usuario_id == admin.id and f.campo is None for f in filas)
    assert INFORME in filas[0].detalle and HOY.isoformat() in filas[0].detalle
    assert filas[1].detalle.startswith("Registro histórico cargado")
    for f in filas:
        assert not any(x in f.detalle for x in ("Secreto", "secreto", ".pdf", str(d["id"]) + " ", f"documento {d['id']}", f"documento {h['id']}"))
        assert not re.search(r"expediente \d+", f.detalle)


def test_cada_campo_editado_deja_su_fila_legible_y_sin_cambios_ninguna(client, db_api, categorias, hoy):
    hid = _hce(client)
    d = _doc(client, hid, categorias[INFORME], nombre="Antes", fecha_original="2026-07-10")
    client.patch(f"/hce/{hid}/documentos/{d['id']}", json={"nombre": "Antes", "fecha_original": "2026-07-10"})
    assert _filas(db_api, hid, tipo="edicion") == []
    client.patch(f"/hce/{hid}/documentos/{d['id']}", json={"nombre": "Después", "categoria_id": categorias[OTRO], "fecha_original": None})
    filas = {f.campo: f for f in _filas(db_api, hid, tipo="edicion")}
    assert set(filas) == {"nombre", "categoria_id", "fecha_original"}
    assert (filas["nombre"].valor_ant, filas["nombre"].valor_nuevo) == ("Antes", "Después")
    assert (filas["categoria_id"].valor_ant, filas["categoria_id"].valor_nuevo) == (INFORME, OTRO)
    assert (filas["fecha_original"].valor_ant, filas["fecha_original"].valor_nuevo) == ("2026-07-10", None)
    assert all(f.detalle and INFORME in f.detalle and "Antes" not in f.detalle and "Después" not in f.detalle for f in filas.values())
    log = client.get(f"/hce/{hid}/auditoria", params={"modulo": "HCE-DOC"}).json()
    assert {f["campo"] for f in log if f["tipo"] == "edicion"} == {"nombre", "categoria_id", "fecha_original"}


def test_un_rechazo_no_escribe_auditoria_ni_archivos(client, db_api, categorias, hoy):
    hid = _hce(client)
    _subir(client, hid, categorias[INFORME], contenido=HTML)
    _subir(client, hid, 987654)
    assert _filas(db_api, hid) == [] and _archivos() == []


# ── Un request que falla no deja archivos huérfanos ──────────────────────────
def test_si_falla_despues_de_escribir_el_archivo_se_borra(client, db_api, categorias, hoy, monkeypatch):
    hid = _hce(client)

    def _falla(*_a, **_k):
        raise RuntimeError("falla simulada después de guardar el archivo")

    original = servicio_doc.registrar_carga
    monkeypatch.setattr(servicio_doc, "registrar_carga", _falla)
    r = client.post(f"/hce/{hid}/documentos", files={"archivo": ("a.pdf", PDF, "application/pdf")},
                    data={"categoria_id": str(categorias[INFORME])})
    assert r.status_code == 500 and r.json()["code"] == "internal_error"
    assert _archivos() == []
    db_api.expire_all()
    assert db_api.scalar(select(func.count()).select_from(Documento).where(Documento.hce_id == hid)) == 0
    monkeypatch.setattr(servicio_doc, "registrar_carga", original)
    assert _subir(client, hid, categorias[INFORME]).status_code == 201 and len(_archivos()) == 1


def test_si_el_commit_falla_el_archivo_se_borra(client, db_api, categorias, hoy, monkeypatch):
    hid = _hce(client)
    original = Session.commit

    def _commit_que_falla(self):
        if self.info.get("archivos_nuevos"):          # la sesión del request que acaba de guardar un archivo
            raise RuntimeError("commit fallido simulado")
        return original(self)

    monkeypatch.setattr(Session, "commit", _commit_que_falla)
    r = _subir(client, hid, categorias[INFORME])
    assert r.status_code == 500
    assert _archivos() == []
    monkeypatch.setattr(Session, "commit", original)
    assert _subir(client, hid, categorias[INFORME]).status_code == 201 and len(_archivos()) == 1


# ── Autorización de uso de imagen ────────────────────────────────────────────
def test_sin_autorizacion_el_get_es_404_y_registrada_200(client, categorias, hoy):
    hid = _hce(client)
    r = client.get(f"/hce/{hid}/autorizacion-imagen")
    assert r.status_code == 404 and r.json()["code"] == "not_found"
    assert client.post(f"/hce/{hid}/autorizacion-imagen", json={"registrada": True}).status_code == 201
    assert client.get(f"/hce/{hid}/autorizacion-imagen").status_code == 200


def test_registrar_la_autorizacion_con_un_documento_del_expediente(client, db_api, admin, categorias, hoy):
    hid = _hce(client)
    doc = _doc(client, hid, categorias[AUTORIZACION], nombre="Autorización firmada")
    r = client.post(f"/hce/{hid}/autorizacion-imagen", json={"registrada": True, "fecha": "2026-03-02", "documento_id": doc["id"]})
    assert r.status_code == 201 and r.json()["warnings"] == []
    assert r.json()["data"] == {"registrada": True, "fecha": "2026-03-02", "documento_id": doc["id"],
                                "documento": {"id": doc["id"], "nombre": "Autorización firmada", "categoria": AUTORIZACION}}
    assert client.get(f"/hce/{hid}/autorizacion-imagen").json() == r.json()["data"]
    carga = _filas(db_api, hid, tipo="carga")[-1]
    assert carga.detalle == "Alta del registro de la autorización de uso de imagen" and carga.usuario_id == admin.id


def test_la_autorizacion_dos_veces_es_409_y_la_primera_queda(client, categorias, hoy):
    hid = _hce(client)
    client.post(f"/hce/{hid}/autorizacion-imagen", json={"registrada": True, "fecha": "2026-03-02"})
    r = client.post(f"/hce/{hid}/autorizacion-imagen", json={"registrada": False})
    assert r.status_code == 409 and r.json()["code"] == "conflict"
    assert client.get(f"/hce/{hid}/autorizacion-imagen").json()["registrada"] is True


def test_la_carrera_por_la_autorizacion_es_409_y_no_un_500(client, categorias, hoy, monkeypatch):
    """La verificación previa «no ve» a la otra: la PK(hce_id) es la última defensa."""
    hid = _hce(client)
    client.post(f"/hce/{hid}/autorizacion-imagen", json={"registrada": True})
    original = Session.get

    def _no_la_ve(self, entidad, ident, **kw):
        return None if entidad is AutorizacionImagen else original(self, entidad, ident, **kw)

    monkeypatch.setattr(Session, "get", _no_la_ve)
    r = client.post(f"/hce/{hid}/autorizacion-imagen", json={"registrada": False})
    assert r.status_code == 409 and r.json()["code"] == "conflict"


def test_un_documento_de_otro_expediente_en_la_autorizacion_es_422_y_uno_propio_pasa(client, categorias, hoy):
    h1, h2 = _hce(client), _hce(client)
    ajeno, propio = _doc(client, h2, categorias[AUTORIZACION], nombre="Ajeno"), _doc(client, h1, categorias[AUTORIZACION])
    for cuerpo in ({"registrada": True, "documento_id": ajeno["id"]}, {"registrada": True, "documento_id": 987654}):
        r = client.post(f"/hce/{h1}/autorizacion-imagen", json=cuerpo)
        assert r.status_code == 422 and _campos(r) == ["documento_id"]
        assert "Ajeno" not in r.text
    assert client.get(f"/hce/{h1}/autorizacion-imagen").status_code == 404
    assert client.post(f"/hce/{h1}/autorizacion-imagen", json={"registrada": True, "documento_id": propio["id"]}).status_code == 201
    r = client.patch(f"/hce/{h1}/autorizacion-imagen", json={"documento_id": ajeno["id"]})
    assert r.status_code == 422 and _campos(r) == ["documento_id"]
    assert client.get(f"/hce/{h1}/autorizacion-imagen").json()["documento_id"] == propio["id"]


@pytest.mark.parametrize("cuerpo, campo", [
    ({}, "registrada"), ({"registrada": "true"}, "registrada"), ({"registrada": 1}, "registrada"),
    ({"registrada": True, "firmante": "x"}, "firmante"), ({"registrada": True, "fecha": "no-es-fecha"}, "fecha"),
])
def test_un_alta_invalida_de_la_autorizacion_es_422_por_campo_y_la_valida_pasa(client, categorias, hoy, cuerpo, campo):
    hid = _hce(client)
    r = client.post(f"/hce/{hid}/autorizacion-imagen", json=cuerpo)
    assert r.status_code == 422 and _campos(r) == [campo], r.text
    assert client.post(f"/hce/{hid}/autorizacion-imagen", json={"registrada": False, "fecha": ""}).status_code == 201


def test_editar_la_autorizacion_deja_filas_legibles_y_registrada_null_es_422(client, db_api, categorias, hoy):
    hid = _hce(client)
    doc = _doc(client, hid, categorias[AUTORIZACION], nombre="Copia firmada")
    client.post(f"/hce/{hid}/autorizacion-imagen", json={"registrada": False})
    r = client.patch(f"/hce/{hid}/autorizacion-imagen", json={"registrada": None})
    assert r.status_code == 422 and _campos(r) == ["registrada"]
    r = client.patch(f"/hce/{hid}/autorizacion-imagen", json={"registrada": True, "fecha": "2026-03-02", "documento_id": doc["id"]})
    assert r.status_code == 200 and r.json()["warnings"] == [] and r.json()["data"]["documento"]["nombre"] == "Copia firmada"
    filas = {f.campo: f for f in _filas(db_api, hid, tipo="edicion")}
    assert (filas["registrada"].valor_ant, filas["registrada"].valor_nuevo) == ("No", "Sí")
    assert filas["documento_id"].valor_ant is None and AUTORIZACION in filas["documento_id"].valor_nuevo
    assert "Copia firmada" not in filas["documento_id"].valor_nuevo
    assert client.patch(f"/hce/{hid}/autorizacion-imagen", json={"documento_id": None, "fecha": None}).json()["data"]["documento"] is None
    n = len(_filas(db_api, hid, tipo="edicion"))
    client.patch(f"/hce/{hid}/autorizacion-imagen", json={"registrada": True})
    assert len(_filas(db_api, hid, tipo="edicion")) == n  # nada cambió: ninguna fila


def test_patch_de_la_autorizacion_sin_registrarla_es_404(client, categorias, hoy):
    hid = _hce(client)
    assert client.patch(f"/hce/{hid}/autorizacion-imagen", json={"registrada": True}).status_code == 404
    client.post(f"/hce/{hid}/autorizacion-imagen", json={"registrada": False})
    assert client.patch(f"/hce/{hid}/autorizacion-imagen", json={"registrada": True}).status_code == 200


# ── Acceso ───────────────────────────────────────────────────────────────────
def _alta_en(client, grupo, ci: str) -> int:
    r = client.post("/hce", json={"persona": {"nombre": "A", "apellido": "B", "ci": ci, "fecha_nac": "2016-04-12"}, "grupo_id": grupo.id})
    assert r.status_code == 201, r.text
    return r.json()["data"]["id"]


def test_alcance_propio_ajeno_admin_y_sin_token_en_todas_las_rutas(client, categorias, hoy, crear_grupo, crear_profesional, token_de, hash_test):
    mia = crear_profesional(nombre="Tina", hashed_password=hash_test)
    otra = crear_profesional(nombre="Otra", hashed_password=hash_test)
    propio, ajeno = crear_grupo(nombre="Escolares", tecnico1_id=mia.id), crear_grupo(nombre="Inicial", tecnico2_id=otra.id)
    h_propio, h_ajeno = _alta_en(client, propio, "85001-1"), _alta_en(client, ajeno, "85002-1")
    cab = token_de(mia)
    # Propio: alta, lista, uno, edición, descarga y la autorización completa.
    d = _doc(client, h_propio, categorias[INFORME], headers=cab)
    for metodo, ruta, cuerpo in (
        ("GET", "/documentos", None), ("GET", f"/documentos/{d['id']}", None), ("PATCH", f"/documentos/{d['id']}", {"nombre": "x"}),
        ("GET", f"/documentos/{d['id']}/archivo", None), ("POST", "/autorizacion-imagen", {"registrada": True}),
        ("GET", "/autorizacion-imagen", None), ("PATCH", "/autorizacion-imagen", {"fecha": "2026-01-02"}),
    ):
        r = client.request(metodo, f"/hce/{h_propio}{ruta}", json=cuerpo, headers=cab)
        assert r.status_code in (200, 201), (metodo, ruta, r.text)
    # Ajeno: el admin carga; el técnico recibe 404 en todo (también la descarga) y nada se escribe.
    da = _doc(client, h_ajeno, categorias[INFORME])
    client.post(f"/hce/{h_ajeno}/autorizacion-imagen", json={"registrada": True})
    rutas = [
        ("GET", "/documentos", None), ("GET", f"/documentos/{da['id']}", None), ("PATCH", f"/documentos/{da['id']}", {"nombre": "x"}),
        ("GET", f"/documentos/{da['id']}/archivo", None), ("POST", "/autorizacion-imagen", {"registrada": False}),
        ("GET", "/autorizacion-imagen", None), ("PATCH", "/autorizacion-imagen", {"registrada": False}),
    ]
    for metodo, ruta, cuerpo in rutas:
        r = client.request(metodo, f"/hce/{h_ajeno}{ruta}", json=cuerpo, headers=cab)
        assert r.status_code == 404 and r.json()["code"] == "not_found", (metodo, ruta)
    r = _subir(client, h_ajeno, categorias[INFORME], headers=cab)
    assert r.status_code == 404
    assert client.get(f"/hce/{h_ajeno}/documentos").headers["X-Total-Count"] == "1"
    assert client.get(f"/hce/{h_ajeno}/autorizacion-imagen").json()["registrada"] is True
    # Admin: todo, en el ajeno.
    assert client.get(f"/hce/{h_ajeno}/documentos/{da['id']}/archivo").status_code == 200
    # Sin token: 401 en todas (también la descarga y el alta multipart).
    anonimo = TestClient(app)
    for metodo, ruta, cuerpo in rutas:
        assert anonimo.request(metodo, f"/hce/{h_propio}{ruta}", json=cuerpo).status_code == 401, (metodo, ruta)
    assert anonimo.post(f"/hce/{h_propio}/documentos", files={"archivo": ("a.pdf", PDF, "application/pdf")},
                        data={"categoria_id": str(categorias[INFORME])}).status_code == 401


def test_expediente_inexistente_es_404_en_todas_las_rutas(client, categorias):
    for metodo, ruta, cuerpo in (("GET", "/documentos", None), ("GET", "/documentos/1", None), ("PATCH", "/documentos/1", {"nombre": "x"}),
                                 ("GET", "/documentos/1/archivo", None), ("GET", "/autorizacion-imagen", None),
                                 ("POST", "/autorizacion-imagen", {"registrada": True}), ("PATCH", "/autorizacion-imagen", {"registrada": True})):
        r = client.request(metodo, f"/hce/987654{ruta}", json=cuerpo)
        assert r.status_code == 404 and r.json()["code"] == "not_found", (metodo, ruta)
    assert _subir(client, 987654, categorias[INFORME]).status_code == 404
    assert _archivos() == []
