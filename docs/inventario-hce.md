# Inventario de la HCE — lo que existe, medido del código

> **Para qué sirve.** Es la entrada del plan de sesiones hacia la **HCE terminada** (`handoff.md` §5.162 b): dice, módulo por módulo,
> qué hay hoy en el backend y en la demo, qué regla de acceso se cumple, qué deuda está abierta y qué falta. **Se midió del código
> el 2026-11-08, sobre `main` en `f9e3df0`** (rama `higiene-hce-terminada`); no se corrió la API, ni la demo, ni `conectada.js`.
> **Cada cifra tiene su comando en el Apéndice.** Lo que no se verificó dice «no verificado».
> No es una norma ni una decisión: describe. Cambia con el código; las cifras vivas las lleva la cabecera de `handoff.md` y las mide
> `python herramientas/verificar_estado.py --check`.

## 0. Cifras de conjunto

| Qué | Valor | Comando |
|---|--:|---|
| Tablas (clases con `__tablename__`) | 51 | A1 |
| Migración (head) | `dcc838486407`, un solo head | A1 |
| Rutas de la API (por método) | 89 de negocio + 5 de infraestructura (`/health`, `/docs`, `/docs/oauth2-redirect`, `/redoc`, `/openapi.json`) = 94; 52 GET · 27 POST · 15 PATCH · **ningún PUT ni DELETE** | A2 |
| Routers con rutas (módulos Python) | 16 | A2 |
| Tests recolectados | 1342 en 35 archivos | A3 |
| Demo: módulos JS | 21 (más `index.html`) | C1 |
| Demo: líneas de JS | 8563 | C1 |
| `conectada.js`: llamadas a `check(` con id | 306 (el reporte de la última corrida, §5.161, dice 310/310 resultados porque algunas están en bucles; **no se re-corrió**) | C2 |

## 1. (a) Módulos funcionales

Dos tablas con las mismas filas, en el mismo orden. **Pantalla:** *conectada* = habla con la API; *demostración* = datos de ejemplo,
«Modo demostración — no se guarda»; *ninguna* = no hay pantalla. Las columnas «tests» cuentan **archivos propios del módulo**;
hay tests transversales que no se asignan (§1.3). Un mismo archivo puede aparecer en más de una fila (p. ej. `test_m11_3b_idea_flujo.py`); la suma por archivo da el total (§1.3). Una regla de acceso común a todos los módulos clínicos: **todo pide token**
(`app/main.py:80-97`) y un técnico fuera del alcance de un expediente recibe **404** (`app/services/auth.py:78`).

### 1.1 Qué hay

