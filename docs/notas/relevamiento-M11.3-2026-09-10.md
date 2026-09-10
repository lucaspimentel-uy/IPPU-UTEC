# Relevamiento M11.3 — 2026-09-10 (R1)

> **Sesión M12.8b-1b · PARTE B · SOLO LECTURA.** Este archivo es la única salida de la parte B. No se
> editó, creó ni borró código: **cero** cambios en `app/`, `alembic/`, `tests/`. No hubo
> `alembic upgrade|downgrade|revision|stamp` ni `python -m app.seed_catalogos` ni escrituras contra la
> base de desarrollo.
>
> **Este archivo es un `relevamiento-*` y por lo tanto un REGISTRO desde que nace** (regla de la hoja de
> sesión: los `relevamiento-*` no se corrigen después). Si algo de acá queda desactualizado, se escribe
> **otro** relevamiento; este no se toca. Precedente y formato: **R0**
> (`docs/notas/relevamiento-estado-2026-08-26.md`).
>
> **Regla de evidencia.** Cada afirmación va con `archivo:línea` o con la salida del comando que la
> produjo. Lo que sólo dice un `.md` y no confirma el código está marcado **SÓLO DOCUMENTADO**. Lo que
> pide una decisión de Lucas va al **BLOQUE 6.4**, redactado como pregunta, no como propuesta (regla de
> sesión: un R1 que decide es un R1 que nadie puede usar).
>
> **Para qué existe** (`handoff.md` §5.67 / L14 · §6, bullet M11.3): M11.3 lo toma Lucas y su primera
> tarea es «un reconocimiento estilo R0 contra el código — qué existe, qué asumió la puerta de §5.8, y qué
> cambiaron por debajo las decisiones de la serie L». Esto es ese reconocimiento. **No diseña nada.**
>
> **Entorno (permitido, es entorno y no dato):** Docker ya estaba arriba (`ippu-postgres`, healthy). Se
> corrió `pytest -q` y los dos `--check` **para medir**, no cambian nada.
>
> ⚠️ **Nombre del archivo:** la hoja de sesión propuso `relevamiento-M11.3-2026-09-09.md`; la fecha real
> de la sesión es **2026-09-10** y R0 fecha por fecha de sesión (`relevamiento-estado-2026-08-26.md`), así
> que se sigue esa convención.

---

## BLOQUE 0 — Punto de partida (medido en esta sesión)

| Concepto | Valor medido | Cómo se midió |
|---|---|---|
| Rama | `main` @ `a93eea3` | `git branch -vv` — `a93eea3` es el commit de la PARTE A de esta sesión (sección HCE-PAI del esquema), aún sin pushear |
| Árbol de trabajo | limpio salvo `docs/prompts/Session M12.8b-1b + R1.md` sin trackear | `git status` |
| Ambos remotos | `gitlab/main` y `origin/main` en `bdca401` | `git ls-remote` — antes de la PARTE A |
| Docker | `ippu-postgres` up (healthy) | `docker ps` |
| `pytest -q` | **432 passed, 0 skipped** en 36 s | `.venv/Scripts/python -m pytest -q` |
| `verificar_estado.py --check` | **exit 0** | `herramientas/verificar_estado.py --check` |
| `generar_catalogos_backend.py --check` | **exit 0** | `herramientas/generar_catalogos_backend.py --check` |
| Tablas en `Base.metadata` | **51** | `len(Base.metadata.tables)` |
| Tablas físicas en la base de dev | **51** (+ `alembic_version` = 52) | `inspect(engine).get_table_names()` |
| Head de Alembic | `559b1a79cb77` | `alembic heads` |
| Archivos en `alembic/versions/` | **1** (`559b1a79cb77_esquema_v2_inicial_m12_8a.py`) | `ls` |
| Funciones `def test_` | **274** (432 casos tras `parametrize`) | `grep -hE '^\s*def test_' tests/*.py \| wc -l` |
| Filas de dominio en la base de dev | **0** en `persona`, `hce_diurna`, `idea`, `profesional` | `SELECT count(*)` |
| Filas de catálogo sembradas | **234** en 17 tablas (incluye `grupo` 5, `catalogo_centro_educativo` 0) | `SELECT count(*)` por tabla |

**Todo coincide con lo esperado por la hoja de sesión.** El estado de partida del backend es el que R0
midió el 2026-08-26 (`app/services/` no existe, 1 endpoint) **más** M12.5, M12.6, M12.7 y M12.8a — que
son todos capa de modelo. **La capa de servicios sigue en cero.**

---

## BLOQUE 1 — Qué existe hoy en la capa de servicios

### 1.1 `app/routers/`, `app/schemas/`, `app/services/`

```
app/routers/__init__.py    0 bytes
app/routers/               (sólo __init__.py + __pycache__)
app/schemas/__init__.py     0 bytes
app/schemas/               (sólo __init__.py + __pycache__)
app/services/              NO EXISTE
```

`find app -name '*.py' -not -path '*__pycache__*'` devuelve 19 archivos: `main.py`, `core/` (4),
`models/` (11), `seed_catalogos.py`, y los dos `__init__.py` vacíos de `routers/` y `schemas/`.
⚠️ Hay `.pyc` viejos en `app/routers/__pycache__/` (`catalogo`, `clinica`, `evaluaciones`, `nna`,
`personas`) — son del **backend v1 retirado en M11.2** (`esquema-datos-v2.md` §3); no hay `.py` que los
respalde. Ruido de caché, no código.

### 1.2 Endpoints registrados en la app

**Uno.** `app/main.py:33` — `GET /health`. No hay `include_router`, no hay `APIRouter`, no hay ningún
otro `@app.<verbo>` en todo `app/` (`grep -rnE 'include_router|APIRouter|@app\.(get|post|put|delete|patch)'`).
`passlib` y `python-jose` están instaladas y sin usar (R0 · §5.41).

### 1.3 Dónde vive hoy cada regla de negocio

**Ninguna regla clínica vive en código ejecutable.** Se reparten así:

