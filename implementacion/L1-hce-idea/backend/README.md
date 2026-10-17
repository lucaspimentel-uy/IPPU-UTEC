# Backend L1 — HCE + IDEA (IPPU × UTEC-LIDIA)

API REST del Servicio de Atención Diurna. **Python + FastAPI + SQLAlchemy + Alembic + PostgreSQL.**

> **Estado.** La API sirve el login, los expedientes (`/hce`), los grupos y profesionales, el flujo clínico, el CI, el IDEA, PA/PB, el IC con su documento y la VF: la lista exacta, en Swagger (`/docs`) y en la cabecera de `handoff.md`. Esquema vigente: [`docs/esquema-datos-v2.md`](docs/esquema-datos-v2.md).
>
> **Cómo correr:** `CLAUDE.md`, «Cómo correr» (Postgres, entorno, base descartable, API, seed, demo y tests); «Arranque», acá abajo, es la versión mínima.
>
> **Migraciones:** una sola migración inicial (un solo head); un cambio de modelos se regenera en ese mismo archivo, no se apilan revisiones (`handoff.md` §5.19).

## Arranque

Requiere **Docker** corriendo (la base vive en un contenedor) y Python 3.11+.

```bash
cd implementacion/L1-hce-idea/backend

docker compose up -d                  # 1. Postgres 16 en localhost:5440
python -m venv .venv                  # 2. entorno (si no existe)
.venv\Scripts\Activate.ps1            #    (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env                # 3. config (Linux/Mac: cp) — completar SECRET_KEY (obligatoria, §5.119):
                                      #    python -c "import secrets; print(secrets.token_urlsafe(48))"

alembic upgrade head                  # 4. crear el esquema
python -m app.seed_catalogos          # 5. cargar catálogos
$env:IPPU_SEED_DESTINO = "ippu"       # 6. guardia (§5.139): el nombre de la base de DATABASE_URL; sin esto no escribe
python -m app.crear_usuario --email yo@ippu.test --nombre "Yo" --rol admin   #    un usuario (pide la contraseña)
uvicorn app.main:app --reload         # 7. API en http://127.0.0.1:8000/docs
```

**Login (§5.118 d).** Todo salvo `/health` y `/auth/login` pide token: en Swagger, `POST /auth/login` con
`{email, password}`, copiar `access_token` y pegarlo en **Authorize**. Un `tecnico` sólo ve los expedientes
de los grupos en los que es `tecnico1_id`/`tecnico2_id`; un `admin` los asigna con `PATCH /grupos/{id}`
(§5.120). La demo conectada se sirve con `python -m http.server 5500` desde `demo/` (origen permitido por `CORS_ORIGINS`).

Tests: `pytest -q` (usa la base `ippu_test`, aislada de la de desarrollo).

### `docker compose up -d` es requisito de `pytest` — y la suite lo verifica sola

Los pasos 1 y 4 de arriba **no son opcionales para correr los tests**, y desde el
2026-08-15 **no hace falta acordarse**: una guardia de sesión en
`tests/conftest.py` chequea tres cosas antes del primer test y **aborta la
corrida entera** (`exit 1`, `no tests ran`) con el comando que la arregla:

| Qué chequea | Mensaje |
|---|---|
| Postgres responde, en las **dos** bases (test y desarrollo) | `docker compose up -d` |
| La base de desarrollo tiene esquema | `alembic upgrade head` |
| La base de desarrollo está en el **head actual** (derivado de `alembic/versions/`, no hardcodeado) | `alembic upgrade head`, con las dos revisiones a la vista |

**Por qué aborta en vez de saltear.** Antes, con el contenedor abajo, la corrida
terminaba en `34 passed, 89 skipped` y **exit code 0**. Los `skip` no estaban
ocultos —pytest imprime las `s` y el conteo—, pero **una sesión vacía devolvía
éxito**: indistinguible de una válida para CI, para `if ($?)` y para quien lee
«34 passed» de un vistazo. Ahora o corre entera o no arranca. **No quedó ningún
`skip` como fallback**, a propósito: conviviendo con la guardia, el salteo gana
cada vez que ella no prevé un caso.

Una corrida válida de hoy es **847 passed, 0 skipped**.

## Cargar la demo localmente (M11.5-a)

En este orden, desde `backend/` con el `.env` completo y `docker compose up -d`:

