# Relevamiento de estado — 2026-08-26

> **Sesión R0 · SOLO LECTURA.** Este archivo es la única salida. No se editó, creó ni borró nada más;
> no hubo `commit`/`checkout`/`merge`, ni `alembic upgrade|downgrade|revision|stamp`, ni
> `python -m app.seed_catalogos`, ni escrituras contra la base de desarrollo.
>
> **Regla de evidencia.** Cada afirmación va con `archivo:línea` o con la salida del comando que la
> produjo. Lo que sólo dice un `.md` y no confirma el código está marcado **SÓLO DOCUMENTADO**. Lo que no
> se pudo verificar está marcado **NO VERIFICABLE**.
>
> **Entorno levantado (permitido):** Docker Desktop no estaba corriendo; se lanzó
> `"C:\Program Files\Docker\Docker\Docker Desktop.exe"` y luego el contenedor. Es entorno, no dato.
>
> **Chequeo previo obligatorio antes de `pytest`:** `.env` declara
> `DATABASE_URL=postgresql+psycopg://ippu:ippu@localhost:5440/`**`ippu`** y
> `TEST_DATABASE_URL=postgresql+psycopg://ippu:ippu@localhost:5440/`**`ippu_test`**. **Son distintas** →
> se corrió `pytest`. (`implementacion/L1-hce-idea/backend/.env`, líneas 3–4; defaults idénticos en
> `app/core/config.py:22` y `:25`.)

---

## BLOQUE 0 — Dónde estamos parados

### Rama y commits

- **Rama actual:** `main` (`git branch --show-current`).
- **Últimos 20 commits** (`git log --oneline -20`):

```
4fded35 docs(§13): backfill de la sesion de accesibilidad + bitacora de esta sesion
9bb485b docs(guias): reemplazar los ratios a mano de §2.6 por medidos con script
15a4742 feat(herramientas): medir contraste WCAG por script, no a mano
f6dac8f docs(demo/verificacion): estado del harness + opciones de baseline medidas
c1ca4eb fix(demo/verificacion): declarar el mapa de vistas del fingerprint en un solo lugar
6f31145 docs(guias): notas de accesibilidad de la UI, para quien retome el restyle
ef302c3 docs(prompts): agregar el prompt de la sesión corta pre-reunión 2026-08-21
c549171 docs(notas): link del Google Doc en la cabecera de consulta-a-ippu.md
8fbb629 fix(demo): crumbs y título de Grupos ya no se duplican en el detalle
591acfe docs(§13,§6): bitácora de la Fase B y los pendientes que F1 dejó de bloquear
281405b docs(prompts): los tres prompts de sesión sueltos van a docs/prompts/
4cb4976 docs(reunion): agenda reescrita contra lo ya respondido, y hoja de aterrizaje para llenar mañana
4ce85f6 docs(§5.34-§5.35): la divergencia del cuestionario, y la puerta de §5.8 se corre a M11.3
45312a6 docs: la demo pasó de 12 a 14 módulos con el merge de F1
9cb55fb docs: barrido de referencias — cada cita a la consulta apuntaba a otra pregunta
60306e5 docs(notas): el repo tenía un cuestionario que IPPU no tiene — se reemplaza por el enviado
2f56877 docs(verificacion): escribir el procedimiento de comparación, y decir que el harness hoy no corre entero
c452aa8 fix(demo): devolver los talleres por grupo — F1 dejó sólo el KPI agregado (§5.14 / D5)
d94b102 merge: integrar demo/F1-navegacion a main (restyle + B1/B2 + Ateneos + Inclusión)
7534ce2 docs(§5.33): F1 se pasó del alcance de §5.27 — se registra antes de mergear, no después
```

⚠️ **Los 20 commits son de documentación, demo y herramientas. Ninguno toca `backend/app/` ni
`backend/tests/`.**

- **Ramas locales** (`git branch -vv`):

| Rama | HEAD | Tracking |
|---|---|---|
| `main` (actual) | `4fded35` | `[origin/main]`, al día |
| `feat/m11-backend-v2` | `356d2f2` | `[origin/feat/m11-backend-v2: ahead 1]` |

- **Ramas remotas** (`git branch -r`): `gitlab/main`, `gitlab/demo/F1-navegacion`,
  `gitlab/feat/m11-backend-v2`, `gitlab/feature/base-datos-hce`, `gitlab/rama1`, `gitlab/HEAD`;
  `origin/main`, `origin/demo/F1-navegacion`, `origin/feat/m11-backend-v2`, `origin/HEAD`.
- **Remotos** (`git remote -v`): `gitlab` = `https://git.utec.edu.uy/juan.pimentel/IPPU-UTEC.git` ·
  `origin` = `https://github.com/lucaspimentel-uy/IPPU-UTEC.git`.

### Cambios sin commitear

`git status --porcelain`:

```
 M docs/estructura-repositorio.md
 M handoff.md
 M implementacion/L1-hce-idea/demo/verificacion/README.md
?? docs/notas/borrador-color-y-significado-clinico.md
?? docs/prompts/New Documento de texto.txt
?? docs/prompts/Prompt para la próxima sesión 08-21-26.txt
?? docs/prompts/SESIÓN R0-RELEVAMIENTO DE ESTADO-2026-08-26.md
?? docs/prompts/prompt-pre-review-harness-2026-08-21.md
```

`git diff --stat` → **3 archivos, 61 inserciones, 15 borrados.** Ninguno es código: `handoff.md`
(+41/−0: agrega a §6 el pendiente de los 3 puntos de presentación desincronizada, y ajusta vocabulario
del harness en §13), `docs/estructura-repositorio.md` (+6/−1: da de alta
`borrador-color-y-significado-clinico.md`) y `demo/verificacion/README.md` (+20/−9).

### Commits sin pushear

- `main`: `git log gitlab/main..HEAD` → **vacío**. `git log origin/main..HEAD` → **vacío**. Al día en
  los dos remotos.
- `feat/m11-backend-v2`: **1 commit sin pushear a los dos remotos** — `356d2f2 docs: registrar la
  limitación anual de 'grupo' y cerrar la sesión de M11.1+M11.2`. **Pero está mergeado en `main`**
  (`git merge-base --is-ancestor feat/m11-backend-v2 main` → verdadero): el contenido no se pierde, es
  una rama vieja que quedó un commit adelante de su propio remoto.

### Alembic

```
alembic heads    → 9246e659d2c9 (head)
alembic current  → 9246e659d2c9 (head)
```

**Coinciden.** Un solo head, un solo archivo en `alembic/versions/`:
`9246e659d2c9_esquema_v2_inicial_m12_7.py` (46.491 bytes, mtime 2026-08-15 15:19).

### Tablas reales en la base de desarrollo (por SELECT)

```sql
SELECT count(*) FROM information_schema.tables
WHERE table_schema='public' AND table_type='BASE TABLE';
--> 39
```

**39 tablas físicas = 38 de dominio + `alembic_version`.** El «38» de los documentos es el conteo sin
`alembic_version`, y es correcto. Lista completa:

```
alembic_version · ateneo · ateneo_acuerdo · auditoria · autorizacion_imagen · banda_idea ·
baremo_categoria · categoria_documento · consentimiento · delta_interpretacion · documento · evento ·
foto · grupo · hce_diurna · idea · idea_dimension · idea_ejemplo · idea_ficha · idea_nivel ·
idea_regla · informe_cierre · ippu_item · observacion · organismo_bps · organismo_inau · persona ·
persona_servicio · profesional · protocolo · puntuacion_idea · puntuacion_protocolo · recordatorio ·
registro_organismo · servicio · severidad_dsm · severidad_nivel · taller · valoracion_funcional
```

Contraste independiente: `python herramientas/verificar_estado.py` (mide el repo, no lee prosa) →
`38 tablas` · `migración 9246e659d2c9` · `heads 1` · `tests 240`. Y `--check` → `OK — la documentación
coincide con el repo`, **exit 0**. ⚠️ Esa herramienta compara **conteos**, no prosa (ver BLOQUE 10).

### pytest

```
pytest -q  →  240 passed in 20.62s
EXIT CODE = 0
```

**240 passed · 0 failed · 0 skipped · exit 0.** Coincide exactamente con lo que afirman
`backend/README.md:64`, `handoff.md:25` y `CLAUDE.md`.

Reparto por archivo (funciones `def test_`, sin expandir `parametrize`; por eso suman 198 y no 240):
`test_esquema_v2.py` 21 · `test_m12_ateneos.py` 68 · `test_m12_catalogos.py` 28 ·
`test_m12_consenso.py` 18 · `test_m12_severidad.py` 25 · `test_m12_talleres.py` 18.

### Los tres identificadores del enunciado

| Id | Qué es | ¿Está en la rama actual? |
|---|---|---|
| `d37a59e` | **Commit git.** `test(infra): guardia de entorno en pytest — se acabó el "passed" con exit 0` | **SÍ** (`git merge-base --is-ancestor d37a59e HEAD` → verdadero) |
| `f432ea139fd9` | **NO es un commit git** (`git cat-file` → `Not a valid object name`). Es un **id de revisión de Alembic**: la migración de M12.4 | **NO existe ya como archivo.** Reemplazada al regenerar la migración en M12.7 (regla §5.19). Sobrevive sólo como cita en `docs/planes/PLAN-M12-...md:304`, `handoff.md:1085`, `handoff.md:1533`, `handoff.md:1547`, `docs/prompts/prompt-sesion-demo-F1-ajustes-frontend.md:126` y `herramientas/verificar_estado.py:10` |
| `9246e659d2c9` | **NO es un commit git.** Es el **id de revisión de Alembic vigente** | **SÍ, es el head actual.** Archivo: `alembic/versions/9246e659d2c9_esquema_v2_inicial_m12_7.py:15` (`revision: str = '9246e659d2c9'`) |

---

## BLOQUE 1 — La tabla `idea` (va a pasar a ANUAL)

### Columnas, PK, índices y constraints reales (`\d idea`)

**23 columnas:**
`id` (integer, NOT NULL, `nextval('idea_id_seq')`) · `hce_id` (integer, **NOT NULL**) · `dim` (jsonb) ·
`fecha_consenso` (date) · `sesiones` (integer) · `sintesis` (text) · `objetivos` (text) ·
`manual_version` (varchar(60)) · `total` (integer) · `esc_a`/`esc_b`/`esc_c`/`esc_d` (integer) ·
`firmado` (boolean, NOT NULL) · `firmas` (jsonb) · `addendas` (jsonb) · `excepcion` (jsonb) ·
`evaluador_t1_id` (integer) · `evaluador_t2_id` (integer) · `sistema_origen` (varchar(120)) ·
`fecha_original` (date) · `fecha_migracion` (date) · `responsable_migracion` (varchar(120)).