| Vive en… | Qué hay | Ejemplos |
|---|---|---|
| **CHECK / UNIQUE estructural en la DDL** (integridad de forma, §5.2.2) | rangos, XOR, dominios, unicidad de ciclo | `idea`: `ck_idea_rango_total` (0–96), `ck_idea_evaluadores_distintos`. `protocolo`: `uq_protocolo_hce_tipo_anio`, `tipo IN ('A','B')`, `total BETWEEN 24 AND 120`, `tipo='B' OR deltas IS NULL`, `evaluadores_distintos`. `informe_cierre`: `uq_informe_cierre_hce_anio`. `foto`/`documento`: `num_nonnulls(...)=1`. `valoracion_funcional`: `pct` 0–100. `auditoria`/`evento`/`registro_organismo`: `tipo IN (...)`. PAI: 16 CHECK de dominio + 4 UNIQUE compuestos (ver esquema §2.2). |
| **`hybrid_property` en el modelo** (derivado, sirve en Python y en SQL) | estado no almacenado | `PuntuacionConsensoMixin.procedimiento` / `.documentacion_pendiente` (`modulos.py:127-163`), `Taller.activo`, `EstadoInclusion.asignable`, `Inclusion.sensible`, `Ateneo.codigo` / `.sensible`. |
| **Prosa en docstrings del modelo** (marcador, no guard) | todo el resto | `Consentimiento` bloqueo sin excepción (`modulos.py:194`), firma=bloqueo (`modulos.py:10-12`), Δ B−A tipado (`modulos.py:346-351`), «la vigente es la de mayor `fecha_consenso`» (`modulos.py:228-233`), `severidad_dsm` sin homologar (`severidad.py`), fotos §8.4 (`transversales.py:107-117`), histórico inmutable (`transversales.py:23-33`), divulgación sin flujo (`divulgacion.py:30-44`), PAI sin guards (`pai.py:54-63`). |
| **Prosa en `esquema-datos-v2.md` §4** | la tabla de «reglas duras — todas en el servidor» | 20 filas, **todas** con «Dónde vive en v2» apuntando a un servicio que no existe (`flujo.py`, `foto.py`, `documento.py`, servicio VF, servicio de firma). 8 filas dicen literalmente **«Pendiente — M11.3»**. |
| **Tests que fijan la forma** | garantías estructurales, no de flujo | 274 funciones en 9 archivos `test_m12_*` + `test_esquema_v2.py`; ninguna ejercita un servicio (no hay). |

**Conclusión del bloque:** M11.3 arranca sobre un modelo con integridad estructural completa y **cero**
lógica de flujo. Todo lo que sigue en el BLOQUE 2 hay que escribirlo de cero; nada que revertir.

---

## BLOQUE 2 — Las reglas §4 del esquema, una por una

Referencia: `implementacion/L1-hce-idea/backend/docs/esquema-datos-v2.md` §4 (tabla «Reglas duras») y
`handoff.md` §5.67 (la lista que Lucas se llevó con M11.3).

### 2.1 Secuencia entre instrumentos (CI → LB → PA → PB → IC)

- **Qué dice el esquema:** §4 fila 1 — «Secuencia CI→LB→PA→PB→IC; CI **no exceptuable** (§4.2)», con un
  servicio `flujo.py::modulo_habilitado()` / `estado_modulo()` que deriva el estado visible sin
  almacenarlo. Prueba prevista: «firmar PA sin LB → 409; excepción con constancia → OK + auditoría».
- **Qué hace el código hoy:** nada. `FirmaMixin` (`modulos.py:44-58`) aporta las columnas `firmado`,
  `firmas`, `addendas`, `excepcion` (JSONB) en `Consentimiento`, `Idea`, `Protocolo`, `InformeCierre`.
  **El mecanismo de habilitación excepcional existe como columna** (`excepcion`) pero **nada lo escribe ni
  lo respeta**. No hay derivación de estado. La demo sí la tiene (`demo/js/flujo.js`, motor M1).
- **El hueco:** el servicio entero. Depende de **B4** (`preguntas-ippu.md`) — *¿la secuencia traba o sólo
  avisa?* El Manual §3 dice «no se aplica sin que el anterior esté firmado»; las Especificaciones dicen
  «flujo guiado, **no impuesto**». Las dos lecturas son construibles con lo que hay (`excepcion` JSONB
  para la habilitación registrada); lo que la respuesta define es **el default**: 409 duro vs. 200 con
  constancia en `auditoria`.

### 2.2 Firma = bloqueo (corrección por addenda)

- **Qué dice el esquema:** §4 fila 2 — servicio `firmar_modulo()` transaccional (firma + totales +
  auditoría); `PUT` sobre módulo firmado → 409; endpoint `/addendas`.
- **Qué hace el código hoy:** nada. `firmado bool` y `addendas JSONB` existen; **nada impide un UPDATE a
  un módulo firmado** — no hay endpoint y no hay trigger (§5.2.2 los prohíbe). El docstring
  (`modulos.py:10-12`) lo dice como intención: «El `UPDATE` lo rechaza el servicio (M11.3), no un
  trigger».
- **El hueco:** el servicio de firma completo, con los sub-guards que cuelgan de él: (a) validaciones de
  integridad §4.3 por módulo (12 dim sin NS, obs obligatoria en ítems 1/5, síntesis, fechas); (b)
  **`NS` bloquea la firma del IDEA** (`modulos.py:235-236`, `303-304` — hoy sólo prosa); (c) **diferencia
  ≥2 exige documentar el consenso** (D7 · §5.16; §4 lo marca «Pendiente — M11.3»; la base sólo calcula
  `diferencia` como columna generada, el umbral vive en `core/constantes.py::CONSENSO_DIFERENCIA_AMBIGUEDAD`);
  (d) **`NS` de un técnico contra número del otro** — desacuerdo que la aritmética no expresa, §4 lo deja
  «sin resolver a propósito — M11.3».

### 2.3 Δ sólo dentro del mismo instrumento — reformulada por §5.36

- **Qué decía la regla original:** «Δ sólo B−A, jamás entre instrumentos» (§5.2 / no-homologabilidad
  IDEA ↔ IPPU-TEA).
- **Qué la reformuló §5.36 (I1, 2026-08-26):** IPPU dijo que se compara **siempre dentro del mismo
  instrumento** — el IDEA de este año contra el del año anterior, el Protocolo B contra el A, **nunca
  entre instrumentos**. `handoff.md:1011-1015`: *«La regla de M11.3 hoy escrita «Δ sólo B−A» tiene que
  reformularse como «Δ sólo dentro del mismo instrumento»: tal cual está, bloquea una comparación que IPPU
  pidió explícitamente»*. §5.67 se la llevó a M11.3 ya con la formulación nueva.
- **Qué hace el código hoy:** `protocolo.deltas` (JSONB, sólo B) + `CHECK(tipo='B' OR deltas IS NULL)`
  (`modulos.py:389`). El docstring de `Protocolo` (`modulos.py:346-351`) describe `calcular_delta` como
  función tipada que «sólo acepta dos `Protocolo`». **No existe** una función análoga para el IDEA
  año-contra-año, ni columna donde guardar ese Δ.