```powershell
alembic upgrade head                                                          # 1. esquema
python -m app.seed_catalogos                                                  # 2. catálogos y los 5 grupos reales del año
$env:IPPU_EMAIL="admin@ippu.test"; $env:IPPU_PASSWORD="<contraseña del admin>"
$env:IPPU_SEED_DESTINO="<nombre de la base de DATABASE_URL>"                #    guardia de destino (§5.139): sin esto, ni crear_usuario ni seed_demo escriben
python -m app.crear_usuario --email $env:IPPU_EMAIL --nombre "Coordinación" --rol admin   # 3. admin (toma IPPU_PASSWORD)
uvicorn app.main:app                                                          #    API arriba (otra terminal)
$env:PYTHONUTF8=1                                                             #    Windows: OBLIGATORIO para el paso 4 (consola cp1252)
python -m app.seed_demo --url http://localhost:8000                           # 4. la demo, por la API
```

⚠️ **En Windows, `python -m app.seed_demo` se corre con `PYTHONUTF8=1`:** con la consola cp1252 el «→» de un
`print` revienta la carga a mitad de camino (queda carga parcial; ver «Atomicidad» en el docstring de
`app/seed_demo.py`: se rehace con una base nueva).

Carga los 8 NNA de la demo por la API (Martín = §12-A). Los dos técnicos de la demo («Dr. González»,
«Mtra. Torres») se crean fuera de la API; si el paso 3 se saltea, el seed crea también el admin con
`IPPU_EMAIL`/`IPPU_PASSWORD`. ⚠️ **Sin `IPPU_DEMO_PASSWORD`, los dos técnicos de la demo quedan con la
misma contraseña que el admin** — aceptable sólo en desarrollo; definirla para que sean distintas.

Las dos CLI **imprimen la base de destino** (la de `DATABASE_URL`, o la del `.env` si no está exportada) y salen con 1 sin escribir si `IPPU_SEED_DESTINO` no vale exactamente ese nombre (`app/core/destino.py`). Además sale con código 1 **sin escribir nada** si la demo ya está cargada o si faltan los grupos (paso 2
salteado: el mensaje pide correr `python -m app.seed_catalogos`). Detalle y límites: docstring de
`app/seed_demo.py` y `handoff.md` §5.120.

> **Base de la presentación (`ippu_presentacion`):** se recarga después del 2026-11-13, para que las fechas de firma (las estampa el servidor con la fecha de la corrida) no queden antes de las de evaluación. No se arma a mano: `herramientas\preparar_presentacion.ps1` hace todo esto en un comando (`CLAUDE.md`, «Presentación»).

## API

Swagger en `/docs` (la referencia de cada endpoint: parámetros, errores y ejemplos). Hay un router por dominio en `app/routers/`: `auth` (login) · `hce` (alta, búsqueda, detalle, PATCH con baja y reingreso) · `referencias` (grupos y profesionales) · `flujo` (estado del año y consentimiento) · `idea` (LB) · `protocolo` (PA y PB) · `informe_cierre` (IC y su documento) · `valoracion_funcional` · `auditoria` (HCE-LOG, `GET /hce/{id}/auditoria`, sólo lectura). Todo pide token salvo `/health` y el login. **Contrato** (`handoff.md` §5.108): `GET` devuelve el recurso directo;
`POST`/`PATCH` devuelven `{"data": …, "warnings": []}`; todos los errores devuelven
`{"code": …, "detail": [{"campo": …, "mensaje": …}]}`. **Una transacción por request**: los servicios
(`app/services/`) sólo hacen `flush`, el commit está en `app/routers/dependencias.py`. Los tests de la API usan
las fixtures `client`, `db_api`, `crear_grupo` y `crear_profesional` de `tests/conftest.py` (savepoints: un
commit del router no escapa del test). `client` entra como `admin`; `token_de(profesional)` da las cabeceras
de otro usuario.

## Por qué Postgres en Docker

Decisión `handoff.md` §5.2.1. Dos motivos:

- **El esquema usa JSONB y CHECKs que SQLite acepta pero no aplica.** Desarrollar
  contra un motor distinto al de producción dejaba pasar errores que sólo
  aparecían al desplegar.
- **Somos tres trabajando en paralelo.** Con compose todos corren la misma
  PG 16 con un comando, en vez de tres instalaciones manuales que se desfasan.

Docker **no es estructural**: el código sólo conoce un `DATABASE_URL`. Si mañana
se despliega contra un Postgres gestionado o instalado a mano, se cambia el
`.env` y no se toca ni un modelo. El resto de Docker (app + NGINX) es Fase 6.

**El puerto es 5440, no 5432 ni 5433**, porque ambos suelen estar tomados por un
PostgreSQL instalado localmente. Si igual choca, se cambia en `docker-compose.yml`
y en el `.env`.

<details>
<summary>Si <code>alembic upgrade head</code> falla con «password authentication failed»</summary>

Casi siempre es otro PostgreSQL escuchando en el mismo puerto: se queda con el
binding IPv4 y `localhost` conecta ahí en vez de al contenedor, sin ningún error
visible. Verificar con:

```powershell
Get-NetTCPConnection -LocalPort 5440 -State Listen
```