| Módulo | Tablas | Rutas (método y ruta) | Tests (archivo: n) | Pantalla |
|---|---|---|---|---|
| **Persona y HCE-00** | `persona`, `hce_diurna` (+ `persona_servicio` y `servicio`, ver §2) | `GET POST /hce` · `GET PATCH /hce/{id}` (4) | `test_m11_3a_hce.py`: 54 · `test_m11_3d1_login_listado.py`: 28 · `test_front_lecturas.py`: 20 | conectada: listado y búsqueda (`ui-core.js`), alta y edición (`wizard-nna.js`), pestaña «Datos» (`expediente.js`) |
| **CI — consentimiento** | `consentimiento` | `GET POST PATCH /hce/{id}/consentimiento` (3) | en `test_m11_3b_idea_flujo.py`: 61 (con IDEA y flujo) | conectada (pestaña «Consentimiento» y el stepper) |
| **Flujo anual** (estado derivado y avisos) | — (se deriva; sus excepciones van a `auditoria`) | `GET /hce/{id}/flujo` (1) | en `test_m11_3b_idea_flujo.py`: 61 | conectada (estado en las pestañas y el stepper) |
| **LB — IDEA** | `idea` (+ `puntuacion_idea` y los catálogos `idea_*`, `banda_idea`, ver §2) | `GET POST /hce/{id}/idea` · `GET /hce/{id}/idea/vigente` · `GET /hce/{id}/idea/delta` · `GET PATCH /idea/{id}` · `POST /idea/{id}/firmar` · `POST /idea/{id}/addendas` (8) | `test_m11_3b_idea_flujo.py`: 61 · `test_m11_3d1_firmas_vf.py`: 56 (con VF) | conectada (`evaluaciones.js`, pestaña «Línea base») |
| **PA / PB — protocolos** | `protocolo` (+ `puntuacion_protocolo`, `ippu_item`, `delta_interpretacion`) | `GET POST /hce/{id}/protocolo` · `GET PATCH /protocolo/{id}` · `POST /protocolo/{id}/firmar` · `POST /protocolo/{id}/addendas` (6) | `test_m11_3c_protocolo_ic.py`: 34 (con IC) | conectada (`evaluaciones.js`, pestañas «Protocolo A/B») |
| **IC — informe de cierre** | `informe_cierre` | `GET POST /hce/{id}/informe-cierre` · `GET PATCH /informe-cierre/{id}` · `POST …/firmar` · `POST …/addendas` · `POST …/recibi` · `GET …/documento` (8) | `test_m11_3c_protocolo_ic.py`: 34 · `test_m11_3d1_firmas_vf.py`: 56 | conectada (`informe-cierre.js`: documento A4 y recibí) |
| **IC en PDF** | — | `GET /informe-cierre/{id}/documento` da los **datos**; el PDF lo genera **el navegador** (`window.print()`, `informe-cierre.js:691`) | los datos: tests del IC; el PDF: sólo `conectada.js` (lo lee con `pypdf`) | conectada |
| **VF — valoración funcional** | `valoracion_funcional` (+ `baremo_categoria`) | `GET POST PATCH /hce/{id}/valoracion-funcional` (3) | `test_m11_3d1_firmas_vf.py`: 56 | conectada (`hce-doc-org-vf.js`); la «guía para la familia» es de demostración |
| **SEV — severidad DSM-5-TR** | `severidad_dsm` (+ `severidad_nivel`) | `GET /severidad-niveles` · `GET POST PATCH /hce/{id}/severidad` (4) | `test_c2_severidad.py`: 47 · `test_m12_severidad.py`: 31 (esquema) | conectada (`severidad.js`) |
| **ORG — INAU y BPS** | `organismo_inau`, `organismo_bps`, `registro_organismo` | `GET /organismos/opciones` · `GET /hce/{id}/organismos` · `POST PATCH …/inau` · `POST PATCH …/bps` · `GET POST …/registros` (8) | `test_c3_organismos.py`: 96 | conectada (`organismos.js`, con la alerta AYEX) |
| **INC — inclusión** | `inclusion`, `inclusion_bitacora` (+ `estado_inclusion`) | `GET /inclusion/opciones` · `GET /inclusion` · `GET POST PATCH /hce/{id}/inclusion` · `GET POST …/bitacora` (7) | `test_c4_inclusion.py`: 90 · `test_m12_inclusion.py`: 67 (esquema) | conectada (`inclusion.js`: pestaña y vista) |
| **DOC y fotos** | `documento`, `autorizacion_imagen`, `foto` (+ `categoria_documento`) | `GET /documentos/categorias` · `GET POST /hce/{id}/documentos` · `GET PATCH …/{doc}` · `GET …/{doc}/archivo` · `GET POST PATCH /hce/{id}/autorizacion-imagen` · `GET POST /hce/{id}/fotos` · `GET …/{foto}` · `GET …/{foto}/archivo` · `GET POST /grupos/{id}/fotos` · `GET …/{foto}` · `GET …/{foto}/archivo` (17) | `test_c5_documentos.py`: 68 · `test_c5_fotos.py`: 21 · `test_seguridad_limites.py`: 15 (las subidas) | conectada (`documentos.js`; las fotos del grupo en `grupos-usuario.js`) |
| **LOG — auditoría** | `auditoria` | `GET /hce/{id}/auditoria` (1; sólo lectura) | `test_c1_hce_log.py`: 19 · `test_c4_detalle_sin_id.py`: 17 | conectada (`auditoria.js`) |
| **Ateneos y jornadas** | `ateneo`, `ateneo_acuerdo` (+ `documento.ateneo_id`) | `GET POST /ateneos` · `GET /ateneos/opciones` · `GET /ateneos/indicador` · `GET PATCH /ateneos/{id}` · `POST /ateneos/{id}/acuerdos` · `PATCH …/acuerdos/{aid}` · `GET POST …/documentos` · `GET …/documentos/{doc}` · `GET …/documentos/{doc}/archivo` (12) | `test_c6_ateneos.py`: 89 · `test_m12_ateneos.py`: 118 (esquema) | conectada (`ateneos.js`: vista y tarjeta del expediente) |
| **Panel y recordatorios** | — (agregados; lee varias tablas) + `recordatorio` (catálogo) | `GET /panel` · `GET /recordatorios` (2) | `test_c7_panel.py`: 22 · `test_f2_recordatorios.py`: 8 | conectada (`panel.js`, `pendientes.js`); el heatmap de talleres es de demostración |
| **Grupos y profesionales** | `grupo` (+ `profesional`) | `GET /grupos` · `PATCH /grupos/{id}` (sólo `admin`) · `GET /profesionales` (3) | `test_m11_5a_grupos.py`: 17 · `test_m11_3a2_referencias.py`: 8 | conectada (`grupos-usuario.js`: lista, detalle y asignación de técnicos) |
| **Auth y usuarios** | `profesional` | `POST /auth/login` · `GET /auth/yo` (2) | `test_m11_3d1_login_listado.py`: 28 (login y alcance) · `test_seguridad_login.py`: 5 · `test_m11_3d1_fix.py`: 32 (parte) | login conectado; «Perfil de ejemplo» (`view-usuarios`) es de demostración. Usuarios nuevos: sólo por la CLI `app/crear_usuario.py` |
| **PAI** | 8 tablas (`pai`, `pai_objetivo`, `pai_evaluacion_previa`, `pai_equipo`, `pai_coordinacion`, `pai_taller`, `pai_prestacion`, `pai_circuito`) | **ninguna** | `test_m12_pai.py`: 82 (sólo el esquema) | demostración (la pestaña PAI, `expediente.js:35`, `demo: true`) |
| **Divulgación** | `divulgacion` | **ninguna** | `test_m12_divulgacion.py`: 42 (sólo el esquema) | ninguna (la demo no la nombra) |
| **Catálogos de talleres y de centros** | `taller` (14 filas), `catalogo_centro_educativo` (0 filas) | **ninguna** | `test_m12_talleres.py`: 18 (sólo el esquema) | ninguna |
| **Catálogos del IDEA y de la escala IPPU-TEA** | `idea_dimension`, `idea_nivel`, `idea_ficha`, `idea_ejemplo`, `idea_regla`, `ippu_item` | **ninguna**: sólo los siembra `seed_catalogos.py`; la demo lleva su propia copia (`catalogos.js`) | `test_m12_catalogos.py`: 33 | — |
| **Seed y CLI** | — | `app/seed_demo.py` (por la API) · `app/seed_catalogos.py` · `app/crear_usuario.py` | `test_m11_5a_seed_demo.py`: 43 · `test_d0_guardia_destino.py`: 12 | — |