- ⚠️ **Divergencia de documentación viva — R1-01.** `esquema-datos-v2.md` **§4 fila 4** (`:723`) y
  `backend/README.md:131` **todavía dicen «Δ sólo B−A, jamás entre instrumentos»**. El **mismo** documento
  del esquema, en §2.2 `:788` (criterio §12-A), ya usa la formulación nueva «Δ sólo dentro del mismo
  instrumento» → el documento se contradice a sí mismo. `CLAUDE.md:184`, `handoff.md` (§5.36, §5.67, §6),
  `puntos-a-validar.md:694`, `respuestas-reunion-ippu-2026-08-21.md:196` y `consulta-a-ippu.md:180` ya
  llevan la nueva. **M11.3 no puede escribir este guard contra la fila 4 sin reintroducir el bloqueo que
  §5.36 removió.** La fila 4 del §4 hay que reescribirla antes (o como primer paso de M11.3).

### 2.4 Categoría del baremo sólo desde `pct` oficial (§7.5)

- **Qué dice el esquema:** §4 fila 5 — `categoria_baremo(pct)` en el servicio VF; ningún camino recibe
  instrumentos clínicos. Espejo: **salida** — la severidad no participa de ningún cálculo de elegibilidad
  (§4, tres filas «HCE-SEV · salida», todas «Pendiente — M11.3»).
- **Qué hace el código hoy:** `valoracion_funcional.categoria_id` es FK **nullable** a `baremo_categoria`
  (5 filas sembradas); `pct` es `Numeric(5,2)` con `CHECK` 0–100; el docstring
  (`transversales.py:186-192`) dice «la escribe el servidor **únicamente** a partir de `pct` … El guard
  tipado vive en el servicio de VF (M11.3)». **Nada escribe `categoria_id` hoy.** Estructuralmente ya está
  aislado: ni `valoracion_funcional` ni `baremo_categoria` tienen FK ni columna hacia `idea`, `protocolo`
  o `severidad_dsm` (verificado por metadata).
- **El hueco:** la función `categoria_baremo(pct)`, con dos casos que §4 ya dejó anotados: `pct=None` →
  «no corresponde» (menores de 2 años, sin BUND), `pct=0` → la categoría de 0–4 %. **Implementable hoy** —
  no depende de ninguna respuesta de IPPU (los cortes del baremo son ajustables sin migración; §0.4 / C5).

### 2.5 Protección de imagen individual / grupal (§8.4)

- **Qué dice el esquema:** §4 fila 6 — servicio `foto.py`: exige `autorizacion_imagen` del NNA / de
  **todas** las familias activas del grupo; carga sin autorización → 403 con el detalle de quiénes faltan.
- **Qué hace el código hoy:** `foto` con XOR `num_nonnulls(hce_id, grupo_id)=1` (`transversales.py:129-131`);
  `autorizacion_imagen` PK=`hce_id`, `registrada bool` (`:92-104`). El XOR es lo único que se verifica.
  El docstring (`:112-116`) es explícito: «Lo que **no** va en la BD es el permiso … Eso lo verifica el
  servicio, que además puede devolver *quiénes* faltan».
- **El hueco:** el servicio. La parte individual es directa (`autorizacion_imagen.registrada`). La grupal
  necesita **«familias activas del grupo»** — que hoy se puede derivar (`hce_diurna.grupo_id` +
  `hce_diurna.activo` + `autorizacion_imagen` por expediente), así que **no está bloqueada por datos que
  falten**. No depende de ninguna pregunta de IPPU.

### 2.6 Compuerta «revisado por dirección → entregado» (divulgación de informes)

- **Qué dice el esquema:** no está en la tabla §4 como fila propia; está en la nota de `divulgacion` de
  §2.3 y en `divulgacion.py:30-35`: «la compuerta “borrador → revisado por dirección → entregado” de
  §5.40 (§2.13) … todo **M11.3/M11.4**. §5.71 difiere los guards explícitamente». Y en §4, dos filas
  «HCE-DIV · CHECK cruzado 1 y 2» marcadas «Pendiente — M11.3» (los invariantes
  `alcance_dato<>'agregado' OR hce_id IS NULL` y «autorización escrita ⇒ apunta a ella» **no** están en la
  DDL a propósito).
- **Qué hace el código hoy:** `divulgacion` (15 columnas, `divulgacion.py`) registra un **hecho
  ocurrido**, append-only por postura. **No hay ningún estado de revisión, ni destinatario de informe, ni
  generación de PDF** (R0 · `puntos-a-validar.md` §2.13: «no existe ningún estado de revisión o
  aprobación en el modelo, ninguna otra entidad de informe además de `informe_cierre`»).
- **El hueco:** la capa entera de compartición. **Bloqueada** por **B7** (¿qué significa «área de
  generación de informes configurable»? ¿qué configura el usuario?), **B11** (¿el guard de §6.6 mira 2 o 3
  valores de `alcance_dato`?) y **B12** (¿dar a la familia copia de la HC del NNA es divulgación o
  acceso?). El informe de cierre anual (`informe_cierre` + `UNIQUE(hce_id, anio)`) **no cambia**.

### 2.7 Inventario del resto de guards que §4 y §5 mandan a M11.3

Medido recorriendo `esquema-datos-v2.md` §4 y las decisiones §5 que nombran M11.3:

| Guard | Fuente | ¿Datos suficientes hoy? |
|---|---|---|
| Registro histórico inmutable (§10) — UPDATE/DELETE sobre `es_registro_historico` → 403 | §4 fila 7 | **Sí** — `documento.es_registro_historico bool` existe |
| Auditoría solo-inserción + auditoría **de campo** (`campo`/`valor_ant`/`valor_nuevo` en cada UPDATE) | §4 filas 8, «Auditoría de campo» | **Sí** — columnas en `auditoria` (M12.1); es lo que hace correcto el 0..1 de `severidad_dsm` e `inclusion` |
| Informe único (§5.3) — el PDF sale sólo de `informe_cierre` firmado | §4 fila 9 | **Sí** (la generación de PDF es M11.4) |
| Terminología §8.1 — `VOCABULARIO_PROHIBIDO` en textos generados | §4 fila 10 | Parcial — el catálogo ya está limpio; falta aplicarlo a los textos que genere el servidor |
| IDEA firmado atado a `manual_version` | §4, M12.1 | **Sí** — `idea.manual_version` + `IDEA_MANUAL_VERSION` |
| Banda del IDEA sólo desde `banda_idea`; alerta del Δ sólo desde `delta_interpretacion` | §4, D4/M12.1 | **Sí** — `banda_idea` (6) y `delta_interpretacion` (6) sembrados |
| Habilitación de §IX del PAI por `tipo` («Actualización anual») | §5.54 · §5.67 · esquema §2.2 | **Sí** — `pai.tipo` + CHECK existen; el guard es «exigir/ocultar §IX según `tipo`» |
| **Anexo A del Manual** (cálculo de totales y deltas con verificación previa a la firma) | §5.54 · §5.67 | **NO** — el Anexo A y el Manual §8 **no están en el repo** (`puntos-a-validar.md` §1.16 / B1) |
| **«Qué IDEA rige a la fecha»** | §5.35 · §5.36 · §5.67 | **NO** — necesita `idea.anio` (I1, sin implementar) y la respuesta de **B2(b)** |
| Guards del acceso al ateneo (visibilidad = participantes + tratante + dirección; enmascarado) | §5.70 → `puntos-a-validar.md` §2.16 | Parcial — necesita el modelo de usuarios (§5.72) debajo |
| Registro de accesos con motivo y firma (HCE-LOG, requisito **legal** del Protocolo §7–§8) | `puntos-a-validar.md` §2.17 | **NO** — no hay `motivo` ni firma en `auditoria`; `tipo='acceso'` está en el CHECK y nada lo escribe |
| Coordinación `divulgacion` ↔ `registro_organismo` (si M11.3 decide encadenarlas) | §5.80 | **Sí** (es decisión de servicio, sin dato que falte) |

