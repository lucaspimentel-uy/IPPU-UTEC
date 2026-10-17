# CLAUDE.md — Guía para Claude en el proyecto IPPU

> Reglas y cómo correr lo que **rige hoy**. El estado vivo: cabecera de `handoff.md`. La historia: `handoff.md` §5
> (decisiones), `docs/bitacora.md` y `docs/pendientes-resueltos.md`. Compartido por Lucas · Samuel · Victor.

## Arranque de sesión (obligatorio)
1. `git pull`; leer la **cabecera de `handoff.md`** y el **§6** de lo que se toma. Hasta el **2026-11-26** rige la
   **documentación mínima** (§5.114): el resto de `handoff.md` y los documentos largos son referencia. Los prompts de sesión
   viven en el **plan del equipo**, no en el repo (§5.136 d; el de L1, enlazado en la cabecera).
2. **Rama corta** desde `main`; las ramas se suben **sólo a `origin`**. `main` avanza por fast-forward
   (`git merge --ff-only`) y se sube a `origin` **y** a `gitlab`, sin `--force`.
3. Nadie tiene módulos exclusivos (§5.6): se avisa qué se toma. En la demo, **archivos distintos** de `demo/js/`;
   `index.html` y `js/utils.js` los tocan todos → coordinar (§12.3).
4. Al terminar, verificar y escribir **sólo**: entrada de `docs/bitacora.md` (≤ 15 líneas), casilla de §6, un §5 si hubo
   una decisión (número libre tras `git pull`: Samuel también escribe en §5) y la cabecera de `handoff.md` (≤ 15 líneas).
   §5 y la bitácora **sólo se agregan**. Sin notas ni resúmenes nuevos.

**Anti-contradicción:** lo que contradiga una decisión de `handoff.md` §5 no se implementa: se frena, se anota en §7 y
lo resuelve el equipo. Las decisiones se cambian por escrito en §5, nunca de hecho en el código (§5.3).

## Resumen
Convenio **IPPU** × **UTEC-LIDIA**: IA y datos para NNA con TEA; cuatro líneas, **foco L1** (HCE + IDEA + analítica). **Meta:
prototipo presentable sin datos reales el 2026-11-26** = la demo HTML conectada a la API (§5.92, §5.106). Escribir **en español**
(rioplatense neutro), conciso. La IA **apoya**, no reemplaza, el juicio clínico.

## Precedencia normativa (§5.92, §5.93)
Normativo es lo que **IPPU dijo sobre sí misma**: el acta de la reunión del 2026-08-26 (§5.36–§5.49), **sus respuestas
escritas del 2026-10-05** (`docs/notas/respuestas-ippu-2026-10-05.txt`, nivel 0), el cuestionario del 15/06, el Protocolo
de acceso/confidencialidad/resguardo (`docs/markdown/protocolo-acceso-confidencialidad-resguardo-hce.md`), el Manual de
Procedimientos y el Documento Técnico. **En conflicto gana el acta y cualquier decisión posterior.** El **Prototipo v4 y
la demo v4.1 no son norma**: son insumo; no se modela ni se siembra nada sólo porque aparece ahí.

## Privacidad
**Sólo datos simulados o anonimizados** (no hay acuerdo de confidencialidad firmado, §5.104; Protocolo §6.7). Datos de NNA
= sensibles: nunca identificadores ni imágenes reales a servicios externos sin evaluación.

## Mapa del repositorio (detalle: `docs/estructura-repositorio.md`)
- `handoff.md` (cabecera = estado · §5 decisiones · §6 pendientes · §7 preguntas) · `README.md` · este archivo.
- `docs/`: `bitacora.md` (append-only, §5.84) · `pendientes-resueltos.md` · `guias/notas-accesibilidad-ui.md` · `markdown/` (se lee y
  se cita desde acá) · `notas/` (`puntos-a-validar.md`, `preguntas-ippu.md`, `consulta-a-ippu.md` —snapshot del 19/08, §5.34—,
  respuestas de IPPU) · `planes/` (L3) · `fuentes/` (respaldo, no se lee, §5.29) · `prototipo-v4/` (insumo de build, §5.30).
- `implementacion/L1-hce-idea/`: `backend/` (FastAPI + SQLAlchemy + Alembic + Postgres; antes de tocar modelos, leer
  `docs/esquema-datos-v2.md`) · `demo/` (HTML conectada a la API; `js/` = 18 módulos, el orden de carga es la semántica; lo no
  conectado dice «Modo demostración») · `demo/verificacion/` (Playwright: `conectada.js`, `capturas.js`, `fingerprint.js` +
  `comparar.js` para las vistas en demostración). `implementacion/L3-asistente-virtual/` es de Samuel: no se toca desde L1 (§5.128).