### 1.2 Qué regla, qué deuda, qué falta

«Falta» es lo que separa lo que existe de la HCE terminada (`handoff.md` §5.162 b); no decide cómo se construye.

| Módulo | Regla de acceso o guard que **sí** se cumple hoy | Deuda abierta (referencia a §6) | Qué falta para la HCE terminada |
|---|---|---|---|
| **Persona y HCE-00** | Alcance por grupo (404 fuera); un técnico sólo da de alta en un grupo propio (403); `hc_historico` ≥ 1000 lo asigna el servidor (§5.109); C.I. canónica (§5.110); baja y reingreso con auditoría. Duplicado de C.I. o N.º de HC: 409, **genérico para el técnico** (`routers/hce.py:31`, §5.119 d) | B1 (NUL e ids fuera de rango dan 500) · B5 (decidido, §5.162 i; falta construir) · B8 (C.I. y nombres en la URL de búsqueda) | motivo de acceso al abrir (§5.162 g) · los cinco roles · el aviso de C.I. de §5.162 i · migración de datos (**afuera**) |
| **CI** | El CI **no traba** (§5.94); un módulo sin CI avisa, no bloquea | — | — |
| **Flujo anual** | La secuencia **sólo avisa**: `warnings[]` más una fila `auditoria` `excepcion` (§5.95, §5.116) | — | — |
| **LB — IDEA** | Firmar = bloquear (409); corrección por addenda cuyo autor es el usuario del token (§5.116, §5.119); puntaje único por dimensión (§5.98); banda sólo desde `banda_idea`; el IDEA que rige es el de su año (§5.97) | §7: la API acepta como evaluador a cualquier profesional activo | — |
| **PA / PB** | Igual que LB; Δ sólo dentro del mismo instrumento (§5.36); la alerta sale de `delta_interpretacion` | B1 | — |
| **IC** | Firma con dos profesionales, recibí, datos del documento desde el IC firmado | — | informes con estado de revisión (**afuera**, §5.102) |
| **IC en PDF** | El PDF sale del documento A4 impreso por el navegador | — | — |
| **VF** | Baremo **sólo desde `pct`** (§5.2, §5.118); `pct` nulo es válido; sin sugerencia CIF | «la carrera de la VF» (§6, deuda del bloque A) · cortes del baremo sin confirmar (§7) | los cortes de la autogeneración de VF (IPPU, §5.118) |
| **SEV** | Nada fuera de `services/severidad.py` y `routers/severidad.py` lee la severidad (test estructural); toda edición deja auditoría de campo | «el punto ciego del test estructural de SEV» (§6) | — |
| **ORG** | Auditoría de campo; la alerta AYEX (60 y 30 días) la calcula el servidor | «renombrar `profesional_id` en ORG» (§6; el servicio lo recibe por `profesional_id`, `services/organismos.py:113`, y la columna es `autor_id`) | guards de divulgación para lo que se envía a INAU y BPS (Protocolo §6.3) |
| **INC** | `sensible` **clasifica, no restringe** (§5.39); auditoría de campo; `''` → NULL | — | el tablero del área y la alerta de 60 días (fuente del umbral contradictoria, §5.154); el catálogo de centros |
| **DOC y fotos** | Registro histórico inmutable (409), **sin DELETE** (405), tipo de archivo por contenido, ≤ 10 MB, descarga con `nosniff` y `no-store`; guardar una foto no pide nada (§5.99) | B9 · B10 · B11 | **compartir** y **divulgar**: ningún guard aplica la autorización de imagen (§5.99); borrar documentos (sin decidir) |
| **LOG** | Sólo lectura; una fila por campo que cambió, con el valor anterior y el nuevo (`services/auditoria.py:65`). **Lo lee cualquier usuario con el expediente en su alcance** (`routers/auditoria.py:18`) | B7 (decidido, §5.162 j) | que **sólo lean la auditoría los roles que la necesitan** (§5.162 j); el **registro de accesos con motivo**: el `tipo` `acceso` está en el CHECK (`models/transversales.py:284`) y **nada lo escribe**; auditar lo que no cuelga de un NNA (`hce_id` nulo) para grupos y catálogos |
| **Ateneos** | Ateneo de grupo, institucional y jornada: acceso general; **clínico: sólo el `admin` y los técnicos del grupo del expediente referido**, 404 en el resto (§5.158 a); correlativo con candado; adjuntos con PPTX por contenido | — | `ateneo_participante`: hoy `participantes` es **texto** (`models/ateneo.py:257`) y no da acceso; participantes como usuarios que ven el ateneo y no la HCE (§5.162 h); estado «cumplido» de los acuerdos; qué tipos suma el indicador (IPPU) |
| **Panel y recordatorios** | Agregados del servidor; el `admin` ve la institución y el técnico sus grupos | — | supresión de celdas chicas; la vista de **dirección no técnica** (sólo agregados, §5.162 e); editar recordatorios (administración) |
| **Grupos y profesionales** | `PATCH /grupos/{id}` sólo `admin` (403, `routers/referencias.py:69`); el cambio de técnico deja auditoría | B6 (`GET /grupos` y `GET /profesionales` completos para cualquier técnico, `services/referencias.py:14`) | **crear, renombrar y archivar** grupos (§5.90): no existe endpoint ni pantalla |
| **Auth y usuarios** | JWT de 8 h; login con tiempo parejo; 401 antes de leer el cuerpo (§5.157); dos roles por CHECK (`models/identidad.py:35`): `admin` y `tecnico` | B3 (`jwt.decode` sin exigir `exp`, `core/seguridad.py:76`) · B4 (sin límite de intentos ni revocación; el logout es sólo del cliente) | los **cinco roles** y un rol por usuario (§5.162 d–f) · administración de usuarios (alta, baja, clave) · el usuario `dirección no técnica` |
| **PAI** | **Ninguna**: el esquema existe sin guards | — | servicio, router, pantalla y guards: §IX sólo si el tipo es «Actualización anual» (§5.54), `pai_prestacion` (§5.57), `pai_taller` (§5.104 B3) |
| **Divulgación** | **Ninguna** | — | servicio, router, pantalla y guards: los dos CHECK cruzados fuera de la DDL (`esquema-datos-v2.md` §4), `disociado` ≡ `agregado` (§5.103); la copia a la familia **no** es divulgación aunque el catálogo la ofrece (§5.103) |
| **Catálogos de talleres y de centros** | — | — | administración: alta, orden, orientación a grupos, retiro (§5.90) |
| **Catálogos IDEA e IPPU-TEA** | — | — | decidir si la API los sirve (hoy la demo lleva su copia en `catalogos.js`: es una segunda fuente de los mismos textos); administración |
| **Seed y CLI** | La CLI y el seed no escriben sin `IPPU_SEED_DESTINO` (§5.139) | — | usuarios de ejemplo para los cinco roles |