---

## BLOQUE 3 — Los supuestos de §5.8 y lo que la serie L cambió

### 3.1 Qué asumió la puerta de §5.8, y qué de eso sigue en pie

§5.8 (2026-08-07) sostuvo el arranque de M11 sin la validación de IPPU con **tres** supuestos:

1. **«La puerta es sobre la forma de la tabla `idea`, no sobre el esquema entero. De las 28 tablas, 27
   son inmunes.»** — **SIGUE EN PIE, y reforzado.** Hoy son 51 tablas; el único cambio de forma que la
   respuesta de IPPU obliga sigue siendo `idea.anio` (BLOQUE 4). Ninguna de las 50 restantes depende de
   la respuesta «anual».
2. **«Si IPPU pide IDEA anual, el arreglo es `anio` + un `UNIQUE` — barato ahora, caro después de que
   M11.3/M11.4 construyan encima.»** — **CONFIRMADO por dos mediciones** (§5.31 el 20/08, R0 el 26/08) y
   **re-confirmado acá** (BLOQUE 4.1): el backend es puramente aditivo. **M11.3 no arrancó**, así que
   sigue siendo el momento barato.
3. **«Frenar todo dejaba la ronda parada por tiempo indefinido; la decisión de procedimiento la ratifica
   el equipo.»** — **RATIFICADO.** §5.60 (L7, 2026-09-03): «el equipo ratifica haber arrancado M11 sin la
   validación previa de IPPU». La puerta que §5.35 puso **antes de M11.3** queda cruzada como decisión de
   proceso; lo que queda es **aplicar** I1, no decidir dónde está la puerta.

**Lo que la reunión del 21/08 respondió y §5.8 no sabía:** el IDEA **es anual** (§5.36) — el supuesto
detrás de la puerta quedó contestado en el sentido que obliga al cambio, no en el que lo evita.

### 3.2 Las decisiones que aterrizan en M11.3 — medidas, no heredadas de la hoja

Recorriendo §5 y §6 de `handoff.md`:

| Decisión | Qué le pide a M11.3 | ¿Implementable hoy? |
|---|---|---|
| **§5.36 (I1)** IDEA anual | reformular «Δ sólo B−A» → «Δ sólo dentro del mismo instrumento» (R1-01); implementar «qué IDEA rige» | **Bloqueada** hasta que I1 aterrice `idea.anio` y B2(b) responda |
| **§5.35 (H3)** la puerta de §5.8 va **antes** de M11.3 | I1 (`idea.anio`) se hace **antes** de escribir servicios | Es una precedencia, no trabajo de M11.3 — ver BLOQUE 4.4 |
| **§5.41 (I6)** usuarios, roles, asignación técnico↔grupo | modelo de usuarios; «el técnico ve sólo sus grupos»; ADMIN asigna y crea ADMIN | **Bloqueada** por B5 (roles: ¿lista cerrada?) y la matriz de permisos (Fase 4) |
| **§5.67 (L14)** Lucas toma M11.3 | secuencia · firma=bloqueo · Δ mismo instrumento · baremo desde `pct` · Anexo A · §IX del PAI por tipo · qué IDEA rige | mixto — ver BLOQUE 2 y 6.2/6.3 |
| **§5.71** divulgación — guards | quién puede divulgar (matriz §5); si el consentimiento habilita; 2 CHECK cruzados diferidos; compuerta revisado→entregado | **Bloqueada** por B7/B11/B12 |
| **§5.72 → §5.79** `tecnico_grupo` | construir la tabla `tecnico_grupo` (esbozo en §5.79) **+ el servicio de asignación** que la lee, con vigencias | **Bloqueada** por B5 (roles) y B6 (¿hace falta historia de asignaciones?). El esbozo está; el invariante «≤2 vigentes sin solape» necesita `EXCLUDE` + `btree_gist` (1.ª extensión del repo — decisión de M11.3) |
| **§5.16 (D7)** puntuación independiente | guard «diferencia ≥2 exige documentar» al firmar; resolución de «NS vs número» | **Implementable** en cuanto exista el servicio de firma; el umbral ya está en `constantes.py` |
| **§2.13** (§5.40 / I5) estado de revisión de informes + área configurable | estado `borrador → revisado → entregado`; área de generación configurable (no catálogo fijo) | **Bloqueada** por B7 |
| **§2.16** (§5.70) guards de acceso al ateneo | visibilidad del clínico; enmascarado por consultante; `ateneo.participantes` → relación | **Bloqueada** — necesita el modelo de usuarios (§5.72) |
| **§2.17** registro de accesos con motivo (HCE-LOG) | `motivo` + firma en cada lectura; registro automático con credencial | **Bloqueada** — modelo inexistente + requisito legal a confirmar con IPPU (B9 roza el tema) |
| **§2.8** abrir un año nuevo de grupos desde la app | alta de grupo (crear el año, asignar técnicos) + HCE-LOG con `hce_id NULL` | **Implementable** como feature de M11.3/M11.4; **no** es precondición (ver R1-07) |
| **§2.9** administrar los catálogos de talleres y centros | endpoints de alta/orden/orientación/retiro para `taller` y `catalogo_centro_educativo` | **Implementable** — misma pantalla que §2.8 |

**Serie L (§5.54–§5.59) — qué cambió por debajo desde la puerta de §5.8:**
- **§5.54:** HCE-PAI es **solo esquema, sin guards**. M11.3 hereda **dos guards de PAI**: §IX por `tipo`
  y el **Anexo A** (bloqueado, BLOQUE 5.3).
- **§5.55 (L2):** «carga única por campo, no por sección» — no cambia trabajo de M11.3, pero fija que la
  §V/§VI/§XI del PAI **leen en vivo** de `inclusion` y de los instrumentos: M11.3 tiene que exponer esas
  lecturas cuando construya el endpoint del PAI (M11.4).
- **§5.56 (L3):** `PAI_AREAS` / `PAI_PRESTACIONES` / `PAI_CIRCUITO` son constantes con CHECK — sin gestión
  de catálogo que construir.