**PK:** `pk_idea PRIMARY KEY, btree (id)` — id sintético propio.

**Índices:**

```
pk_idea                  PRIMARY KEY, btree (id)
ix_idea_evaluador_t1_id  btree (evaluador_t1_id)
ix_idea_evaluador_t2_id  btree (evaluador_t2_id)
ix_idea_hce_id           btree (hce_id)
```

**CHECK:**

```
ck_idea_evaluadores_distintos  CHECK (evaluador_t1_id IS NULL OR evaluador_t2_id IS NULL
                                      OR evaluador_t1_id <> evaluador_t2_id)
ck_idea_rango_total            CHECK (total IS NULL OR total >= 0 AND total <= 96)
```

**FK salientes:** `hce_id → hce_diurna.id ON DELETE CASCADE` · `evaluador_t1_id → profesional.id` ·
`evaluador_t2_id → profesional.id`.

### ¿Existe algún UNIQUE sobre `hce_id`?

**NO.** El único índice sobre `hce_id` es **`ix_idea_hce_id btree (hce_id)`, no único**. Confirmado en
las tres capas:

- **Base:** `\d idea` no lista ningún UNIQUE CONSTRAINT.
- **Migración:** `alembic/versions/9246e659d2c9_...py:392` →
  `op.create_index(op.f('ix_idea_hce_id'), 'idea', ['hce_id'], unique=False)`.
- **Modelo:** `app/models/modulos.py:233-235` → `mapped_column(ForeignKey("hce_diurna.id",
  ondelete="CASCADE"), index=True)`; el `__table_args__` (`modulos.py:261-268`) sólo trae los dos CHECK.

`idea` **ya es 1:N por expediente**. Es lo que `handoff.md` §5.35 (líneas 904-922) ya había medido.

### FKs que apuntan a `idea.id`

**Una sola.**

| Origen | archivo:línea | ondelete |
|---|---|---|
| `puntuacion_idea.idea_id` | `app/models/modulos.py:301` → `ForeignKey("idea.id", ondelete="CASCADE"), index=True` | **CASCADE** |

Confirmado desde la base (`\d idea` → *Referenced by:* `fk_puntuacion_idea_idea_id_idea … ON DELETE
CASCADE`) y desde la migración (`grep "'idea'"` en `9246e659d2c9_...py` sólo devuelve el `create_table`,
sus 3 índices y los `drop` del downgrade).

### Sitios donde aparece la idea de «línea base única»

Barrido: `grep -rn -i "línea base|linea base|HCE-LB"` sobre `*.md *.py *.js *.html *.json`, excluyendo
`graphify-out/` y `__pycache__/`. **237 ocurrencias en 33 archivos.** El grueso son fuentes y capturas
del harness (no son afirmaciones del equipo). Lo que sí **afirma la unicidad**:

**En el código (3 líneas, todas del mismo docstring):**

| archivo:línea | Texto |
|---|---|
| `app/models/modulos.py:211` | `"""HCE-LB — el IDEA como **línea base única**, no como evaluación anual.` |
| `app/models/modulos.py:214` | `una fila por dimensión). Ahora hay una instancia por línea base y las 12` |
| `app/models/modulos.py:218-219` | `Es 1:N y no 1:1 porque un reingreso a más de 12 meses genera una **línea base nueva**; la vigente es la de mayor 'fecha_consenso'.` |

⚠️ **El docstring se contradice a sí mismo y el código sigue la segunda mitad:** dice «línea base
**única**» en `:211` y «**es 1:N**» en `:218`. El esquema implementa 1:N.

**En los tests (2 líneas, 1 test):**

| archivo:línea | Qué |
|---|---|
| `tests/test_esquema_v2.py:54` | `def test_idea_admite_varias_lineas_base_por_expediente(db):` |
| `tests/test_esquema_v2.py:55` | `"""1:N a propósito: un reingreso a más de 12 meses abre una línea base nueva."""` |

Es **el único nombre de test** del repo que menciona la línea base, y **afirma lo contrario de la
unicidad**: fija que dos `Idea` con el mismo `hce_id` conviven.

**En `backend/docs/esquema-datos-v2.md` (4 ocurrencias):**

| línea | Qué dice |
|---|---|
| `:48` | Diagrama ER: `HCE_DIURNA \|\|--o{ IDEA : "HCE-LB (1:N por reingreso >12m)"` — **coherente con el código** |
| `:171` | Tabla §2: «1:N — reingreso >12 meses = instancia nueva; la vigente es la de mayor `fecha_consenso`» — **coherente** |
| `:354` | Tabla de migración v1→v2: «`idea` **línea base única** con `dim JSONB`» — **contradice a `:48` y `:171` dentro del mismo documento** |
| `:439` | «si IPPU pide cambios en la línea base única, se ajusta `idea` **antes de M11.2**» — **precondición vencida**: M11.2 se cerró el 2026-08-07 |

**En el resto de la documentación** (afirmaciones, no capturas): `README.md:46` · `handoff.md` líneas
12, 96, 97, 219, 736, 756, 1016, 1323, 1324, 1379, 1381, 1406, 1794 ·
`docs/planes/PLAN-modular-adaptacion-HCE-2026-07.md` líneas 81, 87, 134, 147 ·
`docs/planes/agenda-reunion-ippu-2026-08.md:403` · `docs/notas/puntos-a-validar.md` líneas 26, 37 ·
`docs/notas/respuestas-reunion-ippu-2026-08-21.md` líneas 120, 128 ·
`docs/markdown/prototipo-v4-referencia.md` (1) ·
`docs/markdown/apartado-especificaciones-tecnicas-prototipo-v4.md` (3) ·
`docs/markdown/1_documento-tecnico-utec-lidia.md` (6) · `docs/markdown/modelo-datos.md` (1).

**Capturas del harness y fuentes (no son afirmaciones del equipo):**
`demo/verificacion/baseline.json` (23) · `mut41.json` (23) · `mut42.json` (23) ·
`docs/prototipo-v4/HCE_IPPU_Prototipo_v4.html` (25) · `docs/fuentes/HCE_IPPU_Prototipo_v1.html` (22) ·
`docs/prototipo-v4/prototipo-v4-catalogos.json` (5) · `demo/js/*.js` (39 en 7 archivos) ·
`demo/index.html` (9) · `backend/app/data/catalogos_iniciales.json` (1) ·
`herramientas/generar_catalogos_backend.py` (1) · `app/models/transversales.py` (1) ·
`docs/guias/notas-accesibilidad-ui.md` (1).

### Tests que construyen `Idea(`

**9 construcciones en 3 archivos** (`grep -rn "\bIdea("` en `tests/`, excluyendo `BandaIdea(` y
`PuntuacionIdea(`):

| Archivo | Nº | Líneas |
|---|---|---|
| `tests/test_esquema_v2.py` | **4** | 44, 49, 57, 58 |
| `tests/test_m12_consenso.py` | **4** | 40, 294, 297, 305 |
| `tests/test_m12_severidad.py` | **1** | 388 |

Ninguna pasa un año ni depende de unicidad por expediente. `test_esquema_v2.py:57-58` construye **dos
`Idea` sobre el mismo `hce.id`** a propósito.

### ¿Existe ya alguna columna `anio` en `idea`, o algo equivalente?

**NO.** `\d idea` no tiene `anio` ni nada temporal salvo `fecha_consenso` (date, nullable) y los campos
de migración (`fecha_original`, `fecha_migracion`). `grep -rn "anio" app/models/*.py` devuelve `anio` en
`grupo` (`identidad.py:122`), `protocolo` (`modulos.py:346`), `informe_cierre` (`modulos.py:438`) y
`ateneo.anio_correlativo` (`ateneo.py:146`) — **en `idea` no aparece**.

Lo más cercano a un discriminador temporal es **`fecha_consenso`** (`modulos.py:237`), y la regla de
resolución («la vigente es la de mayor `fecha_consenso`») vive **sólo en prosa**, en el docstring
`modulos.py:218-219`. No hay código que la aplique — no existe capa de servicios (BLOQUE 7).

---

## BLOQUE 2 — Consentimiento y motor de flujo

### ¿Dónde está implementada la regla «sin consentimiento firmado no se avanza»?

**En un solo lugar de todo el repo: la demo (front).** No existe en el backend, ni en la base, ni en
ningún test.

| Capa | Estado | Evidencia |
|---|---|---|
| **Base de datos (CHECK/trigger)** | **NO existe** | `\d consentimiento` → 0 CHECK constraints. Ninguna otra tabla tiene CHECK que mire el consentimiento. `handoff.md` §5.2.2 prohíbe triggers, y no hay ninguno |
| **Servicio Python** | **NO existe** | `app/services/` **no existe** (`find app -name "*.py"` → 17 archivos, ninguno de servicios). `app/routers/__init__.py` y `app/schemas/__init__.py` pesan **0 bytes** |
| **Modelo SQLAlchemy** | Sólo la **tabla**, sin regla | `app/models/modulos.py:193-207` (`class Consentimiento(FirmaMixin, Base)`). Su docstring `:194` dice «El único bloqueo sin excepción posible de todo el flujo (§4.2)» — **es prosa, sin código que la ejecute** |
| **Tests** | **CERO** | `grep -rci "consentimiento" tests/*.py` → `conftest.py:0 · test_esquema_v2.py:0 · test_m12_ateneos.py:0 · test_m12_catalogos.py:0 · test_m12_consenso.py:0 · test_m12_severidad.py:0 · test_m12_talleres.py:0`. **Ningún test del backend menciona la palabra** |
| **Demo (front)** | **SÍ — acá y sólo acá** | `demo/js/flujo.js:54-64`, función `moduloHabilitado(nna, key)` |

Código exacto de la única implementación (`demo/js/flujo.js:50-64`):

```js
/* --- Reglas de secuencia (§4.1 / §4.2) -------------------------------
   ¿El módulo está habilitado para editar/firmar? (independiente de si ya está firmado)
   Devuelve {habilitado, exceptuable, motivoBloqueo}.
   Regla dura: sin CI firmado nada se habilita, y eso NO es exceptuable (§4.2). */
function moduloHabilitado(nna, key){
  if(key==="ci") return {habilitado:true, exceptuable:false, motivoBloqueo:""};
  if(!nna.flujo.ci.firmado){
    return {habilitado:false, exceptuable:false,
      motivoBloqueo:"Requiere Consentimiento Informado firmado — único requisito no exceptuable (§4.2)."};
  }
  const prev = SECUENCIA[SECUENCIA.indexOf(key)-1];
  const habilitado = nna.flujo[prev].firmado || !!nna.flujo[key].excepcion;
  return {habilitado, exceptuable:true,
    motivoBloqueo: habilitado ? "" : `Requiere ${modInfo(prev).full} firmado o habilitación excepcional.`};
}
```