- `herramientas/`: `generar_catalogos_backend.py` (`--check`; el JSON de catálogos se genera, no se edita) · `verificar_estado.py` ·
  `verificar_contraste_ui.js` · `preparar_presentacion.ps1` + `verificar_presentacion.js` (la base de la presentación, ver «Presentación»).
  Antes de dar algo por definido: `docs/notas/puntos-a-validar.md`.
- **Documento nuevo de IPPU:** se convierte a Markdown cuando llega y se cita el `.md` (no hay script en el repo, §5.136).

## Cómo correr
PowerShell 5.1 (sin `&&`), Docker Desktop arriba, desde `implementacion\L1-hce-idea\backend` salvo donde se indica.
**Verificar es SIEMPRE sobre una base descartable** (acá `ippu_ver`, API en `:8001`); la de trabajo es la del `.env` y no
se recrea. Trabajo diario: sin las dos primeras líneas del paso 2 y con `--port 8000`.
```powershell
# 1 · Postgres y entorno (la 1.ª vez, todo; después sólo la primera línea y Activate.ps1)
docker compose up -d                     # Postgres 16 en 127.0.0.1:5440 (contenedor ippu-postgres)
if (-not (Test-Path .venv)) { python -m venv .venv }
.venv\Scripts\Activate.ps1; pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }   # completar SECRET_KEY (obligatoria, §5.119): python -c "import secrets; print(secrets.token_urlsafe(48))"
Push-Location ..\demo\verificacion; npm ci; npx playwright install chromium; Pop-Location
pip install pypdf                        # conectada.js lee el PDF del IC con el `python` del PATH

# 2 · Base descartable + esquema + catálogos (DATABASE_URL en ESTA terminal, ANTES de alembic y del seed)
docker exec ippu-postgres psql -U ippu -d ippu -c "DROP DATABASE IF EXISTS ippu_ver WITH (FORCE)" -c "CREATE DATABASE ippu_ver"
$env:DATABASE_URL = "postgresql+psycopg://ippu:ippu@localhost:5440/ippu_ver"
$env:IPPU_SEED_DESTINO = "ippu_ver"      # guardia (§5.139): seed_demo y crear_usuario imprimen la base y no escriben si esto no es su nombre
alembic upgrade head
python -m app.seed_catalogos

# 3 · API (otra terminal: venv activo y el MISMO DATABASE_URL); docs en /docs
uvicorn app.main:app --port 8001

# 4 · Demo cargada por la API (8 NNA; aborta si ya están). Sin demo: python -m app.crear_usuario --email … --nombre … --rol admin
$env:PYTHONUTF8 = "1"; $env:IPPU_EMAIL = "admin@demo.ippu.test"; $env:IPPU_PASSWORD = "<clave del admin>"; $env:IPPU_DEMO_PASSWORD = "<clave de los técnicos>"
python -m app.seed_demo --url http://localhost:8001

# 5 · Demo en el navegador (otra terminal; no sirve por file://, la API sólo acepta el origen :5500)
cd ..\demo; python -m http.server 5500   # http://localhost:5500/index.html?api=http://localhost:8001 · gonzalez@demo.ippu.test

# 6 · Verificación (1.ª terminal, base recién cargada)
cd ..\demo\verificacion
$env:API = "http://localhost:8001"; $env:IPPU_ADMIN_EMAIL = $env:IPPU_EMAIL; $env:IPPU_ADMIN_PASSWORD = $env:IPPU_PASSWORD
node ..\..\..\..\herramientas\verificar_contraste_ui.js   # PRIMERO: sólo lee, nunca escribe en la API; --tabla lista los pares
$env:CONFIRMA_BASE_DESCARTABLE = "1"
node conectada.js                        # ESCRIBE (crea, firma, addendas): base nueva por corrida
node capturas.js                         # ESCRIBE: base nueva; PNG en salidas\ a 1280×800 y 1024×768

# 7 · Tests (venv activo; usa la base ippu_test y la de DATABASE_URL)
cd ..\..\backend
pytest -q                                # todo pasa, 0 skipped; sin Docker o con la base fuera del head ABORTA (exit 1)
```
Entre dos corridas que **escriben**: parar la API y repetir los pasos 2, 3 y 4. Uso de cada herramienta:
`implementacion/L1-hce-idea/demo/verificacion/README.md`.