- **§5.57 (L4):** `pai_prestacion` es declaración fechada, **no** lectura en vivo. Puntero de construcción
  para M11.3/M11.4: **aviso de divergencia** contra una tabla de equivalencias
  `BPS_PRESTACIONES` ↔ `PAI_PRESTACIONES` «si conviene». Opcional, no bloqueante.
- **§5.59 (L6):** §VII/FODA salió de `pai`; la cifra de campos propios es **39**. Sin efecto en M11.3
  más allá de no modelar guards para una sección que no existe.

---

## BLOQUE 4 — I1 (`idea.anio`), re-medido

### 4.1 Backend — el costo, medido contra `Base.metadata` y los tests (2026-09-10)

| Qué | Medido antes (§5.31 · R0) | Medido acá | ¿Coincide? |
|---|---|---|---|
| Columnas de `idea` | 23, sin `anio` | **23**, sin `anio` (`list(Base.metadata.tables['idea'].columns)`) | ✅ |
| `UNIQUE` sobre `idea.hce_id` que cambiar | ninguno (`ix_idea_hce_id … unique=False`) | **ninguno** — constraints de `idea`: PK, 3 FK, 2 CHECK (`rango_total`, `evaluadores_distintos`). Sin UNIQUE. | ✅ |
| FKs entrantes a `idea.id` | 1 (`puntuacion_idea.idea_id`, CASCADE) | **1** — `puntuacion_idea.idea_id → idea.id ondelete=CASCADE`. Es **por instancia**: sigue correcta con N filas. **0 a reconectar.** | ✅ |
| Construcciones `Idea(` en tests | 9 en 3 archivos | **9** — `test_esquema_v2.py` ×4 (`:44,:49,:57,:58`), `test_m12_consenso.py` ×4 (`:40,:294,:297,:305`), `test_m12_severidad.py` ×1 (`:388`). Ninguna pasa `anio=`. | ✅ |
| Tests rotos con `anio` **nullable** | 0 | **0** — todas dejarían `anio=NULL`. `test_idea_admite_varias_lineas_base_por_expediente` (`test_esquema_v2.py:55-58`) agrega 2 `Idea` al mismo `hce` con `anio=NULL` cada una; con `UNIQUE(hce_id, anio)` estándar (NULLs distintos en Postgres) **sigue pasando**. | ✅ |
| Patrón `UNIQUE(hce_id, anio)` ya en el esquema | 3 veces | **3** — `uq_informe_cierre_hce_anio`, `uq_protocolo_hce_tipo_anio`, `uq_grupo_nombre_anio`. (`grupo`, `informe_cierre`, `pai`, `protocolo` tienen columna `anio`.) | ✅ |

**El cambio backend es puramente aditivo: `anio` (nullable) + `UniqueConstraint("hce_id","anio")`,
regenerar la migración única (§5.19), tocar el docstring de `Idea` y `esquema-datos-v2.md` §2.2.
0 FKs, 0 tests rotos.**

### 4.2 La regla «qué IDEA rige»

- **Dónde vive hoy:** SÓLO en prosa, en el docstring de la clase `Idea`, `app/models/modulos.py:211-233`.
  Concretamente `:228-233`: *«la vigente es la de mayor `fecha_consenso`. ⚠️ Esa regla … también queda
  para reformular en M11.3 (§5.36 / §5.35): con un IDEA por año, «la más reciente» y «la de este año»
  dejan de ser la misma pregunta, y qué IDEA rige a una fecha pasada es un guard todavía sin escribir.»*
  El marcador que M12.8b-2 dejó está en `:213-221` («Desactualizado por decisión … I1»).
- **Qué tocaría reformularla:** (a) el docstring de `Idea`; (b) un guard nuevo en el servicio de flujo de
  M11.3 — «dado un PAI/informe con fecha F, el IDEA que rige es el de `anio = year(F)`», que **no se puede
  escribir sin `idea.anio`**; (c) `esquema-datos-v2.md` §2.2 (fila `idea`) y §4. **No** toca migración de
  datos (no hay datos) ni la FK de `puntuacion_idea`.
- **Cruce con B2(b)** (`preguntas-ippu.md`): *«cuando un documento viejo muestra un IDEA, ¿el sistema debe
  mostrar el IDEA de ese año o el más reciente?»* — **sin responder** (`respuestas-reunion` §16, bloque
  3.b «quedó sin contestar»). El guard concreto depende de esta respuesta.

### 4.3 Demo — los usos, contados por archivo (2026-09-10)

`nna.flujo.lb` es un **objeto único, no una colección** (`demo/js/flujo.js:39` `Object.assign(f.lb,{…})`;
`:41` `f.lb.kind`). Accesos `(flujo|fl).lb` medidos con `grep -oE '(flujo|fl)\.lb\b'`:

| Archivo | usos `(flujo\|fl).lb` |
|---|---|
| `demo/js/evaluaciones.js` | 5 |
| `demo/js/flujo.js` | 5 |
| `demo/js/catalogos.js` | 2 |
| `demo/js/hce-doc-org-vf.js` | 2 |
| `demo/js/informe-cierre.js` | 2 |
| `demo/js/expediente.js` | 1 |
| **total** | **17** en **6 módulos** |

Un 7.º archivo, `demo/js/ui-core.js:138`, lee el estado de la LB de forma indirecta (KPI «Sin línea base
IDEA» vía `estadoModulo`), sin el literal `flujo.lb`. **La cifra en circulación «~18 usos en 6 módulos»
(§5.31 / R0) se verifica: 17 accesos directos en 6 módulos, más el indirecto de `ui-core.js`.** Pasar el
IDEA a anual obliga a un **selector de año** en esos 6 módulos — que §5.31 describe como «el trabajo que
la v3.3 ya tenía hecho y que M4 retiró».

### 4.4 ¿I1 antes o dentro de M11.3? — RECOMENDACIÓN (no decisión)

**Recomendación: antes**, que es donde §5.35 y §5.36 ya la ponen, y por una razón concreta que este
relevamiento agrega: **«qué IDEA rige a la fecha» es un guard central de M11.3 (§5.67) y no se puede
escribir de forma coherente sin `idea.anio`** — sin la columna, «la de este año» no es una consulta
expresable. El costo backend está medido tres veces y es aditivo (0 FK, 0 tests). El costo caro (selector
de año en 6 módulos de la demo) **no es trabajo de M11.3**: la demo es una vía aparte y el backend de
M11.3 no la toca. Hacer I1 primero deja a M11.3 escribiendo contra un modelo estable en vez de contra uno
que sabe que va a cambiar. **Lucas decide.**

---

## BLOQUE 5 — Lo que bloquea M11.3 desde afuera

### 5.1 Bloque B de `docs/notas/preguntas-ippu.md` — «bloquea M11.3»