**Consumidores del resultado** (renderizan el bloqueo, no lo definen): `demo/js/flujo.js:69, 112,
144-145, 331, 355` · `demo/js/evaluaciones.js:195, 197, 230, 241` ·
`demo/js/informe-cierre.js:97, 99, 129, 139`. El estado derivado `estadoModulo()`
(`demo/js/flujo.js:67-70`) lo consumen además `demo/js/expediente.js` (2 usos),
`demo/js/grupos-usuario.js` (2) y `demo/js/ui-core.js` (1).

**El dato seed que ejercita la regla:** `demo/js/flujo.js:467` — *«Arquetipo 4 — Bruno (107):
consentimiento pendiente → todo bloqueado (estado por defecto de initFlujo).»*

### ¿Es regla de base de datos, de servicio, o sólo de la demo?

**Sólo de la demo (front).** Ni de base de datos ni de servicio. En el backend está **documentada**
(`modulos.py:194`, `esquema-datos-v2.md` §4) y **no implementada**.

### ¿Qué campos tiene hoy el consentimiento?

`\d consentimiento` — **9 columnas**, ninguna obligatoria salvo la PK y `firmado`:

| Columna | Tipo | Nullable | Origen |
|---|---|---|---|
| `hce_id` | integer | **NOT NULL** (PK) | `modulos.py:200-202` — PK = `hce_id`, FK a `hce_diurna` ON DELETE CASCADE |
| `firmante` | varchar(120) | **NULL** | `modulos.py:203` |
| `fecha` | date | **NULL** | `modulos.py:204` |
| `autorizaciones` | jsonb | **NULL** | `modulos.py:206` — `{evaluacion, registro, comunicacion}` |
| `documento_id` | integer | **NULL** | `modulos.py:207` — FK a `documento.id` |
| `firmado` | boolean | **NOT NULL** (default false) | `FirmaMixin`, `modulos.py:55` |
| `firmas` | jsonb | **NULL** | `FirmaMixin`, `modulos.py:56` |
| `addendas` | jsonb | **NULL** | `FirmaMixin`, `modulos.py:57` |
| `excepcion` | jsonb | **NULL** | `FirmaMixin`, `modulos.py:58` |

**Índices:** `pk_consentimiento PRIMARY KEY btree (hce_id)` · `ix_consentimiento_documento_id`.
**CHECK:** ninguno.

**¿Alcanzan para «nombre del responsable + botón firmar + fecha»?** **Sí, y sobra.** El mínimo pedido
mapea directo a `firmante` (varchar 120) + `firmado` (boolean) + `fecha` (date).

**¿Hay campos obligatorios de más?** **No.** El único NOT NULL además de la PK es `firmado`, con default
`false` (`modulos.py:55`). `autorizaciones`, `documento_id`, `firmas`, `addendas` y `excepcion` son
nullable: **una fila con sólo `hce_id` + `firmante` + `fecha` + `firmado` es válida hoy contra la
base.** Los campos de más existen pero no obligan a nada.

⚠️ Nota de forma: `firmante` es **texto libre, no FK** — el que firma es la familia, no un
`profesional`. Coherente con lo pedido.

### Si mañana hubiera que dejar avanzar el expediente SIN consentimiento firmado

**Números medidos, no estimados:**

| Qué | Cuántos |
|---|---|
| **Archivos de backend a tocar** | **0** — la regla no existe ahí |
| **Tests a tocar (todo el repo)** | **0** — 0 tests del backend mencionan «consentimiento»; la demo no tiene tests unitarios (`find demo -name "*test*" -o -name "*.spec.js"` → vacío) |
| **Archivos de la demo a tocar para cambiar la regla** | **1** — `demo/js/flujo.js`, líneas 56-59 (el bloque `if(!nna.flujo.ci.firmado)`) |
| **Archivos de la demo a tocar si además se retira el arquetipo que la ilustra** | **1** — el mismo (`demo/js/flujo.js:467`) |
| **Archivos que consumen el resultado y NO hay que tocar** | **5** — `evaluaciones.js`, `informe-cierre.js`, `expediente.js`, `grupos-usuario.js`, `ui-core.js`: llaman a `moduloHabilitado()`/`estadoModulo()` y renderizan lo que devuelvan |
| **Baselines del harness a regenerar** | **0 archivos versionados.** `demo/verificacion/.gitignore` ignora `*.json`; `git ls-files verificacion/` → sólo `.gitignore`, `README.md`, `comparar.js`, `fingerprint.js`. El paso `A2_motor_flujo_inicial` (`fingerprint.js:101-107`) **sí capturaría la diferencia** (vuelca `moduloHabilitado` de cada NNA), pero no hay assert: `comparar.js` compara, no afirma |

**Total: 1 archivo, 0 tests.**

---

## BLOQUE 3 — Fotos y autorización de imagen

### ¿Dónde se valida la autorización de imagen?

**Igual que el consentimiento: sólo en la demo.** En el backend hay tablas y un docstring, no una regla.

**Backend — lo que existe:**

- `autorizacion_imagen` (`app/models/transversales.py:92-104`): PK = `hce_id` (0..1 por expediente),
  `registrada boolean NOT NULL`, `fecha date`, `documento_id` FK. **Sin CHECK.**
- `foto` (`app/models/transversales.py:107-131`): un solo CHECK,
  `ck_foto_individual_xor_grupal CHECK (num_nonnulls(hce_id, grupo_id) = 1)` — es **XOR de forma**, no de
  permiso.
- El propio docstring lo dice (`transversales.py:113-116`): *«Lo que **no** va en la BD es el permiso:
  una foto individual exige la autorización del NNA, y una grupal la de **todas** las familias activas
  del grupo. Eso lo verifica **el servicio**»* — **y el servicio no existe** (BLOQUE 7).
- **4 tests tocan `Foto`** (`tests/test_esquema_v2.py:130, 138, 147, 153`) y **los 4 prueban el XOR
  estructural**, ninguno el permiso. `grep -rni "autorizacion_imagen\|AutorizacionImagen"` en `tests/`
  → **0 resultados**.

**Demo — la única validación real** (`demo/js/hce-doc-org-vf.js:117-124`, foto **individual**):

```js
/* REGLA DURA (§8.4): la verificación vive acá, no en la UI — llamar subirFoto
   sin autorización registrada se bloquea aunque el botón no exista en pantalla. */
function subirFoto(id){
  const p = NNA.find(n=>n.id===id); if(!p) return;
  if(!(p.autImagen && p.autImagen.registrada)){
    toast("🚫 Carga bloqueada: falta la autorización de uso de imagen registrada (art. 11, CNA — Ley N.º 17.823). Registrala en HCE-DOC.");
    return;
  }
```

### ¿Bloquea GUARDAR o bloquea COMPARTIR/exportar?

**Bloquea GUARDAR.** El guard está en `subirFoto()` **antes** del `p.fotos.push(...)`
(`hce-doc-org-vf.js:127`). No hay ningún punto del código donde se controle una salida.

### ¿Existe alguna noción de «compartir» o «exportar» en el modelo?

**NO. Todo lo que hay es almacenamiento.**

`grep -rni "compartir|exportar|export|pdf|difusion|difundir|publicar" app/ --include=*.py` devuelve
**exactamente una línea, y es un comentario**: `app/models/modulos.py:429` — *«El PDF se genera desde
acá y sólo desde acá: si el informe no está firmado, no hay informe.»* Docstring de `InformeCierre`.
**No hay implementación** (BLOQUE 5).

No existen columnas ni tablas de compartición, destinatario, exportación, publicación o entrega. `foto`
guarda `archivo_ref varchar(400)` (`transversales.py:127`) y nada más; `documento` guarda
`archivo_ref varchar(400)` (storage real diferido a Fase 6, `esquema-datos-v2.md:266`).

⚠️ Detalle de vocabulario, no de modelo: la demo usa la palabra «publicar» en un texto de UI
(`demo/js/grupos-usuario.js:219`: *«para publicar fotografías grupales…»*), pero lo que deshabilita es
**la carga**, no una salida.

### Autorización grupal (foto con varios NNA)

**Backend:** nada. `foto.grupo_id` es FK a `grupo.id` (**sin ondelete**, `transversales.py:124`) y el
XOR impide que una foto sea individual y grupal a la vez. No hay tabla ni columna que exprese «todas las
familias del grupo autorizaron».

**Demo:** `demo/js/recordatorios.js:39-55`.

```js
/* Fotos grupales (§8.4): requieren autorización de TODAS las familias del grupo. */
const GRUPOS_FOTOS = {};   // grupo -> [{desc, fecha}] (en memoria, demo)
function grupoAutImagen(gid){
  const miembros = NNA.filter(n=>n.grupo===gid && n.activo);
  const faltan = miembros.filter(n=>!(n.autImagen && n.autImagen.registrada));
  return {miembros, faltan, ok: miembros.length>0 && faltan.length===0};
}
function subirFotoGrupo(gid){
  const g = grupoAutImagen(gid);
  if(!g.ok){
    toast(`🚫 Foto grupal bloqueada (§8.4): falta autorización de uso de imagen de ${...}.`);
    return;
  }
```

Mismo patrón: **bloquea el guardado**, con el mismo criterio (`ok` exige `miembros.length>0` y
`faltan.length===0`). La UI que lo refleja está en `demo/js/grupos-usuario.js:207-222`. Las fotos
grupales de la demo viven **en memoria** (`GRUPOS_FOTOS`, `recordatorios.js:40`), no en el array `NNA`.

---

## BLOQUE 4 — La tabla `grupo`

### Columnas y constraints reales (`\d grupo`)

**11 columnas:**

| Columna | Tipo | Nullable |
|---|---|---|
| `id` | integer | NOT NULL (`nextval('grupo_id_seq')`) |
| `nombre` | varchar(60) | **NOT NULL** |
| `anio` | **smallint** | **NOT NULL** |
| `franja` | varchar(60) | NULL |
| `dias` | varchar(60) | NULL |
| `horario` | varchar(60) | NULL |
| `tecnico1_id` | integer | NULL |
| `tecnico1_rol` | varchar(60) | NULL |
| `tecnico2_id` | integer | NULL |
| `tecnico2_rol` | varchar(60) | NULL |
| `obs` | text | NULL |

**Índices y constraints:**

```
pk_grupo               PRIMARY KEY, btree (id)
uq_grupo_nombre_anio   UNIQUE CONSTRAINT, btree (nombre, anio)
ix_grupo_tecnico1_id   btree (tecnico1_id)
ix_grupo_tecnico2_id   btree (tecnico2_id)
```

**CHECK:** ninguno. **FK salientes:** `tecnico1_id → profesional.id`, `tecnico2_id → profesional.id`
(ambas **sin ondelete**).