Si aparece un proceso `postgres` que no es `com.docker.backend`, elegir otro puerto.
</details>

## Estructura

```
backend/
├── docker-compose.yml       # Postgres 16 (dev). App + NGINX: Fase 6
├── docker/initdb/           # crea la base ippu_test al inicializar el volumen
├── alembic/                 # migración inicial única del esquema v2
├── app/
│   ├── core/                # config (valida que sea Postgres) · database · constantes
│   ├── models/              # catalogos · identidad · modulos · transversales · mixins
│   ├── data/                # catalogos_iniciales.json (generado, no editar a mano)
│   ├── seed_catalogos.py    # carga idempotente de catálogos
│   ├── routers/             # un módulo por dominio (HTTP: contrato, alcance por grupo, cabecera X-Total-Count)
│   ├── schemas/             # entradas y salidas de la API (Pydantic)
│   ├── services/            # las reglas; sólo flush, el commit está en routers/dependencias.py
│   └── main.py              # /health y la inclusión de los routers (todos con token)
├── tests/                   # esquema, servicios y API (un archivo por rebanada)
└── docs/
    ├── esquema-datos-v2.md  # ESQUEMA VIGENTE
    └── (los dos docs del backend v1 —esquema-datos.md y ejemplos-endpoints.md— se
        borraron el 2026-08-20: describían la API retirada en M11.2. Ver handoff §5.29)
```

## Dónde vive cada regla

Decisión `handoff.md` §5.2.2: **la lógica de negocio va en el servidor, no en la
base.** Sin triggers PL/pgSQL.

| | Dónde | Ejemplos |
|---|---|---|
| Integridad **estructural** | PostgreSQL (CHECK, UNIQUE, FK) | total IDEA 0–96 · un solo protocolo A por año · foto individual **o** grupal, nunca ambas |
| Reglas **clínicas** | Servicios Python + Pydantic, con pytest | **44 reglas** en la tabla de §4 (medido 2026-09-11, M12.8b-3a — incluye las dos filas de guards del PAI que sumó M12.8b-1b). Ejemplos: secuencia CI→LB→PA→PB→IC · firma = bloqueo · Δ sólo dentro del mismo instrumento (§5.36; corregido junto con I1, 2026-09-16) · categoría del baremo sólo desde el % oficial |

Las reglas clínicas se implementan en **M11.3**. El detalle de cada una y su test
previsto está en [`docs/esquema-datos-v2.md`](docs/esquema-datos-v2.md) §4.

## Catálogos

`app/data/catalogos_iniciales.json` **no se edita a mano**: lo genera

```bash
python herramientas/generar_catalogos_backend.py          # regenera
python herramientas/generar_catalogos_backend.py --check  # falla si el repo quedó desfasado
```

Contiene 12 dimensiones IDEA con sus 60 descriptores oficiales (**+ la versión
corta del Prototipo v4 en `descriptor_breve`**), los 24 ítems de la Escala
IPPU-TEA, el baremo BUND, 12 categorías documentales, **8 recordatorios**, los
**14 talleres reales** del Prototipo v4 (M12.3, en reemplazo de los 8 de la demo
—no coincidía ninguno—), 3 servicios y los catálogos que sumó M12.1: **6 bandas
del IDEA**, **6 tramos de interpretación del Δ**, 12 fichas, 48 ejemplos
clínicos, 9 reglas y los **4 grupos por color**; más, de M12.4, los **3 grados de
severidad DSM-5-TR** (`severidad_nivel`) con su etiqueta, los dos descriptores
largos por dominio y los apoyos que orienta cada grado.

⚠️ **Los 8 talleres viejos no se borran solos.** El seed nunca borra ni desactiva
lo que dejó de estar en el JSON (es por diseño: podría haber registros
apuntándole). Como no hay datos reales y `hce_taller` desapareció, la
**reconstrucción limpia** documentada más arriba (drop schema → `alembic upgrade
head` → `python -m app.seed_catalogos`) los elimina sola — pero **una base de
desarrollo que no se reconstruya va a quedar con 8 talleres fantasma, y el seed
no lo avisa**. Si es tu caso: `DELETE FROM taller WHERE nombre IN (...)`.

Dos fuentes, y el script sabe cuál es cuál: los instrumentos vienen de la demo
v4.1 (lo que se adaptó al Documento Técnico en M0–M10) y lo nuevo, del Prototipo
v4 (`docs/prototipo-v4/`). En **M12.8** todo pasa a salir del prototipo.

**Lo que no es catálogo** —etiquetas Likert, dominios y niveles de HCE-VF, guía
de prestaciones, opciones de BPS, vocabulario institucional— vive en
`app/core/constantes.py`. El criterio para decidir tabla vs. constante está
escrito en el docstring de ese archivo.