El bloque B tiene **12 preguntas** (B1–B12), todas rotuladas «Qué bloquea: M11.3» o una parte de M11.3.
Ninguna tiene respuesta. Clasificadas por si bloquean el **arranque** o sólo una **parte**:

| # | Pregunta (resumen) | Qué bloquea exactamente | ¿M11.3 puede arrancar sin ella? |
|---|---|---|---|
| **B1** | §4 y §8 del Manual + Anexo A | el cálculo de totales del IDEA y la verificación previa a la firma (Anexo A) | **Sí, en parte** — la secuencia, firma=bloqueo, baremo, fotos, histórico se pueden escribir; el **Anexo A no** |
| **B2** | (a) ¿puntúan por separado? (b) ¿qué IDEA rige? | (a) si el kappa sirve desde el día 1; **(b) el guard «qué IDEA rige a la fecha»** | (a) sí — todo es nullable, una eval sólo-consenso es válida; **(b) no** — ese guard queda para cuando responda |
| **B3** | ¿registrar participación por taller? | el alcance de `pai_taller` (existe ya) | **Sí** — la tabla está; si sobra, se ignora |
| **B4** | ¿la secuencia **traba** o **avisa**? | **el default del motor de flujo** (409 duro vs. constancia registrada) | **Parcial** — el motor se construye igual; falta el default. Conviene tenerla antes de fijar el comportamiento |
| **B5** | roles: ¿lista cerrada? ¿referente por NNA? | el **vocabulario de roles** y la forma de `tecnico_grupo` | **No para la parte de usuarios/asignación**; sí para el resto |
| **B6** | ¿ver quién estuvo antes en un grupo? | si `tecnico_grupo` guarda **vigencias** (desde/hasta) | **No para `tecnico_grupo`**; sí para el resto |
| **B7** | informes: tipos + «área configurable» | el **estado de revisión** y la generación configurable (§2.13) | **No para la capa de informes/divulgación**; sí para el flujo clínico |
| **B8** | históricos con la «Guía del aplicador» corrida | la estrategia de **migración de datos** (pre-piloto) | **Sí** — no hay datos ni migración en M11.3 |
| **B9** | reserva de datos del adolescente frente a tutores | el **modelo de la reserva por-entrada-contra-actor** (M11.3) + Fase 4 | **Sí para el núcleo**; abre una pieza nueva de modelo, no bloquea lo demás |
| **B10** | ¿qué abre una instancia nueva de IDEA, ahora que es anual? | la implementación de §5.36 en M11.3 | **Parcial** — va de la mano de I1 y B2(b) |
| **B11** | ¿anonimizado individual ≠ agregado? | si el guard de `alcance_dato` mira **2 o 3** valores (§6.6) | **No para el guard de divulgación**; sí para el flujo clínico |
| **B12** | copia de la HC a la familia: ¿divulgación o acceso? | **en qué tabla se registra** la entrega al titular | **No para esa pieza**; sí para el resto |

**Lectura:** de las 12, **ninguna bloquea el bloque central de M11.3** (secuencia, firma=bloqueo,
validaciones §4.3, baremo desde `pct`, fotos §8.4, histórico inmutable, auditoría de campo, guard de
consenso D7). Lo que bloquean es, en grupos: **B1** → Anexo A; **B2(b)/B10** → «qué IDEA rige»;
**B5/B6** → usuarios y `tecnico_grupo`; **B7/B11/B12** → informes y divulgación. **B4** no bloquea pero
conviene tenerla antes de fijar el comportamiento del motor.

### 5.2 `puntos-a-validar.md` §2.8 — «abrir un año nuevo de grupos»

- **R0 lo marcó «⚠️ AHORA BLOQUEA»**, pero su propia letra chica (`puntos-a-validar.md:735`) dice: *«Qué
  bloquea. **Nada hoy** — los grupos de 2026 están sembrados y el año no cambia hasta marzo.»*
- **Re-medido:** los 5 grupos reales están en la base (`SELECT nombre, anio FROM grupo` →
  `Adolescentes/Escolares/Inicial/Preadolescentes/Taller de Adolescentes`, todos `anio=2026`). El
  renombrado 4→5 lo hizo **M12.8a-1** (§5.61 / I2, marcado `[x]` en §6). Lo que queda de §2.8 es **crear/
  renombrar grupos desde la app** (`app/routers/` vacío, seed *insert-only*).
- **Conclusión (R1-07):** §2.8 **no es una precondición de M11.3** — es una **feature que M11.3/M11.4
  tiene que incluir** (alta de grupo + asignación de técnicos + HCE-LOG con `hce_id NULL`), en la misma
  pantalla que §2.9 (administrar catálogos de talleres/centros) y §2.11 (usuarios). El rótulo «BLOQUEA»
  se refería a «IPPU usando el sistema año a año» (Fase 3+), no al arranque de M11.3.

### 5.3 Manual §4 y §8 (`puntos-a-validar.md` §1.16 / B1)

- **Estado:** el Manual de Procedimientos v1.0 tiene 25 secciones y **no está en el repo**. Se trabaja
  con la versión de consulta embebida en el Prototipo v4 (`const MANUAL`), que cubre 23. Faltan
  exactamente **§4** (cierra «Marco general» — probablemente roles/habilitación del personal o los grupos
  de referencia) y **§8** (paso interno del IDEA, entre puntuar e interpretar el perfil — probablemente el
  cálculo de totales por escala; encaja con el **Anexo A**).
- **Qué bloquea de M11.3:** **§8 y el Anexo A** describen el cálculo de totales del IDEA y la verificación
  previa a la firma — «es justo lo que M11.3 implementa» (B1). El **resto** de M11.3 no las necesita
  (§5.54 dejó dicho que el esquema se escribió sin ellas). §4 **no es del PAI** — el Manual no tiene una
  Parte del PAI.

---

## BLOQUE 6 — Síntesis

### 6.1 Hallazgos (citables como `R1-NN` desde §5 y §6)

- **R1-01 · La regla del Δ está a medio reformular en los documentos.** `esquema-datos-v2.md` §4 fila 4
  (`:723`) y `backend/README.md:131` conservan «Δ sólo B−A, jamás entre instrumentos»; §5.36 la reformuló
  a «Δ sólo dentro del mismo instrumento» porque la vieja **bloquea la comparación IDEA-año-contra-año que
  IPPU pidió**. El propio esquema ya usa la nueva en §2.2 `:788` → se contradice. **Reescribir la fila 4
  del §4 es prerrequisito de escribir ese guard.** No se tocó acá (parte B es solo lectura; y roza el
  pase de vocabulario M12.8b-3).