Modelo: `app/models/identidad.py:91-136`. La identidad real es `UNIQUE(nombre, anio)`
(`identidad.py:136`); el docstring `:107` explica por qué.

### ¿Cómo se modelan los técnicos a cargo?

**Dos columnas fijas, no una tabla de asignación.** `tecnico1_id`/`tecnico1_rol` y
`tecnico2_id`/`tecnico2_rol` — dos FK nullable a `profesional` más su rol como **texto libre**
(varchar(60)), no FK ni catálogo.

**Consecuencias medidas:**
- **El techo es 2 técnicos por grupo.** Un tercero no entra sin migración.
- **No hay vigencias**: si un técnico cambia a mitad de año se pisa la columna y no queda rastro (es el
  residuo que `handoff.md` §5.18 registra).
- **No existe ninguna tabla de asignación técnico↔grupo** (confirmado en BLOQUE 7).

### Valores sembrados hoy (SELECT)

```sql
SELECT * FROM grupo ORDER BY id;
```

**4 filas**, todas con **`anio = 2026`** y todos los campos opcionales vacíos:

| id | nombre | anio | franja | dias | horario | tecnico1_id | tecnico1_rol | tecnico2_id | tecnico2_rol | obs |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Grupo Azul | 2026 | ∅ | ∅ | ∅ | NULL | ∅ | NULL | ∅ | ∅ |
| 2 | Grupo Celeste | 2026 | ∅ | ∅ | ∅ | NULL | ∅ | NULL | ∅ | ∅ |
| 3 | Grupo Naranja | 2026 | ∅ | ∅ | ∅ | NULL | ∅ | NULL | ∅ | ∅ |
| 4 | Grupo Verde | 2026 | ∅ | ∅ | ∅ | NULL | ∅ | NULL | ∅ | ∅ |

Origen: `herramientas/generar_catalogos_backend.py:99-100`
(`GRUPOS_ANIO = 2026` · `GRUPOS = ["Grupo Azul", "Grupo Celeste", "Grupo Naranja", "Grupo Verde"]`)
→ `:346` (`datos["grupo"] = [{"nombre": n, "anio": GRUPOS_ANIO} for n in GRUPOS]`).

⚠️ **Los 4 grupos existen sin técnicos asignados** — ninguna fila tiene `tecnico1_id`/`tecnico2_id`, y
no hay filas en `profesional` (0, ver BLOQUE 9).

### FKs que apuntan a `grupo.id`

**Tres** (`\d grupo` → *Referenced by:*):

| Origen | Constraint | ondelete |
|---|---|---|
| `ateneo.grupo_id` | `fk_ateneo_grupo_id_grupo` | **RESTRICT** |
| `foto.grupo_id` | `fk_foto_grupo_id_grupo` (`transversales.py:124`) | **ninguno** (`NO ACTION`) |
| `hce_diurna.grupo_id` | `fk_hce_diurna_grupo_id_grupo` (`identidad.py:160`) | **ninguno** (`NO ACTION`) |

### ¿Existe algún endpoint, servicio, script o función que CREE un grupo desde la aplicación?

**NO. Explícitamente: no existe ninguno.** Evidencia:

- **Endpoints:** `app/routers/__init__.py` pesa **0 bytes** y el directorio no tiene otro archivo
  (`ls app/routers/` → `__init__.py` + `__pycache__`). `app/main.py` (36 líneas) monta **sólo `/health`**
  (`main.py:33-36`) y **no incluye ningún router**.
- **Servicios:** `app/services/` no existe.
- **Schemas:** `app/schemas/__init__.py` pesa **0 bytes**.
- **Scripts:** el único que escribe `Grupo` es `app/seed_catalogos.py:169-172`.
- La demo crea grupos sólo en memoria de JS, sin backend.

**El único camino que crea un grupo hoy es el seed.**

### ¿El seed de `grupo` es insert-only? ¿Qué test lo fija?

**Sí, insert-only.** `app/seed_catalogos.py:167-172`:

```python
# Los 4 grupos por color (D9) como punto de partida del año en curso.
# Insert-only: de acá en más los administran coordinación.
nuevas, act = _sincronizar(
    db, Grupo, datos["grupo"], ("nombre", "anio"), solo_insertar=True
)
```

El mecanismo está en `_sincronizar` (`seed_catalogos.py:92`): con `solo_insertar=True` la rama `elif`
que actualiza campos **no se ejecuta**. El porqué está en `seed_catalogos.py:72-75`.

⚠️ **`grupo` es el único catálogo con `solo_insertar=True`** — no está en la lista `CATALOGOS`
(`seed_catalogos.py:108-134`) ni en `COMPUESTOS` (`:137-140`), se siembra aparte.

**Tests que lo fijan — 5, todos en `tests/test_m12_catalogos.py`:**

| Test | Línea |
|---|---|
| `test_el_mismo_grupo_puede_existir_en_dos_anios` | `:29` |
| `test_grupo_rechaza_dos_filas_del_mismo_nombre_y_anio` | `:46` |
| `test_grupos_distintos_del_mismo_anio_conviven` | `:55` |
| `test_el_seed_trae_los_cuatro_grupos_por_color` | `:61` |
| **`test_el_seed_no_pisa_un_grupo_ya_configurado`** | **`:68`** ← el que fija el insert-only |

---

## BLOQUE 5 — Informes

### Forma real de `informe_cierre` (`\d informe_cierre`)

**14 columnas:**

| Columna | Tipo | Nullable |
|---|---|---|
| `id` | integer | NOT NULL (`nextval('informe_cierre_id_seq')`) |
| `hce_id` | integer | **NOT NULL** |
| `anio` | integer | **NOT NULL** |
| `fecha` | date | NULL |
| `sint_escala` | jsonb | NULL |
| `val_tec1` | text | NULL |
| `val_tec2` | text | NULL |
| `recomendaciones` | text | NULL |
| `orientaciones` | text | NULL |
| `recibi` | jsonb | NULL |
| `firmado` | boolean | **NOT NULL** |
| `firmas` | jsonb | NULL |
| `addendas` | jsonb | NULL |
| `excepcion` | jsonb | NULL |

**Índices:** `pk_informe_cierre PRIMARY KEY btree (id)` · `ix_informe_cierre_hce_id btree (hce_id)`.

**UNIQUE:** `uq_informe_cierre_hce_anio UNIQUE CONSTRAINT, btree (hce_id, anio)` — modelo:
`app/models/modulos.py:451`. Es **1:N anual**, la corrección del «bug A» (`modulos.py:425-427`).

**FK:** `hce_id → hce_diurna.id ON DELETE CASCADE`. **CHECK:** ninguno.
**FKs entrantes:** ninguna (`\d` no lista *Referenced by*).

Modelo completo: `app/models/modulos.py:422-452`.

### ¿Existe alguna otra entidad de informe?

**NO.**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema='public' AND table_name LIKE '%inform%';
--> informe_cierre   (1 fila)
```

**¿Algo con destinatario, solicitante o tipo de informe?** **NO.**
`grep -rni "destinatario|solicitante|tipo_informe" app/ --include=*.py` → **0 resultados** (los únicos
hits de `informe_` son referencias a `informe_cierre` en docstrings: `ateneo.py:145`,
`identidad.py:108`, `identidad.py:148`).

El docstring `modulos.py:423` lo llama *«El único informe válido» (§5.3)*, y el modelo lo cumple.

⚠️ **SÓLO DOCUMENTADO:** `demo/js/hce-doc-org-vf.js:143-144` afirma *«El informe que se comparte con
organismos supervisores es SIEMPRE el documento único HCE-IC (§5.3)»* — no hay nada en el backend que
registre a quién se le entregó ni cuándo (BLOQUE 3: no hay noción de compartir/exportar).

### ¿Hay generación de PDF implementada en el backend?

**NO.** Barrido `grep -rni "pdf" app/ --include=*.py` → **1 sola línea, y es un comentario**:
`app/models/modulos.py:429`.

Corroboración por dependencias: `requirements.txt` no trae **ninguna** librería de PDF — sin
`reportlab`, `weasyprint`, `fpdf`, `wkhtmltopdf` ni similar. Lo que hay es
`fastapi`/`uvicorn`/`pydantic`/`pydantic-settings`/`SQLAlchemy`/`alembic`/`psycopg` +
`passlib[bcrypt]`/`python-jose`/`python-multipart` (marcadas «Autenticación (Fase 4)») +
`pytest`/`httpx`.

En la **demo** sí hay una vista de informe (`demo/js/informe-cierre.js`, 11.665 bytes), pero es render en
pantalla, no generación de archivo.

---

## BLOQUE 6 — Ateneos

### `ateneo` — columnas reales (`\d ateneo`)

**20 columnas.** Modelo: `app/models/ateneo.py` (25.808 bytes).

| Columna | Tipo | Nullable | Bloque |
|---|---|---|---|
| `id` | integer | NOT NULL | — |
| `anio_correlativo` | **smallint** | **NOT NULL** | correlativo (`ateneo.py:146`) |
| `numero` | **smallint** | **NOT NULL** | correlativo (`ateneo.py:166`) |
| `tipo` | varchar(20) | **NOT NULL** | discriminador (`ateneo.py:169`) |
| `fecha` | date | **NOT NULL** | (`ateneo.py:171`) |
| `titulo` | varchar(200) | **NOT NULL** | (`ateneo.py:174`) |
| `hce_referida_id` | integer | NULL | referencia al NNA |
| `grupo_id` | integer | NULL | referencia al grupo |
| `autor_id` | integer | NULL | (`ateneo.py:236` explica el nullable) |
| `participantes` | text | NULL | **común a los 4 tipos** (`ateneo.py:257`) |
| `situacion` | text | NULL | Desarrollo clínico (`ateneo.py:260`) |
| `hipotesis` | text | NULL | Desarrollo clínico |
| `recursos` | text | NULL | Desarrollo clínico |
| `seguimiento` | text | NULL | Desarrollo clínico |
| `capacitador` | varchar(200) | NULL | Jornada |
| `modalidad` | varchar(200) | NULL | Jornada |
| `contenidos` | text | NULL | Jornada |
| `materiales` | text | NULL | Jornada |
| `evaluacion` | text | NULL | Jornada |

**Índices:**

```
pk_ateneo                 PRIMARY KEY, btree (id)
uq_ateneo_correlativo     UNIQUE CONSTRAINT, btree (anio_correlativo, numero)
ix_ateneo_autor_id        btree (autor_id)
ix_ateneo_fecha           btree (fecha)
ix_ateneo_grupo_id        btree (grupo_id)
ix_ateneo_hce_referida_id btree (hce_referida_id)
ix_ateneo_tipo            btree (tipo)
ix_ateneo_titulo          btree (titulo)
```

**8 CHECK** — 5 escritos contra `tipo`, 3 de dominio:

```sql
-- Los 5 contra el discriminador `tipo`:
ck_ateneo_campos_de_jornada_solo_en_jornada
  CHECK (tipo::text = 'jornada'::text OR NOT (capacitador ~ '[^[:space:]]' OR modalidad ~ '[^[:space:]]'
         OR contenidos ~ '[^[:space:]]' OR materiales ~ '[^[:space:]]' OR evaluacion ~ '[^[:space:]]'))