### 1.3 Tests que no se asignan a un módulo (transversales)

`test_esquema_v2.py`: 22 (restricciones de la base) · `test_m11_3a_cimientos.py`: 25 (servicios, errores, auditoría de campo) ·
`test_m11_3a3_convenciones.py`: 18 · `test_m12_consenso.py`: 22 · `test_dependencias.py`: 2 (versión de `python-multipart`).
Los cinco suman 89, que con los de las tablas anteriores dan 1342 (A3).

## 2. (b) Tablas sin API

Medido buscando la clase del modelo en `app/services`, `app/routers` y `app/schemas` (A4). **Una tabla de «sin API» puede
sembrarse** (`seed_catalogos.py`, `seed_demo.py`); lo que no tiene es ninguna ruta ni servicio que la lea o la escriba.

| Tabla | Archivo del modelo | Observación |
|---|---|---|
| `pai`, `pai_objetivo`, `pai_evaluacion_previa`, `pai_equipo`, `pai_coordinacion`, `pai_taller`, `pai_prestacion`, `pai_circuito` | `models/pai.py` | 8 tablas; nada las usa fuera del esquema y los tests |
| `divulgacion` | `models/divulgacion.py` | sin guards; ni el seed la carga |
| `taller` | `models/catalogos.py` | 14 filas sembradas; el seed de la demo la lee; sin gestión |
| `catalogo_centro_educativo` | `models/inclusion.py` | 0 filas; `inclusion.centro` es texto, no FK (§5.52) |
| `idea_dimension`, `idea_nivel`, `idea_ficha`, `idea_ejemplo`, `idea_regla`, `ippu_item` | `models/catalogos.py` | catálogos del IDEA y de la escala IPPU-TEA, sólo sembrados |
| `servicio`, `persona_servicio` | `models/catalogos.py`, `models/identidad.py` | Atención Diurna es el único servicio en alcance; la tabla N:M no tiene escritor |
| `puntuacion_idea`, `puntuacion_protocolo` | `models/modulos.py` | las puntuaciones independientes de cada técnico: **sin API a propósito** (§5.98; kappa no es calculable) |
| `observacion`, `evento` | `models/transversales.py` | heredadas de la v1 («seguimiento clínico libre» y «altas y bajas»); nada las escribe ni las lee. La baja y el reingreso se auditan en `auditoria`, no en `evento` |

Total: **23** de las 51 tablas no tienen ninguna ruta ni servicio que las toque (A4). Las otras 28 las toca algún servicio o router; entre
ellas, varios catálogos sólo se **leen** (`banda_idea`, `delta_interpretacion`, `baremo_categoria`, `categoria_documento`, `recordatorio`,
`estado_inclusion`, `severidad_nivel`).

## 3. (c) Para la migración a React

### 3.1 Por archivo de la demo, en el orden de carga de `index.html`