- **R1-02 · «Qué IDEA rige» vive sólo en prosa y para el modelo viejo.** `app/models/modulos.py:228-233`
  — regla escrita para línea base única («la de mayor `fecha_consenso`»). Con IDEA anual, «la más
  reciente» ≠ «la de este año». **No hay código que la implemente** y no se puede escribir sin
  `idea.anio` (I1) ni sin la respuesta a **B2(b)**.
- **R1-03 · La capa de servicios sigue en cero.** `app/services/` no existe; `routers/__init__.py` y
  `schemas/__init__.py` = 0 bytes; único endpoint `/health` (`main.py:33`). **Los 20 renglones de la tabla
  §4 «reglas duras» apuntan a servicios inexistentes.** Igual que R0 el 2026-08-26 — el backend no cambió
  en la parte de servicios; lo que se movió (M12.5–M12.8a) es capa de modelo.
- **R1-04 · `Idea` docstring todavía abre con «línea base única».** `app/models/modulos.py:211` —
  D-12 de R0 sigue abierto. M12.8b-2 agregó el marcador de I1 (`:213-221`) pero **no reescribió la
  primera línea**, que es lo primero que lee quien abra el archivo. (Fix natural: junto con la
  implementación de I1.)
- **R1-05 · Punteros a `puntos-a-validar.md` §2.15 desactualizados en `pai.py`.** `app/models/pai.py:146`
  y `:568` mandan la tensión de `pai_prestacion` a §2.15 «como pregunta abierta»; **§2.15 fue RESUELTO por
  §5.57 (L4)** — salida 2, `pai_prestacion` es declaración fechada. Lo que queda de §2.15 es sólo el
  puntero de construcción (aviso de divergencia, opcional, M11.3/M11.4). No bloquea; es un puntero stale.
- **R1-06 · I1 sigue sin implementar y su puerta está antes de M11.3** (§5.35). Backend aditivo
  confirmado por 3.ª vez (0 FK, 0 tests rotos); el costo real es la demo (17 usos `flujo.lb` en 6
  módulos, medido) y el guard R1-02.
- **R1-07 · `puntos-a-validar.md` §2.8 no bloquea el arranque de M11.3.** R0 lo rotuló «AHORA BLOQUEA»;
  su propia letra chica dice «Qué bloquea: nada hoy». Es trabajo que M11.3/M11.4 **debe incluir** (alta de
  grupo desde la app), no una precondición.
- **R1-08 · `tecnico_grupo` no existe** (§5.79 la difirió a M11.3). Esbozo en §5.79. Su forma depende de
  **B5** (roles) y **B6** (¿vigencias?). Su invariante «≤2 asignaciones vigentes sin solape» exige
  `EXCLUDE` + `btree_gist` — **la primera extensión de Postgres del repo**, decisión de M11.3 (§5.2.2
  cierra la vía de los triggers).
- **R1-09 · El bloque central de M11.3 no está bloqueado por IPPU.** Secuencia, firma=bloqueo,
  validaciones §4.3, baremo desde `pct`, fotos §8.4, histórico inmutable, auditoría de campo y el guard de
  consenso D7 son **construibles hoy** con el modelo que existe. Lo bloqueado es periférico y agrupado:
  Anexo A (B1), «qué IDEA rige» (B2b/I1), usuarios+`tecnico_grupo` (B5/B6), informes+divulgación
  (B7/B11/B12).
- **R1-10 · `backend/README.md:131` lista sólo 4 reglas duras** («secuencia · firma=bloqueo · Δ sólo B−A
  · baremo desde el % oficial») y con la formulación vieja del Δ. Menor; va al mismo pase que R1-01.

### 6.2 Qué puede arrancar M11.3 HOY, en orden

1. **Reescribir la fila 4 del §4 de `esquema-datos-v2.md`** (Δ → «dentro del mismo instrumento», §5.36) y
   `backend/README.md:131`. **R1-01.** Es documentación, pero es prerrequisito del guard del Δ.
2. **Andamiaje:** crear `app/services/`, los `schemas/` Pydantic base y el primer router
   (persona/HCE, búsqueda 3 vías) — no depende de ninguna respuesta.
3. **Motor de flujo `flujo.py`:** `modulo_habilitado()` / `estado_modulo()` derivados (sin drift, como la
   demo M1) + `firmar_modulo()` transaccional (firma + totales materializados + auditoría de campo) +
   endpoint `/addendas`. Construir **las dos ramas** de la secuencia (409 duro y habilitación registrada
   en `excepcion` JSONB + `auditoria`); dejar el **default** parametrizado hasta **B4**.
4. **Validaciones §4.3 por módulo** (Pydantic + servicio): 12 dim sin NS bloquea firma del IDEA, obs
   obligatoria en ítems 1/5 del protocolo, síntesis, fechas.
5. **Guard de consenso D7:** rechazar la firma mientras haya filas con `documentacion_pendiente`
   (`hybrid_property` ya existe, umbral en `constantes.py`). Dejar «NS vs número» explícito como TODO
   documentado (§4).
6. **Servicio VF:** `categoria_baremo(pct)` desde `pct` únicamente (casos `None` → «no corresponde»,
   `0` → categoría 0–4 %). Espejo de salida: la severidad no entra en ningún cálculo de elegibilidad.
7. **Servicio de fotos:** individual (`autorizacion_imagen.registrada`) y grupal (todas las familias
   activas del grupo, derivable hoy), 403 con el detalle de quiénes faltan.
8. **Histórico inmutable:** rechazo de UPDATE/DELETE sobre `documento.es_registro_historico`.
9. **Guard §IX del PAI por `tipo`:** exigir/ocultar la sección «Evaluación del PAI anterior» según
   `pai.tipo = 'Actualización anual'`.

### 6.3 Qué está bloqueado y por qué

| Bloqueado | Bloqueante | Se desbloquea con |
|---|---|---|
| Guard «qué IDEA rige a la fecha» (§5.67) | I1 sin implementar (`idea.anio`) + **B2(b)** sin responder | I1 aterriza la columna; IPSU responde si un documento viejo muestra el IDEA de su año o el más reciente |
| **Anexo A** — cálculo de totales del IDEA + verificación previa a la firma (§5.67) | Manual **§8** y **Anexo A** no están en el repo (**B1** / §1.16) | IPPU entrega §4, §8 y el Anexo A |
| Modelo de usuarios / roles / «el técnico ve sólo sus grupos» (§5.41) | **B5** (¿roles lista cerrada?) + matriz de permisos (Fase 4) | respuesta de IPPU + decisión de matriz |
| Tabla **`tecnico_grupo`** + servicio de asignación con vigencias (§5.79) | **B5** + **B6** (¿hace falta historia?) + decisión sobre `btree_gist` | respuestas de IPPU + decisión de extensión |
| Estado de revisión de informes + área configurable (§2.13) | **B7** (¿qué configura el usuario? ¿qué informes hay?) | respuesta de IPPU |
| Guards de divulgación (quién puede; consentimiento habilita; 2 CHECK cruzados; compuerta revisado→entregado) (§5.71) | **B11** (¿2 o 3 alcances?) + **B12** (copia a la familia: ¿divulgación o acceso?) | respuestas de IPPU |
| Guards de acceso al ateneo (§2.16) | modelo de usuarios (§5.72) por debajo | lo de arriba |
| Registro de accesos con motivo (HCE-LOG, §2.17) | modelo inexistente + requisito legal a confirmar | IPPU define motivo/firma; se diseña la tabla |
| Alta de grupo / administración de catálogos desde la app (§2.8 · §2.9) | nada técnico — es trabajo de M11.3/M11.4 sin dueño de diseño | se prioriza dentro de M11.3/M11.4 |