ck_ateneo_desarrollo_clinico_no_va_en_jornada
  CHECK (tipo::text <> 'jornada'::text OR NOT (situacion ~ '[^[:space:]]' OR hipotesis ~ '[^[:space:]]'
         OR recursos ~ '[^[:space:]]' OR seguimiento ~ '[^[:space:]]'))
ck_ateneo_grupo_requerido_en_ateneo_de_grupo
  CHECK (tipo::text <> 'grupo'::text OR grupo_id IS NOT NULL)
ck_ateneo_grupo_solo_con_sujeto
  CHECK (tipo::text = ANY (ARRAY['clinico','grupo']) OR grupo_id IS NULL)
ck_ateneo_nna_solo_en_ateneo_clinico
  CHECK ((hce_referida_id IS NOT NULL) = (tipo::text = 'clinico'::text))

-- Los 3 de dominio:
ck_ateneo_tipo_valido     CHECK (tipo::text = ANY (ARRAY['clinico','grupo','institucional','jornada']))
ck_ateneo_rango_numero    CHECK (numero >= 1 AND numero <= 999)
ck_ateneo_titulo_no_vacio CHECK (titulo::text ~ '[^[:space:]]')
```

**FK salientes:** `autor_id → profesional.id **ON DELETE RESTRICT**` ·
`grupo_id → grupo.id **ON DELETE RESTRICT**` ·
`hce_referida_id → hce_diurna.id **ON DELETE RESTRICT**`.
**FK entrantes:** `ateneo_acuerdo.ateneo_id` (CASCADE) y `documento.ateneo_id` (CASCADE).

### `ateneo_acuerdo` — columnas reales (`\d ateneo_acuerdo`)

**6 columnas:**

| Columna | Tipo | Nullable |
|---|---|---|
| `id` | integer | NOT NULL |
| `ateneo_id` | integer | **NOT NULL** |
| `acuerdo` | text | **NOT NULL** |
| `responsable_rol` | varchar(80) | NULL |
| `plazo` | date | NULL |
| `orden` | integer | **NOT NULL** |

**Índices:** `pk_ateneo_acuerdo PRIMARY KEY btree (id)` · `ix_ateneo_acuerdo_ateneo_id btree (ateneo_id)`.
**CHECK (1):** `ck_ateneo_acuerdo_acuerdo_no_vacio CHECK (acuerdo ~ '[^[:space:]]')`.
**FK:** `ateneo_id → ateneo.id ON DELETE CASCADE`.

⚠️ `responsable_rol` es **texto, no FK a `profesional`** — lo fija
`test_el_responsable_del_acuerdo_es_un_rol_y_no_una_fk` (`tests/test_m12_ateneos.py:536`).

### ¿Cómo está definida AT_TIPOS y cuáles son las 4 claves exactas?

⚠️ **En el backend NO se llama `AT_TIPOS`, se llama `ATENEO_TIPOS`.** `AT_TIPOS` es el nombre en el
Prototipo v4. `grep -n "AT_TIPOS" app/` → 0 resultados fuera del comentario `constantes.py:155`.

Definición: `app/core/constantes.py:184-189`.

```python
ATENEO_TIPOS: dict[str, str] = {
    "clinico":       "Ateneo clínico (NNA)",
    "grupo":         "Ateneo de grupo",
    "institucional": "Ateneo institucional",
    "jornada":       "Jornada de capacitación",
}
```

**Las 4 claves exactas: `clinico` · `grupo` · `institucional` · `jornada`** (sin tilde en `clinico`).
Es **constante, no catálogo** — el porqué está en `constantes.py:159-183`, y lo fija
`test_los_tipos_de_ateneo_no_entraron_como_catalogo` (`tests/test_m12_ateneos.py:672`). Que la constante
y el CHECK no puedan divergir lo fija `test_el_check_y_la_constante_no_pueden_divergir`
(`test_m12_ateneos.py:148`); que las etiquetas sean las del prototipo,
`test_las_etiquetas_son_las_del_prototipo` (`:162`). También existe
`ATENEO_CODIGO_PREFIJO = "AT"` (`constantes.py:203`).

### ¿Existe un campo de observaciones?

**NO.** `grep -n -i "observ" app/models/ateneo.py` → 2 hits, y los dos son **referencias a la tabla
`observacion` en comentarios** (`ateneo.py:131` y `:236`), no una columna.

**Campos de texto libre que sí existen y para qué tipo aplica cada uno:**

| Campo | Tipo SQL | Aplica a | Impuesto por |
|---|---|---|---|
| `participantes` | text | **los 4 tipos** | ningún CHECK lo restringe (`ateneo.py:257`) |
| `situacion` | text | `clinico`, `grupo`, `institucional` — **prohibido en `jornada`** | `ck_ateneo_desarrollo_clinico_no_va_en_jornada` |
| `hipotesis` | text | ídem | ídem |
| `recursos` | text | ídem | ídem |
| `seguimiento` | text | ídem | ídem |
| `capacitador` | varchar(200) | **sólo `jornada`** | `ck_ateneo_campos_de_jornada_solo_en_jornada` |
| `modalidad` | varchar(200) | sólo `jornada` | ídem |
| `contenidos` | text | sólo `jornada` | ídem |
| `materiales` | text | sólo `jornada` | ídem |
| `evaluacion` | text | sólo `jornada` | ídem |
| `titulo` | varchar(200) | los 4, **obligatorio y no vacío** | `ck_ateneo_titulo_no_vacio` |

Los dos grupos están declarados en `app/models/ateneo.py:31-35`:

```python
#: Los campos del bloque «Jornada de capacitación» del prototipo (`esJ`).
CAMPOS_JORNADA = ("capacitador", "modalidad", "contenidos", "materiales", "evaluacion")

#: Los del bloque «Desarrollo clínico del ateneo» (la rama `else` de `esJ`).
CAMPOS_DESARROLLO_CLINICO = ("situacion", "hipotesis", "recursos", "seguimiento")
```

⚠️ **El vacío se detecta con `~ '[^[:space:]]'`, no con `num_nonnulls()`** — el porqué está en
`ateneo.py:41-56`, y el efecto lateral (la base acepta `''` y `NULL` como equivalentes; normalizar es
tarea de M11.3) está registrado en `esquema-datos-v2.md:403`.

### ¿Cómo se derivan `sensible` y `codigo`?

**Los dos son `hybrid_property`, ninguno es columna.** Fijado por
`test_el_codigo_no_existe_como_columna` (`test_m12_ateneos.py:375`) y
`test_sensible_no_existe_como_columna` (`:407`).

`app/models/ateneo.py:284-308` — **`codigo`**:

```python
@hybrid_property
def codigo(self) -> str:
    """`AT-2026-001`. **Derivado, no columna.**

    Guardarlo sería una segunda fuente de verdad sobre el identificador, que
    se desincroniza en cuanto alguien corrige el correlativo — el mismo
    criterio con el que `severidad_dsm` no copia la etiqueta del grado
    (§5.24) y con el que `Taller.activo` no se almacena (§5.20).
    """
    return f"{ATENEO_CODIGO_PREFIJO}-{self.anio_correlativo}-{self.numero:03d}"

@codigo.inplace.expression
@classmethod
def _codigo_sql(cls):
    """La versión SQL, para poder **buscar y ordenar por `AT-2026-003`**.

    Sin esto, «buscame el AT-2026-003» obliga a traer las filas a Python.
    Mismo recurso que `documentacion_pendiente` (M12.2).
    """
    return (
        literal(f"{ATENEO_CODIGO_PREFIJO}-")
        + cast(cls.anio_correlativo, Text)
        + literal("-")
        + func.lpad(cast(cls.numero, Text), 3, "0")
    )
```

`app/models/ateneo.py:310-326` (+ su expresión SQL) — **`sensible`**:

```python
@hybrid_property
def sensible(self) -> bool:
    """Dato sensible de salud (Ley 18.331). **Derivado, nunca capturado.**

    `sensible = (tipo == 'clinico')`, siguiendo el aviso del prototipo: los
    ateneos clínicos referidos a un NNA heredan la matriz de acceso por
    roles de su HCE; los institucionales y las jornadas son de acceso
    general del equipo técnico.
    """