`escHtml(` cuenta **las llamadas y la definición** (`utils.js:18` es la definición: 409 llamadas, 410 coincidencias). Las demás
columnas cuentan asignaciones a `.innerHTML` (`=` o `+=`), atributos `onclick=` y otros manejadores en línea (`onchange`, `oninput`,
`onkeydown`, …) dentro de los literales de plantilla, y atributos `style=` en línea (C1).

| # | Archivo | Líneas | `escHtml(` | `.innerHTML =`/`+=` | `onclick=` | otros `on…=` | `style=` |
|--:|---|--:|--:|--:|--:|--:|--:|
| 1 | `utils.js` | 147 | 9 | 2 | 4 | 0 | 0 |
| 2 | `api.js` | 225 | 0 | 0 | 0 | 0 | 0 |
| 3 | `adaptadores.js` | 146 | 0 | 0 | 0 | 0 | 0 |
| 4 | `datos.js` | 162 | 0 | 0 | 0 | 0 | 0 |
| 5 | `flujo.js` | 510 | 0 | 3 | 13 | 0 | 22 |
| 6 | `catalogos.js` | 262 | 0 | 0 | 0 | 0 | 0 |
| 7 | `ui-core.js` | 465 | 5 | 8 | 2 | 0 | 0 |
| 8 | `wizard-nna.js` | 498 | 16 | 11 | 1 | 0 | 0 |
| 9 | `expediente.js` | 634 | 21 | 9 | 11 | 1 | 11 |
| 10 | `evaluaciones.js` | 1052 | 76 | 12 | 13 | 15 | 0 |
| 11 | `informe-cierre.js` | 729 | 46 | 12 | 15 | 5 | 0 |
| 12 | `hce-doc-org-vf.js` | 656 | 47 | 11 | 18 | 6 | 22 |
| 13 | `documentos.js` | 545 | 21 | 4 | 13 | 0 | 0 |
| 14 | `severidad.js` | 207 | 14 | 2 | 5 | 1 | 0 |
| 15 | `organismos.js` | 275 | 14 | 2 | 8 | 0 | 0 |
| 16 | `auditoria.js` | 199 | 12 | 1 | 2 | 2 | 0 |
| 17 | `panel.js` | 208 | 15 | 8 | 2 | 1 | 1 |
| 18 | `pendientes.js` | 141 | 6 | 5 | 3 | 0 | 0 |
| 19 | `grupos-usuario.js` | 309 | 12 | 7 | 5 | 0 | 1 |
| 20 | `inclusion.js` | 473 | 32 | 5 | 14 | 2 | 0 |
| 21 | `ateneos.js` | 720 | 64 | 12 | 18 | 5 | 0 |
| | **Total** | **8563** | **410** | **114** | **147** | **38** | **57** |

`index.html`: 422 líneas, 21 `<script src>`, 17 `onclick=`, 5 manejadores más, 2 `style=`. No se contaron los `addEventListener` ni `insertAdjacentHTML`.
**Lectura:** más de la mitad de la superficie de escape y de manejadores en línea está en cinco archivos (`evaluaciones.js`, `ateneos.js`,
`hce-doc-org-vf.js`, `informe-cierre.js`, `inclusion.js`): 265 de las 410 coincidencias de `escHtml(` y 78 de los 147 `onclick=`.
`api.js`, `adaptadores.js`, `datos.js` y `catalogos.js` no tienen ninguna. `flujo.js` no llama a `escHtml` y tiene 13 `onclick=` y 22 `style=`.

### 3.2 Chequeos de `conectada.js`, por módulo

`conectada.js` tiene 4834 líneas y 306 llamadas a `check(` con id literal, todas con id distinto (C2). El prefijo es la fase que las
escribió; el módulo es el que ejercitan.

| Prefijo | Llamadas | Qué ejercita |
|---|--:|---|
| `3a` | 43 | login, listado, HCE-00 de lectura y el modo demostración |
| `3b` | 32 | HCE-00 editable, alta con asistente, CI y stepper |
| `3c` | 35 | IDEA (LB) y Protocolos A/B |
| `3d` | 40 | IC (documento A4, recibí, PDF) y VF |
| `3e` | 26 | accesibilidad: teclado, foco, diálogos, traducción de errores, estados compartidos |
| `f1`, `f1b`, `f3` | 12 · 2 · 12 | banda del paciente, navegación, tipografía y pasada visual |
| `f2` | 21 | Pendientes y Grupos |
| `c1` · `c2` · `c3` · `c4` · `c5` · `c6` · `c7` | 12 · 12 · 18 · 9 · 11 · 9 · 8 | LOG · SEV · ORG · INC · DOC y fotos · Ateneos · Panel |
| `sec` | 3 | `?api=` sólo local y la sesión atada a su API (§5.157 b) |
| `z` | 1 | cierre (no verificado qué mide) |
| **Total** | **306** | |

El conteo de resultados de una corrida (310) no se pudo medir sin correrla (no verificado en esta sesión).

### 3.3 Selectores que usan los chequeos