### 6.4 Preguntas que necesitan una decisión de Lucas antes de escribir código

Redactadas como preguntas, no como propuestas (§12.6: la decisión se escribe en §5, con fecha y autor, y
la escribe Lucas).

1. **¿I1 (`idea.anio`) se hace antes de abrir `app/services/`, o dentro de M11.3 como primer commit?**
   §5.35/§5.36 dicen «antes»; este relevamiento agrega que el guard «qué IDEA rige» no es escribible sin
   la columna. El costo backend está medido (aditivo). ¿Se ejecuta ya, en una sesión propia, o se pliega
   al arranque de M11.3?
2. **¿La fila 4 del §4 de `esquema-datos-v2.md` (y `backend/README.md:131`) se corrigen como parte de
   M12.8b-3 (pase de vocabulario) o como primer paso de M11.3?** Es prerrequisito del guard del Δ
   (R1-01) y hoy el documento se contradice.
3. **¿El motor de flujo se construye con el default «409 duro» o «habilitación registrada», a la espera de
   B4?** El mecanismo (`excepcion` JSONB) sirve para las dos; sólo hay que elegir qué hace si nadie
   contesta. ¿Se asume una y se corrige, o M11.3 espera a B4 para esa parte?
4. **¿`tecnico_grupo` se construye en M11.3 aunque B5/B6 sigan sin responder (con el esbozo de §5.79), o
   espera a las respuestas?** §5.79 dijo «se construye en M11.3, junto con el servicio que la lee» — pero
   también dijo «construir la tabla ahora es fijar una forma que la respuesta puede desarmar».
5. **¿M11.3 incorpora `btree_gist` para el invariante «≤2 asignaciones vigentes sin solape», o ese
   invariante queda como guard de servicio (Python) hasta nueva orden?** Sería la primera extensión de
   Postgres del repo.
6. **¿El alta de grupo / administración de catálogos desde la app (§2.8, §2.9) entra en el alcance de
   M11.3, de M11.4, o abre un sub-módulo propio?** Hoy no tiene dueño de diseño y tres pendientes
   distintos apuntan a «la misma pantalla».
7. **¿El registro de accesos con motivo (§2.17, requisito legal del Protocolo §7–§8) se diseña en M11.3
   como tabla nueva, o se deja explícitamente para Fase 4 junto con el login?** Hoy `tipo='acceso'` está
   en el CHECK de `auditoria` y nada lo escribe.

---

## NÚMEROS

| Concepto | Valor medido | Cómo |
|---|---|---|
| Tablas en `Base.metadata` / físicas | **51 / 51** (+ `alembic_version`) | `len(Base.metadata.tables)`, `inspect().get_table_names()` |
| `pytest -q` | **432 passed, 0 skipped** | `python -m pytest -q` |
| Funciones `def test_` / casos | **274 / 432** | `grep -hE '^\s*def test_' tests/*.py` |
| Head de Alembic / archivos en `versions/` | **`559b1a79cb77` / 1** | `alembic heads`, `ls` |
| `verificar_estado.py --check` / `generar_catalogos_backend.py --check` | **exit 0 / exit 0** | ambos scripts |
| Routers / schemas / services | **0 / 0 / 0** (`app/services/` no existe; `__init__.py` = 0 bytes) | `ls`, `wc -c` |
| Endpoints expuestos | **1** (`GET /health`) | `app/main.py:33` |
| Reglas de negocio en código ejecutable | **0** (todo es CHECK estructural, `hybrid_property` derivado, o prosa) | BLOQUE 1.3 |
| Filas `§4` «reglas duras» marcadas «Pendiente — M11.3» | **8** de 20 | `esquema-datos-v2.md` §4 |
| Preguntas «bloquea M11.3» en `preguntas-ippu.md` bloque B | **12** (B1–B12), **0 respondidas** | `preguntas-ippu.md:79-203` |
| `idea` — columnas / FKs entrantes / `UNIQUE` sobre `hce_id` | **23 / 1 (`puntuacion_idea`, CASCADE) / 0** | `Base.metadata` |
| Construcciones `Idea(` en tests / rotas con `anio` nullable | **9 / 0** | `grep`, análisis de constraint |
| Usos `(flujo\|fl).lb` en la demo | **17** en 6 módulos (+1 indirecto en `ui-core.js`) | `grep -oE '(flujo\|fl)\.lb\b'` |
| Grupos sembrados en la base de dev | **5** (`anio=2026`) | `SELECT nombre, anio FROM grupo` |
| Filas de dominio (expedientes) en la base de dev | **0** | `SELECT count(*)` |
| Hallazgos de este relevamiento | **R1-01 … R1-10** | BLOQUE 6.1 |

### Decisiones de la serie L / L9 que aterrizan en M11.3 — presentes / ausentes de su insumo

| Decisión | Insumo que M11.3 necesita | Estado |
|---|---|---|
| §5.36 (I1) IDEA anual | `idea.anio` + respuesta B2(b) | **AUSENTE** (columna) + **AUSENTE** (respuesta) |
| §5.54 §IX del PAI por tipo | `pai.tipo` + CHECK | **PRESENTE** |
| §5.54 Anexo A del Manual | Manual §8 + Anexo A | **AUSENTE** (no está en el repo) |
| §5.67 baremo desde `pct` | `valoracion_funcional.pct` + `baremo_categoria` (5) | **PRESENTE** |
| §5.67 fotos §8.4 | `autorizacion_imagen` + `foto` XOR + membresía de grupo | **PRESENTE** |
| §5.71 guards de divulgación | respuestas B7/B11/B12 | **AUSENTE** (respuestas) |
| §5.72/§5.79 `tecnico_grupo` + asignación | respuestas B5/B6 + decisión `btree_gist` | **AUSENTE** |
| §5.16 (D7) guard «diferencia ≥2 → documentar» | `puntuacion_*.diferencia` + umbral en `constantes.py` | **PRESENTE** |
| §2.13 estado de revisión de informes | respuesta B7 | **AUSENTE** |
| §2.17 registro de accesos con motivo | tabla nueva + definición legal | **AUSENTE** |