```

Con la constante `TIPO_SENSIBLE = "clinico"` (`ateneo.py:38`). El CHECK
`ck_ateneo_rango_numero (numero >= 1 AND numero <= 999)` **existe para que las dos mitades de `codigo`
no divergan**: `f"{n:03d}"` ensancha en Python y `lpad(...,3,'0')` trunca en Postgres (razonamiento en
`ateneo.py:155-165`). Que las dos implementaciones coincidan lo fijan
`test_el_codigo_filtra_en_sql_igual_que_en_python` (`:366`) y
`test_sensible_filtra_en_sql_igual_que_en_python` (`:398`).

⚠️ **La asignación del correlativo NO está implementada** — ni secuencia, ni trigger, ni `max()+1`
(`ateneo.py:149-153`): la base garantiza la unicidad y el servicio asignaría en M11.3
(`esquema-datos-v2.md:406`).

### Adjuntos: el XOR de `documento`

`\d documento` — **9 columnas**, con `hce_id` y `ateneo_id` **ambos nullable**:

```
ck_documento_expediente_xor_ateneo   CHECK (num_nonnulls(hce_id, ateneo_id) = 1)
fk_documento_ateneo_id_ateneo        FOREIGN KEY (ateneo_id) REFERENCES ateneo(id) ON DELETE CASCADE
fk_documento_hce_id_hce_diurna       FOREIGN KEY (hce_id)    REFERENCES hce_diurna(id) ON DELETE CASCADE
fk_documento_categoria_id_...        FOREIGN KEY (categoria_id) REFERENCES categoria_documento(id)
```

**Exactamente uno de los dos dueños, nunca los dos ni ninguno.** Es §5.25 implementada. Lo fijan 5 tests
en `tests/test_m12_ateneos.py`: `:611` (documento del expediente), `:617` (del ateneo), `:623` (sin
dueño → rechazo), `:629` (con los dos → rechazo), `:635` (borrar el ateneo borra sus documentos).
⚠️ `categoria_documento` **no se tocó**: un documento institucional usa «Otro» hasta M12.8
(`esquema-datos-v2.md:266`).

### ¿Hay restricción de tipo de archivo (ej. pptx)?

**NO, en ningún lado.**
`grep -rni "pptx|mime|extension|content_type|\.pdf|tipo_archivo" app/ --include=*.py` →
**0 resultados**. `documento.archivo_ref` es `varchar(400)` sin CHECK ni validación de formato; el
storage real está diferido a Fase 6.

### ¿Existe `grupo_id` en `ateneo`?

**SÍ.** `ateneo.grupo_id integer NULL`, FK `fk_ateneo_grupo_id_grupo → grupo(id)` con
**`ON DELETE RESTRICT`**.

Gobernado por dos CHECK: `ck_ateneo_grupo_requerido_en_ateneo_de_grupo` (si `tipo='grupo'`, es
obligatorio) y `ck_ateneo_grupo_solo_con_sujeto` (sólo `clinico` y `grupo` pueden tenerlo). O sea: un
ateneo **clínico admite grupo opcionalmente**, uno **de grupo lo exige**, y `institucional`/`jornada`
**no pueden tenerlo**. Lo fijan `test_el_ateneo_de_grupo_exige_grupo` (`:191`),
`test_el_ateneo_clinico_no_exige_grupo` (`:200`), `test_el_ateneo_clinico_admite_grupo` (`:210`) e
`test_institucional_y_jornada_no_admiten_grupo` (`:219`). Que el RESTRICT muerde lo fija
`test_borrar_el_grupo_falla_mientras_exista_el_ateneo` (`:571`).

⚠️ **Dos huecos declarados y dejados abiertos a propósito:**
- **«Una jornada no lleva acuerdos» NO está implementada.** Lo fija, al revés,
  `test_una_jornada_con_acuerdos_hoy_se_guarda` (`test_m12_ateneos.py:681`). Es cross-table y §5.2.2
  prohíbe triggers → M11.3 (`esquema-datos-v2.md:404`).
- **`ateneo.fecha` puede no coincidir con `grupo.anio`**, a propósito:
  `test_la_fecha_puede_no_coincidir_con_el_anio_del_grupo` (`:692`); es advertencia, nunca bloqueo
  (`esquema-datos-v2.md:405`).

---

## BLOQUE 7 — Lo que NO existe (confirmación negativa)

Método: `SELECT to_regclass('public.<tabla>')` contra la base de desarrollo (devuelve `NULL` si no
existe) **+** `grep -rniE '__tablename__ *= *"(pai|inclusion|usuario|rol|permiso)'` sobre `app/`.

### PAI

| Tabla | `to_regclass` | En `app/models/` |
|---|---|---|
| `pai` | **NULL** | no existe |
| `pai_objetivo` | **NULL** | no existe |
| `pai_equipo` | **NULL** | no existe |
| `pai_coordinacion` | **NULL** | no existe |
| `pai_taller` | **NULL** | no existe |
| `pai_evaluacion_previa` | **NULL** | no existe |

**Ninguna de las 6 existe.** M12.6 está sin arrancar. (`esquema-datos-v2.md:80` describe
`pai_taller { pai_id, taller_nombre }` como algo que «crea M12.6» — **SÓLO DOCUMENTADO**.)

### Inclusión

| Tabla | `to_regclass` | En `app/models/` |
|---|---|---|
| `inclusion` | **NULL** | no existe |
| `inclusion_bitacora` | **NULL** | no existe |
| `catalogo_centro_educativo` | **NULL** | no existe |

**Ninguna de las 3 existe.** M12.5 está sin arrancar. Existe la vista en la demo
(`demo/js/inclusion.js`, 175 líneas, entró con F1 fuera de alcance — `handoff.md` §5.33), **sin backend
detrás**.

### Usuarios, roles y asignación técnico↔grupo

| Tabla | `to_regclass` |
|---|---|
| `usuario` | **NULL** |
| `rol` | **NULL** |
| `permiso` | **NULL** |
| cualquier tabla de asignación técnico↔grupo | **no existe** |

**Ninguna existe.** Lo más parecido a un usuario es **`profesional`** (7 columnas), que ya tiene:
- `rol varchar(20) NOT NULL` con `ck_profesional_rol_valido CHECK (rol IN ('admin','tecnico'))` —
  **dos roles fijos por CHECK, no una tabla**;
- `email varchar(120) NOT NULL` con `uq_profesional_email UNIQUE`;
- `hashed_password varchar(200)` **NULL**.

La asignación técnico↔grupo son las **dos columnas fijas de `grupo`** (`tecnico1_id`, `tecnico2_id`) —
**no hay tabla de asignación**, y por lo tanto no hay más de 2 técnicos ni vigencias (BLOQUE 4).

### Autenticación, sesión o login

**No existe implementación.** `grep -rniE "jwt|oauth|login|passlib|bcrypt|password|autenticac|token"`
sobre `app/` (excluyendo los usos de `Session` de SQLAlchemy) devuelve **3 líneas, todas marcadores de
Fase 4**:

| archivo:línea | Qué |
|---|---|
| `app/core/config.py:28` | `secret_key: str = "cambiar-en-produccion"` |
| `app/core/config.py:29` | `access_token_expire_minutes: int = 480  # 8 h` |
| `app/models/identidad.py:30-31` | `# Fase 4 (JWT). Nullable mientras no haya login real.` → `hashed_password: Mapped[str \| None]` |

No hay endpoint de login (`app/main.py` monta **sólo `/health`**), ni dependencia de seguridad, ni
middleware de auth, ni tabla de sesiones. `requirements.txt` **sí trae** `passlib[bcrypt]`,
`python-jose[cryptography]` y `python-multipart` bajo el comentario `# --- Autenticación (Fase 4) ---`:
**instaladas y sin usar**.

⚠️ También ausente: **no existe `hce_taller`** (`to_regclass` → NULL). Es correcto: M12.3 la retiró
(§5.20).

---

## BLOQUE 8 — `hc_historico`

### Tipo, nullable y validación de formato

`\d hce_diurna` → **`hc_historico | character varying(30)`** — **nullable, sin default.**

Modelo: `app/models/identidad.py:155-157`:

```python
# Número de historia de la HCE anterior. Identificador secundario (§10):
# sirve para cruzar con el archivo histórico, no como clave.
hc_historico: Mapped[str | None] = mapped_column(String(30))
```

**¿Tiene alguna validación de formato hoy? NO.** `\d hce_diurna` no lista **ninguna** CHECK constraint
sobre la tabla, no hay índice (único ni normal) sobre la columna, y no existe validación de aplicación
(no hay `app/schemas/` ni `app/services/`). El único límite es la longitud máxima de 30 caracteres.

⚠️ Coherente con lo anotado en `handoff.md` §7 (F1-nav2): *«formato oficial del Nº de HCE por
confirmar»* — el formato sigue **sin confirmar y sin restringir**.

### ¿En qué tablas está `OrigenMigracionMixin` y qué columnas aporta?

Definición: `app/models/mixins.py:12-42`.

**Está en 3 tablas** (`grep -rn "OrigenMigracionMixin" app/models/*.py`):

| Clase | Tabla | archivo:línea |
|---|---|---|
| `Persona` | `persona` | `app/models/identidad.py:39` |
| `HceDiurna` | `hce_diurna` | `app/models/identidad.py:140` |
| `Idea` | `idea` | `app/models/modulos.py:210` |

**Aporta 4 columnas, todas nullable** (`mixins.py:35-42`):

| Columna | Tipo | Qué es |
|---|---|---|
| `sistema_origen` | `String(120)` | Nombre del sistema del que vino el dato. **`NULL` = nació en este sistema** |
| `fecha_original` | `Date` | La fecha que el dato tenía en el sistema viejo (≠ fecha de la migración) |
| `fecha_migracion` | `Date` | Cuándo se cargó acá |
| `responsable_migracion` | `String(120)` | Quién respondió por la carga — **texto, no FK a `profesional`** (el porqué, `mixins.py:30-32`) |

Verificado contra la base: las 4 aparecen en `\d hce_diurna` y en `\d idea`. Reemplazan al
`idea.migrado_origen JSONB` de M11.2 (`mixins.py:21-25`). El test que fija que son opcionales es
`test_los_metadatos_de_origen_son_opcionales` (`tests/test_m12_catalogos.py:370`).

⚠️ **Contraste con los timestamps:** `creado_en`/`actualizado_en` existen en **1 sola de las 38 tablas**
— `hce_diurna` (verificado por SELECT sobre `information_schema.columns`). Coincide con lo que
`esquema-datos-v2.md:408` declara pendiente.

---

## BLOQUE 9 — Severidad y catálogos

### `severidad_dsm`

`\d severidad_dsm` — **6 columnas, todas NOT NULL:**

| Columna | Tipo | Nullable |
|---|---|---|
| `hce_id` | integer | **NOT NULL** (**PK**) |
| `nivel_cs` | smallint | **NOT NULL** |
| `nivel_crr` | smallint | **NOT NULL** |
| `justificacion` | text | **NOT NULL** |
| `fecha` | date | **NOT NULL** |
| `profesional_id` | integer | **NOT NULL** |

**PK:** `pk_severidad_dsm PRIMARY KEY, btree (hce_id)`.

**Cardinalidad real: 0..1 por expediente — confirmado.** La PK **es** `hce_id`, no hay `id` sintético,
así que un expediente no puede tener dos filas. El docstring `app/models/severidad.py:95` lo dice
(«Como `consentimiento` y `valoracion_funcional`») y `:115` anota que si pasara a ser anual «esto pasa a
1:N con `anio`»; hoy **no lo es**.

**CHECK (3):**

```sql
ck_severidad_dsm_rango_nivel_cs         CHECK (nivel_cs  >= 1 AND nivel_cs  <= 3)
ck_severidad_dsm_rango_nivel_crr        CHECK (nivel_crr >= 1 AND nivel_crr <= 3)
ck_severidad_dsm_justificacion_no_vacia CHECK (justificacion ~ '[^[:space:]]')
```

**FK:** `hce_id → hce_diurna.id **ON DELETE CASCADE**` · `profesional_id → profesional.id` (sin
ondelete). **Índice extra:** `ix_severidad_dsm_profesional_id`.

⚠️ **No hay FK ni columna hacia `idea` ni hacia `protocolo`** — es lo que `esquema-datos-v2.md:395`
declara como garantía estructural ya en verde: el nivel no se deriva de ningún instrumento.

`severidad_nivel` (el catálogo de los 3 grados): PK `grado smallint`,
`uq_severidad_nivel_etiqueta UNIQUE (etiqueta)`, `ck_severidad_nivel_rango_grado CHECK (grado 1..3)`, y
`etiqueta`/`descriptor_cs`/`descriptor_crr`/`apoyos` todos **NOT NULL**.

