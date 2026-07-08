# Backend — HCE + IDEA (L1)

API REST de la Línea 1 (Historia Clínica Electrónica + protocolo IDEA).
Stack: **FastAPI + SQLAlchemy + Alembic**, SQLite en dev → PostgreSQL en prod (Fase 6).

## Puesta en marcha (dev)

```bash
cd implementacion/L1-hce-idea/backend

# 1) Entorno virtual
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# (Git Bash / Linux / macOS):  source .venv/bin/activate

# 2) Dependencias
pip install -r requirements.txt

# 3) Configuración
cp .env.example .env        # ajustar SECRET_KEY

# 4) Crear las tablas (migración Alembic) y cargar datos simulados
alembic upgrade head
python -m app.seed

# 5) Levantar la API
uvicorn app.main:app --reload
```

### Base de datos (Alembic)
```bash
alembic upgrade head                      # aplica las migraciones (crea/actualiza tablas)
alembic revision --autogenerate -m "..."  # genera una migración desde cambios en los modelos
alembic downgrade -1                       # revierte la última migración
python -m app.seed                        # (re)carga datos simulados — vacía y vuelve a poblar
```
El motor por defecto es SQLite (`ippu.db`, ignorado por git). Para PostgreSQL, cambiar `DATABASE_URL` en `.env` (Fase 6).

- Health check: http://127.0.0.1:8000/health
- Documentación (Swagger UI): http://127.0.0.1:8000/docs

## Estructura

```
backend/
├── app/
│   ├── main.py          # instancia FastAPI + CORS + routers
│   ├── core/
│   │   ├── config.py    # settings desde .env
│   │   └── database.py  # engine, sesión, Base declarativa
│   ├── models/          # modelos SQLAlchemy (Fase 1)
│   ├── schemas/         # schemas Pydantic (Fase 2)
│   └── routers/         # endpoints por dominio (Fase 2)
├── alembic/             # migraciones (Fase 1)
├── requirements.txt
├── .env.example
└── README.md
```

## Endpoints (Fase 2)
Todos documentados y probables en **`/docs`** (Swagger). Resumen:
- **NNA:** `GET /nna` (busca `?q=` · filtra `?activo=`) · `POST /nna` · `GET/PUT /nna/{id}` · `PATCH /nna/{id}/estado`
- **IDEA:** `GET/POST /nna/{id}/idea` · `GET /idea/{eval_id}` — `total` se calcula en el servidor
- **Likert:** `GET/POST /nna/{id}/likert` — `equivalente_idea` se calcula en el servidor
- **Clínica:** `GET/POST /nna/{id}/observaciones` · `GET/POST /nna/{id}/eventos`
- **Catálogo:** `GET /catalogo/escalas` · `GET /catalogo/dimensiones`
- **Personas:** `GET /terapeutas` · `GET /grupos` · `GET /talleres`

## Tests
```bash
pytest -q          # base SQLite temporal y aislada (no toca ippu.db)
```

## Roadmap de la etapa
- **Fase 0** ✅ esqueleto que levanta (`/health`, `/docs`).
- **Fase 1** ✅ modelos + migraciones + seed con datos simulados.
- **Fase 2** ✅ endpoints CRUD (NNA, IDEA, Likert, observaciones, eventos, catálogo, personas) + tests.
- **Fase 3** conectar la demo HTML a la API (persistencia real).
- **Fase 4** autenticación JWT por terapeuta + roles.
- **Fase 5** más tests + docs.
- **Fase 6** Docker + PostgreSQL.