Se contó el primer argumento literal de los métodos que reciben un selector (`locator`, `$`, `$$`, `$eval`, `waitForSelector`,
`querySelector`, `click`, `fill`, `press`, `textContent`, `innerText`, …) en `conectada.js` (C2). **Es una medida aproximada:** un
selector armado por plantilla con variables se cuenta por su parte literal, y un literal puede traer varios tipos.

| Qué | Cantidad |
|---|--:|
| Literales de selector | 1448 |
| …que contienen un **id** (`#algo`) | 1067 (74 %) |
| …que contienen una **clase** (`.algo`) | 359 |
| …que contienen un atributo **`data-`** | 104 |
| …que contienen `aria-` o `role` | 48 |
| …con otro atributo (`[tipo=…]`, `[name=…]`) | 54 |
| …sólo una etiqueta | 57 |
| …con texto (`text=`, `:has-text`) | 14 |
| Literales **sólo** de id / **sólo** de clase / **sólo** de `data-` | 721 / 122 / 2 |
| Ids distintos nombrados | 288 |
| `getElementById(` en el código del chequeo | 539 |
| `getByRole`, `getByLabel`, `getByText`, `getByPlaceholder`, `data-testid` | 7 · 0 |

**Lectura:** los chequeos dependen de los ids del HTML que genera la demo (288 ids distintos) casi por completo; ninguno usa
`data-testid`. Una migración a React que no conserve esos ids obliga a reescribir el grueso de `conectada.js`, o a decidir de
antemano que los ids se conservan como contrato de prueba.

## 4. (d) Seguridad

### 4.1 Los hallazgos B1–B17 de la auditoría del 2026-11-05

B2, B14 y B15 se hicieron en §5.157 (e); B1, B3–B13, B16 y B17 siguen abiertos (§5.157, «Fuera, a propósito»). La definición de la HCE
terminada nombra **B1–B11** (§5.162 b); B12, B13, B16 y B17 se ubicaron en §6, «HCE terminada», y el equipo confirma si entran.

| Id | Hallazgo (§6) | Estado hoy | Evidencia en el código | Decisión de §5.162 |
|---|---|---|---|---|
| B1 | NUL en texto o JSONB e ids fuera de int4/int8 dan 500 | **abierto** | no hay manejo de `DataError` en `app/` (la única mención es un docstring, `schemas/hce.py:4`) | — |
| B2 | La sesión dejaba texto de un NNA en el DOM | **hecho** (§5.157 e) | — | — |
| B3 | Un token sin `exp` se acepta | **abierto** | `core/seguridad.py:76`: `jwt.decode(...)` sin `options={"require_exp": True}`; los tokens que emite la app sí traen `exp` (`:70`) | — |
| B4 | Sin límite de intentos de login; tokens de 8 h sin revocación; logout sólo del cliente | **abierto** | no hay limitador, `jti` ni versión de token en `app/` (grep sin coincidencias reales) | — |
| B5 | El 409 del alta con una C.I. de otro grupo revela que existe | **abierto, decidido** | el técnico recibe un 409 genérico (`routers/hce.py:31`), pero sigue siendo un 409 | §5.162 i: avisar «Ya hay un NNA registrado con esa C.I. Consultá con coordinación», sin nombre ni grupo |
| B6 | `GET /grupos` y `GET /profesionales` completos para cualquier técnico | **abierto** | `services/referencias.py:14` filtra por año, no por usuario | — |
| B7 | La auditoría guarda valores completos | **abierto, decidido** | `services/auditoria.py:65-66` guarda `valor_ant` y `valor_nuevo` completos | §5.162 j: se quedan completos; sólo leen los roles que lo necesitan; retención a IPPU; cifrado en reposo es del despliegue |
| B8 | C.I. y nombres en las URLs de búsqueda y en el log; trazas del 500 con parámetros | **abierto** | `hide_parameters` no aparece en `app/` | — |
| B9 | `archivos.guardar` escribe antes de verificar la carpeta (una junction saca el archivo de la raíz) | **abierto** | `services/archivos.py:163-164` crea la carpeta y el temporal; la verificación de raíz llega después (`:195`) | — |
| B10 | Una subida rechazada deja `hce/<id>/` vacía | **abierto** | `services/archivos.py:163` (`mkdir`) | — |
| B11 | Caracteres bidi o de control (categoría Cf) en el nombre de un documento | **abierto** | no hay filtro de categoría Unicode en `services/documentos.py` ni `archivos.py` | — |
| B12 | `/docs`, `/redoc` y `/openapi.json` abiertos | **abierto** | `main.py:42` crea `FastAPI(...)` sin `docs_url=None`; las tres rutas figuran en A2 | — |
| B13 | Sin cabeceras de seguridad en la API ni CSP en la demo; `allow_credentials=True` sin cookies | **abierto** | `main.py:102` (`allow_credentials=True`); sólo las descargas de archivos llevan `nosniff` (`routers/documentos.py:89`) | (c): la CSP estricta es una de las razones de React |
| B14 | La demo se servía en todas las interfaces | **hecho** (§5.157 e) | — | — |
| B15 | `.env` no estaba ignorado en cualquier carpeta | **hecho** (§5.157 e) | — | — |
| B16 | Starlette 0.41.3 y `python-jose` 3.3.0 con avisos de `pip-audit` | **abierto** | `requirements.txt:5` (`fastapi==0.115.6`), `:20` (`python-jose[cryptography]==3.3.0`) | — |
| B17 | Ids y fechas sin `escHtml`; renderizadores de demostración sin escapar | **abierto** | los renderizadores de `flujo.js` y `hce-doc-org-vf.js` (3.1) | (c): el escape por omisión de React |