### Catálogo de bandas del IDEA

**Filas: 6** (`SELECT count(*) FROM banda_idea` → `6`).

Forma (`\d banda_idea`): `id` · `total_min smallint NOT NULL` · `total_max smallint NOT NULL` ·
`perfil varchar(80) NOT NULL` · `nivel_dsm varchar(20) NOT NULL` · `texto text NOT NULL` ·
`orden integer NOT NULL`. **UNIQUE:** `uq_banda_idea_perfil (perfil)`.
**CHECK (3):** `min_menor_que_max (total_min <= total_max)` · `rango_min (0..96)` · `rango_max (0..96)`.

**¿Es editable desde la app?** **NO — no hay app.** No existe ningún endpoint (`app/routers/` vacío,
`main.py` monta sólo `/health`) ni servicio. Un `UPDATE` directo contra la base **no está impedido por
nada** salvo los 3 CHECK de rango.

**¿Hay algo que impida modificarlo?** Sólo **una** cosa, y es contra el seed, no contra un usuario:
`app/seed_catalogos.py:125` declara `(BandaIdea, "banda_idea", "perfil", ("total_min", "total_max"))`
— los dos cortes están en `solo_al_crear`, o sea que **re-correr el seed no los pisa** (mecanismo:
`seed_catalogos.py:95-96`; el porqué, `:64-70`). Lo fija
`test_el_seed_no_pisa_los_cortes_de_las_bandas` (`tests/test_m12_catalogos.py:328`).
⚠️ **`perfil`, `nivel_dsm`, `texto` y `orden` NO están protegidos: el seed sí los pisa.**

Otros tests que fijan el contenido: `test_las_seis_bandas_cubren_0_96_sin_huecos` (`:99`),
`test_los_bordes_de_las_bandas_caen_donde_corresponde` (`:121`),
`test_el_texto_de_las_bandas_es_neutro` (`:144`).

**¿Se guarda en `idea` qué versión de bandas se usó?** **NO.**
`grep -rn "banda" app/models/modulos.py` → **0 resultados**. `idea` guarda `manual_version varchar(60)`
(`modulos.py:246`, para la versión del **manual**) pero **nada sobre las bandas**. Si alguien corrige un
corte, las evaluaciones ya firmadas cambian de banda retroactivamente — el mismo modo de falla que
`manual_version` fue creada para evitar (`modulos.py:241-245`), sin equivalente acá.

### Todos los catálogos sembrados, con conteo por SELECT

| Tabla | Filas (SELECT) | Clave natural | Campos `solo_al_crear` (el seed **no** los pisa) | ¿El seed pisa el resto? |
|---|---|---|---|---|
| `idea_dimension` | **12** | `codigo` | — (ninguno) | **SÍ, todo** |
| `ippu_item` | **24** | `id` | — | **SÍ, todo** |
| `baremo_categoria` | **5** | `categoria` | `pct_min`, `pct_max` | sí, el resto |
| `categoria_documento` | **12** | `nombre` | — | **SÍ, todo** |
| `recordatorio` | **8** | `clave` | `activo`, `periodo` | sí, el resto |
| `taller` | **14** | `nombre` | `orden`, `grupos_orientados`, `retirado_en` | sí, el resto |
| `servicio` | **3** | `clave` | `activo` | sí, el resto |
| `banda_idea` | **6** | `perfil` | `total_min`, `total_max` | sí, el resto |
| `delta_interpretacion` | **6** | `etiqueta` | `delta_min`, `delta_max`, `alerta` | sí, el resto |
| `idea_regla` | **9** | `regla` | — | **SÍ, todo** |
| `idea_ficha` | **12** | `codigo` | — | **SÍ, todo** |
| `severidad_nivel` | **3** | `grado` | — | **SÍ, todo** |
| `idea_nivel` | **60** | `(dimension_id, valor)` | — | **SÍ, todo** |
| `idea_ejemplo` | **48** | `(dimension_id, valor)` | — | **SÍ, todo** |
| **`grupo`** | **4** | `(nombre, anio)` | **fila entera** (`solo_insertar=True`) | **NO — insert-only** |

**15 secciones sembradas, 226 filas.** Fuente de la tabla: `app/seed_catalogos.py:108-134`
(`CATALOGOS`), `:137-140` (`COMPUESTOS`) y `:167-172` (`grupo`, aparte). Datos:
`app/data/catalogos_iniciales.json` (74.430 bytes), **generado** por
`herramientas/generar_catalogos_backend.py`.

**Resumen de protección: 5 catálogos protegen algún campo** (`baremo_categoria`, `recordatorio`,
`taller`, `banda_idea`, `delta_interpretacion`), **1 se protege entero** (`grupo`), **1 protege sólo
`activo`** (`servicio`), y **8 los pisa el seed sin excepción** (los de instrumento: dimensiones, ítems,
niveles, ejemplos, reglas, fichas, categorías de documento y grados de severidad).

### Filas de dominio (no catálogo) en la base de desarrollo

```
ateneo 0 · auditoria 0 · consentimiento 0 · documento 0 · foto 0 · hce_diurna 0 ·
idea 0 · persona 0 · profesional 0 · protocolo 0 · severidad_dsm 0
```

**La base de desarrollo tiene sólo catálogos: cero datos clínicos y cero profesionales.** Es lo esperado
— el seed de NNA de ejemplo es M11.5 (`app/seed_catalogos.py:17`) y no está hecho.

---

## BLOQUE 10 — Divergencias documentación ↔ código

### Lo que NO diverge (verificado, para que quede dicho)

| Afirmación | Dónde | Código |
|---|---|---|
| **38 tablas** | `handoff.md:12`, `backend/README.md:7`, `CLAUDE.md` | ✅ 39 físicas − `alembic_version` = **38** |
| **240 tests** | `handoff.md:12`, `handoff.md:25`, `backend/README.md:64`, `CLAUDE.md` | ✅ `240 passed, 0 skipped, exit 0` |
| **Migración `9246e659d2c9`, un solo head** | `docs/estructura-repositorio.md:167`, `handoff.md:610` | ✅ `alembic heads` = `current` = `9246e659d2c9`; 1 archivo en `versions/` |
| **Una corrida válida es 240 passed / 0 skipped** | `backend/README.md:64`, `handoff.md:25` | ✅ exacto |
| **Sólo `/health` expuesto; routers en M11.4** | `backend/README.md:7`, `app/main.py:6-8` | ✅ `app/routers/` y `app/schemas/` vacíos (0 bytes) |
| **`ix_idea_hce_id … unique=False`, `idea` ya es 1:N** | `handoff.md:913-914` (§5.35) | ✅ verificado en base, migración y modelo |
| **La demo tiene 14 módulos** | `CLAUDE.md`, `handoff.md:24` | ✅ `ls demo/js/*.js` → **14** |
| **`hce_taller` retirada (§5.20)** | `esquema-datos-v2.md:129` | ✅ `to_regclass` → NULL |
| **`hce_diurna.nivel_soporte` retirada (§5.24)** | `identidad.py:164-169` | ✅ no está en `\d hce_diurna` |

### Divergencias encontradas

**D-1 · `handoff.md` cabecera — fecha de última actualización vencida**
- **Dice** (`handoff.md:10`): *«Última actualización: **2026-08-20** (Fase B — merge de F1 + cuestionario)»*.
- **El repo dice:** hay 8 commits posteriores (de `c549171` a `4fded35`), y §13 tiene dos entradas del
  **2026-08-21** (`handoff.md:2208` y `:2233`). Además hay **41 líneas sin commitear** en el propio
  `handoff.md`.
- **Viejo: el documento.**

**D-2 · `handoff.md` cabecera — «pendiente con IPPU: validar la demo… IDEA a línea base única»**
- **Dice** (`handoff.md:12`, final; ídem `handoff.md:1016`): la validación con IPPU sigue pendiente.
- **El repo dice:** la reunión **ya ocurrió el 2026-08-21**
  (`docs/notas/respuestas-reunion-ippu-2026-08-21.md`, título línea 1), y hay 2 entradas de bitácora de
  ese día.
- ⚠️ **Pero el archivo de respuestas está VACÍO.** Verificado por script: de sus **26 bloques
  `**Respuesta:**`**, **ninguno tiene texto** (el único «lleno» que detectó el script es un encabezado de
  sección, no una respuesta). **En el repo no hay ningún registro de lo que IPPU contestó el 21/08.**
- El propio archivo declara su condición de retiro (`:10-19`): las respuestas se transcriben a
  `puntos-a-validar.md` / `handoff.md` §5 / `consulta-a-ippu.md` **antes de tocar código**, y recién
  entonces se borra. **Ninguno de los tres pasos se hizo.**
- **NO VERIFICABLE desde el repo:** qué contestó IPPU. El enunciado de esta sesión afirma que *«varias
  decisiones del modelo cambian»*; **el repo no tiene evidencia de cuáles.**
- **Viejo: los dos.** El handoff dice «pendiente» cuando la reunión ya pasó; y el registro de la reunión
  nunca se escribió.

**D-3 · `esquema-datos-v2.md` se contradice consigo mismo sobre la cardinalidad de `idea`**
- **Dice `:354`** (tabla de migración v1→v2): *«`idea` **línea base única** con `dim JSONB`»*.
- **Dice `:48` y `:171`** (diagrama ER y tabla §2): *«HCE-LB (**1:N** por reingreso >12m)»* y *«**1:N** —
  reingreso >12 meses = instancia nueva»*.
- **El código dice 1:N**: sin UNIQUE sobre `hce_id`, con `test_idea_admite_varias_lineas_base_por_expediente`
  (`tests/test_esquema_v2.py:54`) fijándolo.
- **Vieja: la línea `:354`.** Las otras dos coinciden con el código.

**D-4 · `esquema-datos-v2.md:439` — precondición vencida**
- **Dice:** *«si IPPU pide cambios en la línea base única, se ajusta `idea` **antes de M11.2**»*.
- **El repo dice:** M11.2 se cerró el **2026-08-07** (`handoff.md:12`) y desde entonces pasaron M12.0–M12.4
  y M12.7. La puerta se movió por escrito a **antes de M11.3** (`handoff.md:904-922`, §5.35, 2026-08-20).
- **Viejo: el esquema.** `handoff.md` §5.35 es posterior y lo enmienda.

**D-5 · `esquema-datos-v2.md:3-8` — cabecera de estado desactualizada dos rondas**
- **Dice:** *«Estado: IMPLEMENTADO en M11.2 (2026-08-07, **28 tablas**…). Lo marcado «M12.1» y «M12.2» ya
  está en los modelos y en la migración… Al cerrar M12.3 son **34 tablas**»*.
