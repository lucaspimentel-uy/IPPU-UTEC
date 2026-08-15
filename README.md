# Proyecto IPPU × UTEC-LIDIA

Repositorio de trabajo del convenio entre la **Fundación IPPU** (Instituto Psico-Pedagógico Uruguayo)
y **UTEC-LIDIA** (Licenciatura en Ingeniería de Datos e IA) para aplicar inteligencia artificial y
ciencia de datos a la atención de **niños, niñas y adolescentes (NNA) con TEA**.

El proyecto tiene **4 líneas de trabajo**. El foco actual es la **Línea 1 (L1): Historia Clínica
Electrónica + protocolo IDEA + analítica institucional**.

| Línea | Tema |
|---|---|
| **L1** ⭐ | Historia Clínica Electrónica (HCE) + inventario **IDEA** + analítica |
| L2 | Pictogramas personalizados con IA (CAA/AAC) |
| L3 | Asistente virtual (chatbot RAG) para técnicos, familias y docentes |
| L4 | Patrones de visualización / dashboards (incl. eye-tracking) |

## 📂 Estructura del repositorio
```
IPPU/
├── handoff.md      ← Estado del proyecto + decisiones + flujo de trabajo (EMPEZAR POR ACÁ)
├── CLAUDE.md       ← Guía de contexto para las sesiones de Claude
├── README.md       ← Este archivo
├── docs/
│   ├── estructura-repositorio.md  ← Mapa detallado de carpetas y rutas del repo
│   ├── fuentes/    ← Documentos originales (PDF, PPTX, DOCX) + reuniones/ (XLSX)
│   │   └── prototipo-v4/  ← Prototipo v4 de IPPU (HTML original + sus catálogos extraídos)
│   ├── markdown/   ← Conversiones a Markdown de las fuentes (legibles y citables)
│   ├── notas/      ← Notas de equipo · puntos-a-validar.md (qué falta definir con IPPU)
│   └── planes/     ← Planes de ronda (M0–M11 · M12 absorción del Prototipo v4 ← vigente)
├── implementacion/
│   └── L1-hce-idea/ ← Código y prototipos de la Línea 1
│       ├── demo/           ← Demo navegable (datos simulados, sin backend)
│       │   ├── index.html  ← abrir en el navegador (doble clic, no necesita servidor)
│       │   ├── css/estilos.css
│       │   └── js/         ← 12 módulos; se cargan en orden y ese orden ES la semántica
│       └── backend/                       ← API FastAPI + SQLAlchemy + Alembic (ver su README)
└── herramientas/
    ├── conversor_docling.py       ← Conversor de documentos a Markdown
    └── extraer_prototipo_v4.js    ← Regenera los catálogos del Prototipo v4 desde su URL
```

## 📌 Estado de la Línea 1 (ago-2026)
- **Demo v4.1 — ronda M0–M10 completa**, adaptada al **Documento Técnico IPPU v1.0**: motor de flujo con
  firma/bloqueo/addendas/habilitación excepcional y auditoría (HCE-LOG), módulos **HCE-00** (identificación
  y anamnesis), **HCE-CI** (consentimiento), **HCE-LB** (IDEA como línea base única), **HCE-PA/PB** (Escala
  IPPU-TEA con delta B−A y alerta institucional), **HCE-IC** (Informe de Cierre Anual con radar y PDF, único
  informe válido), **HCE-DOC** (documentos, archivo histórico y protección de imagen), **HCE-ORG** (INAU/BPS)
  y **HCE-VF** (valoración funcional BUND/CIF con salvaguarda anti-conversión), + búsqueda por 3 vías y
  recordatorios configurables. Reglas duras verificadas con Playwright (E2E punta a punta).
- **Analítica institucional calculada (v4.1):** los KPIs y gráficos de esa vista se derivan del modelo —
  cobertura de línea base, perfil poblacional por escala IDEA, evolución Protocolo A → B (Escala IPPU-TEA,
  en tarjeta aparte porque los dos instrumentos no son homologables), distribución por banda y ciclos de
  flujo completos— en lugar de constantes. El heatmap de talleres sigue con datos de muestra por decisión
  de alcance y está rotulado como tal.