No se volvió a correr `pip-audit` ni se sondeó la API en esta sesión: las filas B12 a B16 salen del código y del texto de §5.157.

### 4.2 Deuda de la revisión del bloque A (§6)

| Ítem de §6 | Estado hoy | Evidencia |
|---|---|---|
| Los caracteres de ancho cero no cuentan como blanco | **abierto** | no hay tratamiento de U+200B ni afines en `services/texto.py` ni en `schemas/` |
| Mensajes de Pydantic en inglés | **abierto en la API**; la demo traduce los tipos conocidos | `routers/errores.py:78` manda `e["msg"]` tal cual; la demo los traduce (`3e-i18n1` a `3e-i18n4`) |
| El error repetido en `/hce/abc/auditoria` | no verificado (hay que correr la API) | — |
| La carrera de la VF | **abierto** | `services/valoracion_funcional.py:74` toma `FOR UPDATE` sólo de una fila que ya existe; el alta simultánea de la primera VF no está cubierta (no verificado con una corrida) |
| Renombrar `profesional_id` en ORG | **abierto** | `services/organismos.py:113`, `:138`, `:185` (la columna es `autor_id`) |
| Unificar los schemas de autor | **abierto** | hay tres formas: `AutorRef` (`schemas/ateneos.py:139`), `AutorAuditoria` (`schemas/auditoria.py:7`) y `AutorRegistro` (`schemas/organismos.py`) |
| El punto ciego del test estructural de SEV | no verificado | está descrito en §6, no se leyó el test en esta sesión |
| El `escHtml` fuera del bloque A «queda para la auditoría de seguridad» | **abierto**: es B17 | 3.1 |

Además, la pregunta de §7 («¿los evaluadores tienen que ser técnicos del grupo?») sigue sin decidir: la API acepta como evaluador a
cualquier profesional activo.

### 4.3 Lo que la definición pide y hoy no existe

- **Auditoría de seguridad de cierre** (§5.162 b): no hay ninguna planificada.
- **Lectura de la auditoría sólo por los roles que la necesitan** (§5.162 j): hoy la lee cualquier usuario con el expediente en su
  alcance (`routers/auditoria.py:18`).
- **Registro de accesos con motivo** (§5.162 g): ver LOG en 1.2.
- **CSP y cabeceras** (B13) y **límite de intentos** (B4): ver 4.1.

## Apéndice — comandos

Todos se corrieron desde la raíz del repo o desde `implementacion/L1-hce-idea/backend` (indicado) con el intérprete del `.venv` del
backend; ninguno escribe en el repo, en la base ni en la API. Los resultados citados son los de la corrida del 2026-11-08.

**A1 — tablas y migración**
```
python herramientas/verificar_estado.py            # 51 tablas por archivo; head dcc838486407; 1 head; 21 módulos
grep -n "__tablename__" implementacion/L1-hce-idea/backend/app/models/*.py     # 51 líneas
```

**A2 — rutas.** Se importa la aplicación sin tocar la base (la URL no se conecta; la clave es de mentira) y se listan sus rutas:
```
cd implementacion/L1-hce-idea/backend
DATABASE_URL=postgresql+psycopg://x:x@localhost:1/x SECRET_KEY=<64 caracteres> .venv/Scripts/python.exe - <<'EOF'
from app.main import app
for r in app.routes:
    if hasattr(r, "methods") and r.path:
        for m in sorted(r.methods - {"HEAD", "OPTIONS"}):
            print(m, r.path, r.endpoint.__module__)
EOF
```
Salida: 94 filas; 5 son de infraestructura (módulo `app.main` o `fastapi.applications`), 89 de `app.routers.*`. Por router: ateneos 12 ·
documentos 9 · fotos 8 · idea 8 · informe_cierre 8 · organismos 8 · inclusion 7 · protocolo 6 · flujo 4 · hce 4 · referencias 4 ·
severidad 4 · valoracion_funcional 3 · auth 2 · auditoria 1 · panel 1. Por método: 52 GET, 27 POST, 15 PATCH.

**A3 — tests** (con Docker arriba; sólo recolecta, no ejecuta):
```
cd implementacion/L1-hce-idea/backend
.venv/Scripts/python.exe -m pytest --collect-only -q     # «1342 tests collected»
.venv/Scripts/python.exe -m pytest --collect-only -q | grep '::' | sed 's/::.*//' | sort | uniq -c    # por archivo: 35 archivos
```