- **El código dice:** **38 tablas**, con M12.4 y M12.7 también cerrados (`severidad_dsm`,
  `severidad_nivel`, `ateneo`, `ateneo_acuerdo` existen en la base).
- **Viejo: el esquema.** Su propio `:8` anuncia el arreglo («Este documento pasa a **v3** en M12.8»), y
  M12.8 no se hizo. El cuerpo del documento **sí** describe M12.4 y M12.7 (`:395`, `:402-408`): la
  desactualización es **sólo de la cabecera**.

**D-6 · `handoff.md` cabecera — «M11.1 y M11.2 HECHOS (backend v2: 28 tablas… 21 tests)»**
- **Dice** (`handoff.md:12`, primera mitad): 28 tablas y 21 tests.
- **El código dice:** 38 y 240.
- **Ninguno está viejo — es una frase histórica**, y la misma línea corrige después con «38 tablas, 240
  tests». Se anota porque **leída fuera de contexto induce a error** y es la primera cifra que aparece en
  la cabecera.

**D-7 · `CLAUDE.md` — el mapa del repositorio omite 3 cosas que existen**
- **Dice** (bloque «Mapa del repositorio»): `docs/` contiene `fuentes/`, `prototipo-v4/`, `markdown/`,
  `notas/`, `planes/`, `prompts/`; `herramientas/` contiene **4** scripts; `docs/notas/` contiene
  «puntos-a-validar.md (interno) · consulta-a-ippu.md».
- **El repo dice** (`ls`): `docs/` tiene también **`guias/`** (creada el 2026-08-21, con
  `notas-accesibilidad-ui.md`, 18.200 bytes); `herramientas/` tiene **5** scripts (falta
  **`verificar_contraste_ui.js`**, 18.374 bytes, commit `15a4742`); `docs/notas/` tiene **4** archivos
  (faltan `respuestas-reunion-ippu-2026-08-21.md` y `borrador-color-y-significado-clinico.md`).
- **Viejo: `CLAUDE.md`.** ⚠️ `docs/estructura-repositorio.md` **sí** tiene las tres (`:79`, `:107`,
  `:235`), y su diff sin commitear agrega la cuarta. **Los dos mapas del repo divergen entre sí.**

**D-8 · `PLAN-M12-…md` — cita una migración que ya no existe**
- **Dice** (`docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md:304`): *«(`f432ea139fd9`) con el test
  de coincidencia pasando»*.
- **El repo dice:** `f432ea139fd9` **no existe como archivo** (`ls alembic/versions/` → sólo
  `9246e659d2c9_…`). Es la revisión de M12.4, sobreescrita por la de M12.7 según la propia regla §5.19.
- **Viejo: el plan** (y las 4 citas de `handoff.md` y 1 de `docs/prompts/`). No es un error de hecho —la
  revisión existió— pero **hoy no se puede resolver a nada**. ⚠️ Es exactamente el modo de falla que
  `herramientas/verificar_estado.py:10` dice haber nacido para atajar («Nombraba una migración
  —`f432ea139fd9_..._m12_4.py`— que ya no existía»), y **la herramienta no lo detecta porque compara
  conteos, no citas**.

**D-9 · `PLAN-M12-…md` describe M12.5 y M12.6 en presente; no existen**
- **Dice** (`:322-340` M12.5, `:341-425` M12.6): las tablas `catalogo_centro_educativo`, `inclusion`,
  `pai` y sus 5 satélites, con sus columnas.
- **El código dice:** **ninguna de las 9 tablas existe** (BLOQUE 7, `to_regclass` → NULL en las 9).
- **Ninguno está viejo:** el plan describe trabajo **no hecho** y lo marca así (los `### M12.5` y
  `### M12.6` **no** llevan el `✅ HECHO` que sí llevan M12.2/M12.3/M12.4/M12.7). Se anota como
  **SÓLO DOCUMENTADO** para que nadie lo lea como esquema vigente.

**D-10 · `handoff.md` §6 — «`demo/F1-navegacion` CON 4 COMMITS SIN PUSHEAR»**
- **Dice** (`handoff.md`, §6, entrada F1-nav): *«⚠️ CON 4 COMMITS SIN PUSHEAR… Falta: (a) pushear los 4
  commits»*.
- **El repo dice:** la rama **ya está mergeada** (`d94b102 merge: integrar demo/F1-navegacion a main`, en
  `main`), existe en los dos remotos (`gitlab/demo/F1-navegacion` y `origin/demo/F1-navegacion`), y
  **no hay rama local `demo/F1-navegacion`** (`git branch -vv` lista sólo `main` y `feat/m11-backend-v2`).
- **Viejo: el handoff.** El pendiente (a) está resuelto por el merge. ⚠️ El commit `591acfe` dice haber
  actualizado «los pendientes que F1 dejó de bloquear» — **esta entrada quedó afuera**.

**D-11 · Backend congelado desde el 2026-08-15**
- **No es una divergencia de una afirmación, es un hecho que ningún documento dice.**
- **Evidencia:** los mtimes de `backend/app/models/` van del **2026-08-13 al 2026-08-15**; el archivo de
  migración es del 2026-08-15 15:19; `tests/` va del 2026-08-14 al 2026-08-15 15:18. Los **20 commits más
  recientes** (2026-08-19 → 2026-08-21) tocan **sólo** documentación, demo y herramientas.
- Es coherente con el bloqueo declarado (M12.5/M12.6/M12.8 esperando validación), pero conviene tenerlo
  medido: **el backend no cambió en 11 días.**

**D-12 · Un test cuyo nombre contradice el docstring del modelo que prueba**
- **`app/models/modulos.py:211`** afirma *«el IDEA como **línea base única**»* y **`:218`**, siete líneas
  abajo, *«Es **1:N** y no 1:1»*.
- **El test es `test_idea_admite_varias_lineas_base_por_expediente`** (`tests/test_esquema_v2.py:54`).
- **Viejo: la línea `:211`**, que sobrevive de M4. No hay ambigüedad de comportamiento —el esquema y el
  test coinciden en 1:N— pero **la primera línea del docstring dice lo contrario de lo que hace la
  clase**, y es lo primero que lee quien abra el archivo.

---

## NÚMEROS

| Concepto | Valor medido | Cómo se midió |
|---|---|---|
| **Tablas (dominio)** | **38** | `SELECT count(*) … information_schema.tables` = **39** − `alembic_version` |
| **Tablas (físicas, con `alembic_version`)** | **39** | ídem |
| **Tests — passed** | **240** | `pytest -q` |
| **Tests — failed** | **0** | `pytest -q` |
| **Tests — skipped** | **0** | `pytest -q` (sin sección SKIPPED) |
| **pytest exit code** | **0** | `EXIT CODE=0` |
| **Funciones `def test_`** | **198** | `grep -c "^def test"` en `tests/*.py` (240 tras `parametrize`) |
| **Head de Alembic** | **`9246e659d2c9`** | `alembic heads` |
| **Alembic current** | **`9246e659d2c9`** | `alembic current` — **coinciden** |
| **Archivos en `alembic/versions/`** | **1** | `ls` |
| **Rama** | **`main`** @ `4fded35` | `git branch --show-current` |
| **Commits sin pushear (`main`)** | **0** | `git log gitlab/main..HEAD` y `origin/main..HEAD` vacíos |
| **Commits sin pushear (otras ramas)** | **1** (`356d2f2` en `feat/m11-backend-v2`, **ya mergeado en `main`**) | `git log origin/feat/…..feat/…` |
| **Archivos sin commitear** | **3 modificados + 5 sin trackear** | `git status --porcelain` |
| **Módulos JS de la demo** | **14** | `ls demo/js/*.js \| wc -l` |
| **Filas de dominio en la base de dev** | **0** en las 11 tablas de expediente | `SELECT count(*)` |
| **Catálogos sembrados** | **15 secciones · 226 filas** | `SELECT count(*)` por tabla |
| **Routers / schemas / services** | **0 / 0 / 0** (`app/services/` no existe) | `ls`, `wc -c` = 0 bytes |
| **Endpoints expuestos** | **1** (`GET /health`) | `app/main.py:33-36` |

### Sub-módulos de M12 — presentes/ausentes verificados por código

| Sub-módulo | Estado verificado | Evidencia en código |
|---|---|---|
| **M12.0** — descriptores / `descriptor_breve` | **PRESENTE** | `idea_nivel` **60 filas**; `test_los_60_descriptores_oficiales_siguen_intactos` (`test_m12_catalogos.py:225`) |
| **M12.1** — catálogos IDEA + `manual_version` + `OrigenMigracionMixin` | **PRESENTE** | `banda_idea` 6 · `delta_interpretacion` 6 · `idea_ficha` 12 · `idea_ejemplo` 48 · `idea_regla` 9; `idea.manual_version` en `\d idea`; mixin en 3 tablas |
| **M12.2** — puntuación independiente / consenso (D7) | **PRESENTE** | `puntuacion_idea` y `puntuacion_protocolo` existen; `idea.evaluador_t1_id`/`t2_id` + `ck_idea_evaluadores_distintos`; `test_m12_consenso.py` 18 tests |
| **M12.3** — catálogo dinámico de talleres (D5) | **PRESENTE** | `taller` **14 filas**; `hce_taller` **NO existe** (`to_regclass` → NULL); `test_m12_talleres.py` 18 tests |
| **M12.4** — HCE-SEV | **PRESENTE** | `severidad_dsm` (PK `hce_id`, 3 CHECK) + `severidad_nivel` (3 filas); `hce_diurna.nivel_soporte` **retirada**; `test_m12_severidad.py` 25 tests |
| **M12.5** — HCE-INC (inclusión) | **AUSENTE** | `inclusion`, `inclusion_bitacora`, `catalogo_centro_educativo` → `to_regclass` **NULL** las 3 |
| **M12.6** — HCE-PAI | **AUSENTE** | `pai`, `pai_objetivo`, `pai_equipo`, `pai_coordinacion`, `pai_taller`, `pai_evaluacion_previa` → `to_regclass` **NULL** las 6 |
| **M12.7** — Ateneos y jornadas | **PRESENTE** | `ateneo` (20 col., 8 CHECK) + `ateneo_acuerdo` (6 col.); `documento` con XOR `hce_id`/`ateneo_id`; `ATENEO_TIPOS` en `constantes.py:184`; `test_m12_ateneos.py` 68 tests |
| **M12.8** — cierre (seed, tests, docs) | **AUSENTE** | `esquema-datos-v2.md` sigue en v2 con cabecera de M12.3 (`:3-8`); `categoria_documento` sin tocar (`esquema-datos-v2.md:266`) |

**Presentes: 6 (M12.0, M12.1, M12.2, M12.3, M12.4, M12.7). Ausentes: 3 (M12.5, M12.6, M12.8).**