- **Backend v2 — ronda M11 en curso.** Las Fases 0–2 (21 tablas, 20 endpoints) estaban construidas sobre el
  modelo *previo* al Documento Técnico y **se retiraron**: entre ese modelo y el actual no hay migración
  incremental posible. Hecho el 2026-08-07: **M11.1** (infra Postgres-only con docker-compose) y **M11.2**
  (28 tablas del esquema v2, migración inicial única y catálogos cargados — 12 dimensiones IDEA con sus 60
  descriptores, 24 ítems IPPU-TEA, baremo, categorías documentales, recordatorios, talleres y servicios).
  El 2026-08-14, **M12.0 a M12.3** de la ronda M12 (absorción del Prototipo v4): bandas del
  IDEA, interpretación del Δ, fichas/ejemplos/reglas del IDEA, la tabla `grupo` corregida, la **puntuación
  independiente de los dos técnicos** con su registro de consenso (D7) y el **catálogo dinámico de
  talleres** con los 14 reales (D5). El 2026-08-15, **M12.4** (HCE-SEV: severidad DSM-5-TR por juicio
  clínico, dos dominios independientes, y el retiro de la columna `hce_diurna.nivel_soporte`, §5.24) y
  **M12.7** (ateneos y jornadas de capacitación, con HCE-DOC ganando alcance institucional, §5.25).
  Estado actual: **38 tablas**, verificadas con **240 tests estructurales** contra Postgres, **0
  salteados**. ⚠️ **El conteo se movió tres veces y ninguna fue regresión:** bajó de 35 a 34 en M12.3
  —que no crea tablas y retira `hce_taller`, resto del esquema v1 (§5.20)—, subió a 36 en M12.4 y a 38
  en M12.7. **Falta M11.3** (los servicios con las reglas
  clínicas), M11.4 (routers), M11.5 (seed + tests) y M11.6 (docs), que se retoman al cerrar M12. Arranque en
  `implementacion/L1-hce-idea/backend/README.md`; esquema en `backend/docs/esquema-datos-v2.md`.
  ⚠️ **`pytest` exige Docker arriba**: desde el 2026-08-15 una **guardia de sesión** en
  `tests/conftest.py` **aborta con exit 1** si el contenedor no está levantado, si la base de desarrollo
  está vacía o si no está en el head — cada caso con el comando que lo arregla. Antes se salteaba en
  silencio y devolvía **exit 0** con la mitad de los tests sin correr. Una corrida válida es
  **240 passed, 0 skipped**.
  Desde el 2026-08-07 **no hay módulos con dueño exclusivo** (`handoff.md` §5.6): se avisa qué se toma y listo.
- **Ronda M12 — absorción del Prototipo v4 (ago-2026), en curso.** IPPU publicó su **Prototipo v4** con el
  Manual de Procedimientos v1.0, que pasa a ser la fuente normativa por encima del Documento Técnico
  (`handoff.md` §5.10). Se intercala entre M11.2 y M11.3 porque toca la misma capa (modelos, migración,
  catálogos): 6 bandas del IDEA, 14 talleres reales, y cuatro módulos nuevos — **HCE-SEV** (severidad
  DSM-5-TR), **HCE-INC** (inclusión educativa), **HCE-PAI** (propuesta de atención individual de INAU) y
  **ateneos/jornadas**. Plan: `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`.
- **Qué falta definir con IPPU** (validar la demo, cortes del baremo, acceso a la HCE actual…) está en
  `docs/notas/puntos-a-validar.md` — versión interna, con lo que bloquea cada punto. La versión **no
  técnica para mandarle a IPPU**, en formato de cuestionario, es `docs/notas/consulta-a-ippu.md`.

## 🚀 Cómo retomar el trabajo
```bash
git pull
cd <carpeta del repo>
claude
```
1. Leer **`handoff.md`** — es el estado vivo del proyecto: **§5** decisiones ya tomadas, **§6** pendientes y
   quién los tiene, **§12 el flujo de trabajo del equipo** (cómo trabajamos los tres en paralelo sin pisarnos).
2. Leer `CLAUDE.md` (contexto y reglas para las sesiones de Claude).
3. La documentación lista para leer está en `docs/markdown/`; la demo de la L1 se abre en el navegador desde
   `implementacion/L1-hce-idea/demo/`.

> ⚠️ **Antes de tocar código:** confirmá en `handoff.md` §6 que nadie más tomó ese módulo, y avisá en el grupo.
> Desde la modularización (2026-08-07, `handoff.md` §5.5) **la demo se puede trabajar en paralelo**, siempre
> que cada uno tome **archivos distintos** de `demo/js/`; avisá cuál tomás. `demo/index.html` y
> `demo/js/utils.js` los tocan todos → **coordinar antes** (§12.3).

## 🛠️ Convertir nuevos documentos a Markdown
```bash
python herramientas/conversor_docling.py "docs/fuentes/<archivo>" -o "docs/markdown"
# o una carpeta entera:
python herramientas/conversor_docling.py "docs/fuentes" -o "docs/markdown"
```

## 👥 Equipo
- **UTEC-LIDIA (estudiantes):** Samuel Furtado, Lucas Pimentel, Victor Uria.
- **UTEC (referentes):** Matías López, Vitalio Alfonso Reguera.
- **IPPU:** Fernando Sierra (Director).

## 🔒 Nota de privacidad
Trabajar **solo con datos simulados o anonimizados** mientras no exista un acuerdo de confidencialidad
firmado con IPPU. Los datos de los NNA son sensibles.