**A4 — tablas sin API.** Para cada clase de modelo, se busca su nombre como palabra en `app/services`, `app/routers` y `app/schemas`
(y, aparte, en `seed_catalogos.py` y `seed_demo.py`):
```
cd implementacion/L1-hce-idea/backend
.venv/Scripts/python.exe - <<'EOF'
import re, pathlib
modelos = {}
for py in sorted(pathlib.Path("app/models").glob("*.py")):
    t = py.read_text(encoding="utf-8")
    for m in re.finditer(r'^class (\w+)\(([^)]*)\):\n(?:.*\n)*?\s+__tablename__\s*=\s*"(\w+)"', t, re.M):
        modelos[m.group(3)] = m.group(1)
codigo = {str(p): p.read_text(encoding="utf-8") for d in ("services", "routers", "schemas") for p in pathlib.Path("app", d).rglob("*.py")}
for tabla, clase in modelos.items():
    usa = [k for k, v in codigo.items() if re.search(r"\b" + clase + r"\b", v)]
    print(tabla, clase, len(usa))
EOF
```
Limitación: una tabla que sólo se alcanza por una relación del ORM (sin nombrar su clase) figuraría como «sin uso». Se revisaron a mano las
de la lista del §2 (`puntuacion_idea`, `puntuacion_protocolo`, `observacion`, `evento`, `persona_servicio`, `servicio`): ninguna se nombra en servicios
ni en routers. La cuenta de 23 sale de esa tabla: ocho de PAI, `divulgacion`, `taller`, `catalogo_centro_educativo`, seis de IDEA e IPPU-TEA, `servicio`,
`persona_servicio`, las dos puntuaciones, `observacion` y `evento`. (`Taller` aparece una vez en `schemas/documentos.py:23`, pero dentro de un texto de ejemplo, no como clase.)

**C1 — métricas de los archivos de la demo** (desde `implementacion/L1-hce-idea/demo`; el orden es el de los `<script src>` de `index.html`):
```
python - <<'EOF'
import re, pathlib
Q = "[\"']"
h = pathlib.Path("index.html").read_text(encoding="utf-8")
for nombre in re.findall(r'<script[^>]+src="js/([^"]+)"', h):
    t = pathlib.Path("js", nombre).read_text(encoding="utf-8")
    print(nombre, len(t.splitlines()),
          len(re.findall(r"\bescHtml\s*\(", t)),
          len(re.findall(r"\.innerHTML\s*\+?=(?!=)", t)),
          len(re.findall(r"\bonclick\s*=", t)),
          len(re.findall(r"\bon(?!click)(?:change|input|keydown|keyup|keypress|submit|focus|blur|mouseover|mouseout|mouseenter|mouseleave|load|error|dblclick|toggle|close|cancel)\s*=", t)),
          len(re.findall(r"\bstyle\s*=\s*" + Q, t)))
EOF
grep -n "function escHtml" implementacion/L1-hce-idea/demo/js/utils.js     # utils.js:18, la definición
```

**C2 — chequeos y selectores de `conectada.js`** (desde `implementacion/L1-hce-idea/demo/verificacion`):
```
python - <<'EOF'
import re, pathlib, collections
src = pathlib.Path("conectada.js").read_text(encoding="utf-8")
ids = re.findall(r"(?<![.\w])check\(\s*'([^']+)'", src)                    # 306, todos distintos
print(len(ids), len(set(ids)), collections.Counter(i.split("-")[0] for i in ids))
METODOS = r"(?:locator|\$\$?|\$\$?eval|waitForSelector|querySelector(?:All)?|click|fill|press|selectOption|textContent|innerText|innerHTML|isVisible|isEnabled|isChecked|getAttribute|focus|hover|check|uncheck|setInputFiles|dispatchEvent|inputValue|count)"
sels = [next(g for g in m.groups() if g) for m in re.finditer(r"\." + METODOS + r"\(\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"|`((?:[^`\\]|\\.)*)`)", src)]
print(len(sels),                                                         # 1448
      sum(bool(re.search(r"#[A-Za-z_][\w-]*", s)) for s in sels),        # con id: 1067
      sum(bool(re.search(r"(?<![\w\]])\.[A-Za-z_][\w-]*", s)) for s in sels),   # con clase (aprox.)
      sum(bool(re.search(r"\[data-[\w-]+", s)) for s in sels))           # con data-: 104
EOF
grep -c "getElementById(" conectada.js     # 539
grep -c "data-testid" conectada.js         # 0
```
La separación por tipo del §3.3 (sólo id, sólo clase, aria, texto, etiqueta) usa reglas un poco más finas que las de arriba; los totales por tipo
de la tabla salen de ellas. El conteo de 306 excluye las tres llamadas a `page.check('#ci_aut_…')` de Playwright, que el patrón `check(` también
encuentra si no se excluye el punto previo.

**D — seguridad** (verificaciones de la tabla 4.1; desde `implementacion/L1-hce-idea/backend`):
```
grep -rn "DataError" app --include=*.py                       # B1: sólo el docstring de schemas/hce.py
grep -n "jwt.decode" -A2 app/core/seguridad.py                # B3
grep -rniE "slowapi|limiter|\bjti\b|token_version" app --include=*.py     # B4: sin coincidencias reales
grep -n "def listar_grupos" app/services/referencias.py       # B6
grep -n "valor_a_texto" app/services/auditoria.py             # B7
grep -rn "hide_parameters" app --include=*.py                 # B8: sin coincidencias
grep -n "mkdir\|mkstemp\|is_relative_to" app/services/archivos.py        # B9, B10
grep -n "docs_url\|allow_credentials" app/main.py             # B12, B13
grep -in "fastapi\|jose" requirements.txt                     # B16
grep -n "router = APIRouter" app/routers/auditoria.py         # quién lee la auditoría
```