## Presentación (un comando, §5.139)
La base de la presentación es **`ippu_presentacion`** (API `:8000`, demo `:5500`); se recarga **después del 2026-11-13**. Desde la
raíz del repo, con Docker y el contenedor arriba y el entorno del paso 1 hecho:
```powershell
$env:IPPU_PASSWORD = "<clave del admin>"; $env:IPPU_DEMO_PASSWORD = "<clave de los técnicos>"   # IPPU_EMAIL opcional
powershell -ExecutionPolicy Bypass -File herramientas\preparar_presentacion.ps1    # borra y recrea la base, carga la demo, deja API y demo arriba
$env:API = "http://localhost:8000"; node herramientas\verificar_presentacion.js     # sólo lectura: tiene que decir OK
powershell -ExecutionPolicy Bypass -File herramientas\preparar_presentacion.ps1 -Detener   # para lo que arrancó el script (no toca la base)
```
Volver a correrlo da lo mismo. Se niega a recrear `ippu_test` y, sin `-ConfirmarBaseDeTrabajo`, `ippu`; un puerto ocupado por otro
proceso lo frena (no mata lo ajeno). Parámetros: `-Base`, `-PuertoApi`, `-PuertoDemo`. Sin `IPPU_SEED_DESTINO`, `seed_demo` y
`crear_usuario` no escriben (el script lo fija solo).

## Reglas de L1 en vigor
- **La secuencia sólo avisa; firmar bloquea:** `warnings[]` + fila `auditoria` `tipo='excepcion'`; tocar un registro firmado
  da **409** (§5.95, §5.116). **El CI no traba** (§5.94). Cadena por año CI → LB → PA → PB → IC (§5.96).
- **Δ sólo dentro del mismo instrumento** (§5.36). **Qué IDEA rige:** el de su año; en la HCE, el firmado de mayor `anio` (§5.97).
- **Puntaje único** por dimensión (§5.98). **Baremo (VF) sólo desde `pct`**, sin sugerencia CIF (§5.2, §5.118).
- **Guardar una foto no requiere nada**; la autorización de imagen regula **compartir** (§5.99).
- **La historia es inmutable:** firmado = cerrado; se corrige con **addendas**, cuyo autor es el usuario del token (§5.116, §5.119).
  Contrato `{data, warnings}` / `{code, detail[]}`, una transacción por request (§5.108).
- **El navegador no calcula valores de negocio que se persisten** (totales, Δ, alertas, banda, baremo): los da la API; una
  suma en vivo se rotula «provisorio» (§5.122).
- Postgres-only, lógica en el servidor, sin triggers (§5.2). Login `admin` | `tecnico`: el técnico ve sólo sus grupos, fuera de
  alcance = 404 (§5.101, §5.118). Frontend del 26/11 = la demo HTML (§5.106).

## Verificación — reglas de higiene
- **Contraste:** la documentación **no afirma cantidades ni ratios** (cuántos pares, entre qué valores): se escribe «ningún par
  falla» (línea base, §5.135) y «todo par nuevo ≥ 4,5:1». Los conteos de chequeos (`181/181`) van en `handoff.md` y la bitácora;
  los ratios, en el comentario de CSS junto al token. Las demás cifras que cambian (tests, tablas) no se escriben acá: las lleva
  la cabecera de `handoff.md` y las mide `python herramientas/verificar_estado.py --check` (con `generar_catalogos_backend.py --check`).
- **Base descartable:** `conectada.js`, `capturas.js` y el seed escriben. Nunca contra `:8000` ni la base de la presentación;
  `DATABASE_URL` e `IPPU_SEED_DESTINO` en la misma terminal **antes** de `alembic` o del seed; `:8001` y `:5500` libres al empezar y
  al terminar. (La única corrida que usa `:8000` y `ippu_presentacion` es la de `preparar_presentacion.ps1`.)
- **Nunca un `git worktree` con junction/symlink a `node_modules`:** `git worktree remove` sigue el enlace y **borra la carpeta
  real** (pasó dos veces). En un worktree, `npm ci`; antes de quitar uno, `cmd /c rmdir <junction>` (sin `/s`).

## Dominio mínimo (IDEA)
4 escalas → **12 dimensiones (D1–D12)**, cada una **0–8**, total **0–96** (menor = mejor). IDEA completa enero/noviembre +
intermedia Likert en junio (`equiv. IDEA = (5 − promedio)×2`). Detalle: `handoff.md` §3.

## Después del 2026-11-26
PAI (salvo que sobre tiempo) · guards de divulgación y de compartir · registro de accesos con motivo · reserva del adolescente · administración de usuarios, grupos y catálogos · roles y matriz · Docker completo · React + Tailwind (§5.106).
