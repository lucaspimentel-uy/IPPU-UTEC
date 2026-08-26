SESIÓN R0 · RELEVAMIENTO DE ESTADO — SOLO LECTURA

Contexto. Proyecto IPPU × UTEC-LIDIA, backend en implementacion/L1-hce-idea/backend/.
Venimos de la ronda M12 (absorción del Prototipo v4). El 21/08 hubo reunión con IPPU y varias
decisiones del modelo cambian. Antes de tocar nada necesito saber en qué estado real está el
repo, porque la documentación y el código ya divergieron dos veces y el handoff arrastra
conteos que no sé si son ciertos.

TU TAREA ES RELEVAR, NO ARREGLAR. No propongas cambios. No corrijas nada de lo que
encuentres roto: lo registrás y seguís.

REGLA DE EVIDENCIA (la más importante)
Toda afirmación va con archivo:línea o con la salida del comando que la produjo.
Si algo lo dice un .md pero no lo confirma el código, se reporta como
"SÓLO DOCUMENTADO — no verificado en código". No infieras de la documentación.
Si no podés verificar algo, escribí "NO VERIFICABLE" y por qué. Preferible a una respuesta
prolija y falsa.

PROHIBIDO
- Editar, crear o borrar cualquier archivo, salvo el único de salida (abajo).
- git commit / checkout / merge / stash / rebase.
- alembic upgrade | downgrade | revision | stamp.
- python -m app.seed_catalogos.
- Cualquier INSERT / UPDATE / DELETE / DROP contra la base de desarrollo.

PERMITIDO
- Lectura de archivos, grep, git log / branch -a / status / show / diff.
- docker compose up -d (es entorno, no dato).
- alembic current y alembic heads.
- SELECT contra la base de desarrollo.
- pytest -q (corre contra la base de TEST, no la de desarrollo; verificá antes que
  TEST_DATABASE_URL != DATABASE_URL y si son iguales NO corras nada y reportalo).

SALIDA
Un único archivo nuevo: docs/notas/relevamiento-estado-2026-08-26.md
Un bloque por sección, en este orden, cada uno con sus respuestas y su evidencia.
No escribas ningún otro archivo.

---

BLOQUE 0 — Dónde estamos parados
- Rama actual, últimos 20 commits (oneline), ramas locales y remotas.
- ¿Hay cambios sin commitear? ¿Hay commits sin pushear?
- alembic heads y alembic current. ¿Coinciden?
- Cantidad real de tablas en la base de desarrollo (contadas por SELECT, no leídas de un doc).
- pytest -q: número exacto de passed / failed / skipped y exit code.
- Buscá los commits d37a59e y f432ea139fd9 y 9246e659d2c9: ¿están en la rama actual?

BLOQUE 1 — La tabla `idea` (va a pasar a ANUAL)
- Columnas reales, PK, índices y constraints. ¿Existe algún UNIQUE sobre hce_id?
- ¿Qué FKs apuntan a idea.id? Listalas con archivo:línea y su ondelete.
- Contá y listá todos los sitios (código + tests + docs) donde aparece la idea de
  "línea base única": docstrings, comentarios, nombres de tests, esquema-datos-v2.md.
