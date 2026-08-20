# Backend L1 — HCE + IDEA (IPPU × UTEC-LIDIA)

API REST del Servicio de Atención Diurna. **Python + FastAPI + SQLAlchemy + Alembic + PostgreSQL.**

> **Estado: M12.7** (ronda M12, absorción del Prototipo v4). Esquema v2 con las correcciones de M12.1, la
> puntuación independiente de M12.2, el catálogo dinámico de talleres de M12.3, **HCE-SEV** (M12.4) y los
> **ateneos y jornadas** de M12.7: **38 tablas** y catálogos cargados. Los routers de dominio se construyen en M11.4 — hoy la API sólo
> expone `/health`. El esquema está documentado en
> [`docs/esquema-datos-v2.md`](docs/esquema-datos-v2.md).
>
> ⚠️ **El conteo se movió tres veces y ninguna fue una regresión.** M12.3 lo bajó de 35 a **34**: no crea
> tablas (`taller` ya existía) y retira `hce_taller`, resto del esquema v1 (`handoff.md` §5.20). M12.4 lo
> sube a **36** con `severidad_dsm` + `severidad_nivel`, y retira **una columna, no una tabla**
> (`hce_diurna.nivel_soporte`, §5.24: era una tercera fuente de verdad sobre el nivel DSM). M12.7 lo lleva
> a **38** con `ateneo` + `ateneo_acuerdo` (§5.25, §5.26).
>
> **Migraciones** (regla enmendada el 2026-08-14, `handoff.md` §5.19): la migración inicial **única** se
> regenera **al cerrar cada sub-módulo de M12**, con `test_la_migracion_coincide_con_los_modelos` **en
> verde** — ya no se saltea, y `alembic upgrade head` crea las **38 tablas** actuales. Se congela sólo si
> hay trabajo en paralelo real sobre `app/models/`; ahí la descongela y regenera una sola persona al
> terminar. **Se regenera el mismo archivo de migración, no se apilan revisiones.**

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

Una corrida válida de hoy es **240 passed, 0 skipped**.

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
│   └── main.py              # /health (routers: M11.4)
├── tests/                   # tests estructurales del esquema
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
| Reglas **clínicas** | Servicios Python + Pydantic, con pytest | secuencia CI→LB→PA→PB→IC · firma = bloqueo · Δ sólo B−A · categoría del baremo sólo desde el % oficial |

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
