# Backend L1 — HCE + IDEA (IPPU × UTEC-LIDIA)

API REST del Servicio de Atención Diurna. **Python + FastAPI + SQLAlchemy + Alembic + PostgreSQL.**

> **Estado: M11.2.** Esquema v2 completo (28 tablas) y catálogos cargados.
> Los routers de dominio se construyen en M11.4 — hoy la API sólo expone `/health`.
> El esquema está documentado en [`docs/esquema-datos-v2.md`](docs/esquema-datos-v2.md).

## Arranque

Requiere **Docker** corriendo (la base vive en un contenedor) y Python 3.11+.

```bash
cd implementacion/L1-hce-idea/backend

docker compose up -d                  # 1. Postgres 16 en localhost:5440
python -m venv .venv                  # 2. entorno (si no existe)
.venv\Scripts\Activate.ps1            #    (Linux/Mac: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env                # 3. config (Linux/Mac: cp)

alembic upgrade head                  # 4. crear el esquema
python -m app.seed_catalogos          # 5. cargar catálogos
uvicorn app.main:app --reload         # 6. API en http://127.0.0.1:8000/docs
```

Tests: `pytest -q` (usa la base `ippu_test`, aislada de la de desarrollo).

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
│   ├── core/                # config (valida que sea Postgres) · database
│   ├── models/              # catalogos · identidad · modulos · transversales
│   ├── data/                # catalogos_iniciales.json (generado desde la demo)
│   ├── seed_catalogos.py    # carga idempotente de catálogos
│   └── main.py              # /health (routers: M11.4)
├── tests/                   # tests estructurales del esquema
└── docs/
    ├── esquema-datos-v2.md  # ESQUEMA VIGENTE
    ├── esquema-datos.md     # v1, histórico (pre-Documento Técnico)
    └── ejemplos-endpoints.md# v1, se reescribe en M11.6
```

## Dónde vive cada regla

Decisión `handoff.md` §5.2.2: **la lógica de negocio va en el servidor, no en la
base.** Sin triggers PL/pgSQL.

| | Dónde | Ejemplos |
|---|---|---|
| Integridad **estructural** | PostgreSQL (CHECK, UNIQUE, FK) | total IDEA 0–96 · un solo protocolo A por año · foto individual **o** grupal, nunca ambas |
| Reglas **clínicas** | Servicios Python + Pydantic, con pytest | secuencia CI→LB→PA→PB→IC · firma = bloqueo · Δ sólo B−A · categoría del baremo sólo desde el % oficial |

Las reglas clínicas se implementan en **M11.3**. El detalle de cada una y su test
previsto está en [`docs/esquema-datos-v2.md`](docs/esquema-datos-v2.md) §4.

## Catálogos

`app/data/catalogos_iniciales.json` **se genera desde la demo v4.1**, que es la
fuente de verdad del modelo clínico (es lo que se adaptó al Documento Técnico en
la ronda M0–M10). Contiene 12 dimensiones IDEA con sus 60 descriptores, los 24
ítems de la Escala IPPU-TEA, el baremo BUND, 12 categorías documentales, 4
recordatorios, 8 talleres y 3 servicios.

No editarlo a mano: si cambia el instrumento, cambia primero en la demo.