- Contá cuántos tests construyen Idea( y en qué archivos.
- ¿Existe ya alguna columna anio en idea, o algo equivalente?

BLOQUE 2 — Consentimiento y motor de flujo (esto es lo que más me importa)
- ¿Dónde está implementada la regla "sin consentimiento firmado no se avanza"?
  Modelo, servicio, CHECK, trigger, test — todos los lugares, con archivo:línea.
- ¿Es una regla de base de datos, de servicio, o sólo de la demo (front)?
- ¿Qué campos tiene hoy el consentimiento? ¿Alcanzan para "nombre del responsable +
  botón firmar + fecha" o hay campos obligatorios de más?
- Si mañana hubiera que dejar que el expediente avance SIN consentimiento firmado:
  ¿cuántos archivos y cuántos tests habría que tocar? Dame el número, no una estimación
  cualitativa.

BLOQUE 3 — Fotos y autorización de imagen
- ¿Dónde se valida la autorización de imagen? ¿Bloquea GUARDAR la foto, o bloquea
  COMPARTIRLA / exportarla?
- ¿Existe alguna noción de "compartir" o "exportar" en el modelo, o todo lo que hay
  es almacenamiento?
- Idem para la autorización grupal (foto con varios NNA).

BLOQUE 4 — La tabla `grupo`
- Columnas reales, constraints, y cómo se modelan los técnicos a cargo.
- ¿Qué valores tiene sembrados hoy (SELECT)? ¿Cuántas filas y con qué nombres y años?
- ¿Qué FKs apuntan a grupo.id?
- ¿Existe algún endpoint, servicio, script o función que CREE un grupo? (no el seed:
  creación desde la aplicación). Si no existe, decilo explícitamente.
- ¿El seed de grupo es insert-only? ¿Qué test lo fija?

BLOQUE 5 — Informes
- Forma real de informe_cierre: columnas, UNIQUE, FKs.
- ¿Existe alguna otra entidad de informe además del de cierre? ¿Algo con destinatario,
  solicitante, o tipo de informe?
- ¿Hay algo de generación de PDF ya implementado en el backend? ¿Dónde?

BLOQUE 6 — Ateneos (módulo cerrado, quiero saber qué tiene de verdad)
- Columnas reales de ateneo y ateneo_acuerdo, con sus CHECK.
- ¿Cómo está definida AT_TIPOS y cuáles son las 4 claves exactas?
- ¿Existe un campo de observaciones? Si no, ¿qué campos de texto libre hay y para qué
  tipo aplica cada uno?
- ¿Cómo se derivan `sensible` y `codigo`? Pegá el código.
- Adjuntos: ¿cómo quedó el XOR de documento (hce_id vs ateneo_id)? ¿Hay restricción de
  tipo de archivo (ej. pptx) en algún lado?
- ¿Existe grupo_id en ateneo? ¿Con qué FK y qué ondelete?

BLOQUE 7 — Lo que NO existe (confirmación negativa, es tan importante como lo que sí)
Confirmá con búsqueda, no con lectura del plan, si existen o no:
- pai / pai_objetivo / pai_equipo / pai_coordinacion / pai_taller / pai_evaluacion_previa
- inclusion / inclusion_bitacora / catalogo_centro_educativo
- usuario / rol / permiso / cualquier tabla de asignación técnico↔grupo
- cualquier cosa relacionada con autenticación, sesión o login

BLOQUE 8 — hc_historico
- Tipo de columna, nullable, y si tiene alguna validación de formato hoy.
- ¿En qué tablas está el OrigenMigracionMixin y qué columnas aporta?

BLOQUE 9 — Severidad y catálogos
- severidad_dsm: PK, cardinalidad real (¿0..1 por expediente?), constraints.
- Catálogo de bandas del IDEA: ¿cuántas filas, es editable desde la app, hay algo que
  impida modificarlo? ¿Se guarda en `idea` qué versión de bandas se usó?
- Listá todos los catálogos sembrados con su conteo de filas (SELECT), y decí cuáles
  tienen la marca de "sólo al crear" y cuáles los pisa el seed.

BLOQUE 10 — Divergencias documentación ↔ código
Contrastá contra lo que encontraste, y listá cada diferencia:
- handoff.md cabecera (dice 38 tablas / 240 tests / M12.7 hecho)
- backend/README.md (dice qué es una corrida válida de pytest)
- PLAN-M12-absorcion-prototipo-v4-2026-08.md
- backend/docs/esquema-datos-v2.md
- CLAUDE.md
Para cada divergencia: qué dice el doc, qué dice el código, y cuál de los dos está viejo.

---

CIERRE DEL INFORME
Terminá con una sección "NÚMEROS" de una sola tabla: tablas, tests (passed/skipped),
head de alembic, rama, y sub-módulos M12 presentes/ausentes verificados por código.
Sin conclusiones, sin recomendaciones, sin próximos pasos. Sólo el relevamiento.