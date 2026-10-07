# Pendientes resueltos de `handoff.md` §6

> Archivo creado el 2026-09-11 (sesión M12.8b-3a). Contiene los bullets `[x]` que §6 acumuló
> hasta esa fecha, movidos **verbatim** — cifras viejas incluidas, no se corrigen (misma regla que
> `docs/bitacora.md`). Medición previa a la mudanza (M12.8b-1b, 2026-09-10): ningún archivo fuera
> de §6 cita un bullet resuelto por su posición, así que mover no rompe ninguna referencia externa.
> Orden: el mismo en que aparecían en §6. Este archivo no se corrige; si algo cambia, se anota en
> `handoff.md` §5 o §6, no acá.

---

> - [x] ~~**I2 · Los nombres reales de los grupos** (§5.37)~~ → **RESUELTO en M12.8a-1 (2026-09-03).** El
>   seed planta los **cinco** reales (Inicial · Escolares · Preadolescentes · Adolescentes · Taller de
>   Adolescentes) por la vía sancionada —`GRUPOS` en el generador + regeneración de
>   `catalogos_iniciales.json`—; `taller.grupos_orientados` sigue vacío y su dominio queda con esos cinco.
>   ⚠️ **Sigue abierto, en la otra lista:** crear/renombrar grupos **desde la app** (`puntos-a-validar.md`
>   §2.8), y si «Taller de Adolescentes» es el servicio de Taller Terapéutico y no un grupo (pregunta A5
>   de `docs/notas/preguntas-ippu.md`).
>   *(Nota posterior, 2026-10-06: lo de A5 quedó **superado por §5.107** — «Taller de Adolescentes» es un grupo.)*
> - [x] ~~**I7 · Se retira la sección VII del PAI (FODA)** (§5.42, ratificado por **§5.59 / L6**)~~ →
>   **RESUELTO en M12.8a-1 (2026-09-03).** `fort`, `oport`, `debil`, `amen` salieron de `app/models/pai.py`
>   y de la migración; la cifra «campos propios» bajó de 43 a **39** en `CLAUDE.md`, el bloque «Qué se
>   hizo» de M12.6 y `tests/test_m12_pai.py`. Queda un comentario en el lugar de la sección para que no se
>   reincorpore sin cruzar la decisión.
>
> ⚠️ **La entrada que queda (I1) tiene su trabajo detallado en los bloques de abajo.** Acá no se duplica el
> plan: se registra que **hoy la base afirma lo contrario de una decisión firmada**, que es lo que se pierde.

> - [x] ~~**DIVULGACIÓN — DECIDIDA Y AGENDADA a M12.8a** (§5.39 / I4, §5.45 / I10, **§5.71** ·
>   `puntos-a-validar.md` §2.12)~~ → **RESUELTO en M12.8a-3 (2026-09-03, §5.80).** La tabla
>   **`divulgacion`** se construyó en `app/models/divulgacion.py` (15 columnas derivadas del Protocolo
>   §6.2–6.7 y la matriz §5, append-only por postura, sin seed), migración `559b1a79cb77`. ⚠️ **Sigue
>   abierto, y §5.80 no lo toca:** los guards (quién puede divulgar, si el consentimiento habilita, los dos
>   CHECK cruzados diferidos), el **flujo** de compartición y la compuerta «revisado por dirección →
>   entregado» de §5.40 son **M11.3 / M11.4** (§5.71 los difiere), junto con `puntos-a-validar.md` §2.13.
>   Cuatro afirmaciones de IPPU caen sobre este concepto (fotos · confidencialidad · revisión de informes ·
>   resumen y no expediente).
> - [x] ~~⚠️ **Pasar estas respuestas al Google Doc del equipo — a mano, y lo tiene que hacer una
>   persona.**~~ → **CERRADO el 2026-08-26 por §5.53 (K1): el Google Doc está VACÍO** —lo confirmó Lucas
>   mirándolo— y **se retira su designación como artefacto autoritativo. El registro es el repo.** No se
>   cierra por haberse hecho: se cierra **porque no hay destino**. `docs/notas/consulta-a-ippu.md` conserva
>   las 25 respuestas bajo su `> _Respuesta:_` y sigue siendo el snapshot de lo enviado el 19/08.
> - [x] ~~**`puntos-a-validar.md` §2.1 — la deuda declarada de §5.31.** El costo medido del IDEA anual~~
>   → **HECHO** (2026-08-26). El número está escrito en `puntos-a-validar.md` §2.1, medido dos veces
>   (§5.31 el 20/08 y R0 el 26/08) y coincidente: **aditivo · 1 tabla de 38 · 0 FKs · 0 tests rotos si
>   `anio` es nullable**; la parte cara es el **selector de año en la demo**. ⚠️ **Lo que sigue abierto de
>   §2.1 es otra cosa:** ratificar por escrito la *decisión de procedimiento* de haber arrancado M11 sin
>   cruzar su puerta. Eso lo ratifica el equipo, no la reunión (§5.35).
> - [x] ~~Mover el prompt de F1 a `docs/prompts/`~~ → **HECHO** (`281405b`).
> - [x] ~~⚠️ **`grupo` — mostrado y no modelado, y mergear F1 no lo modeló.** `responsable1`,~~
>   ~~`responsable2` y `tecnicosAutorizados` viven en la demo y **§5.18 no los tiene**. Si IPPU confirma~~
>   ~~mañana, eso **no valida un supuesto: abre trabajo de backend**. Va a lista de reconciliación.~~
>   → **CONTESTADO el 2026-08-21, y salió como este pendiente predijo: abre trabajo de backend.**
>   La decisión está en **§5.41 (I6)** y el pendiente vivo, arriba, en el bloque de la reunión.
> - [x] ~~**Pegar el link del Google Doc** en la cabecera de `docs/notas/consulta-a-ippu.md`.~~ →
>   **CERRADO el 2026-08-26 por §5.53 (K1): no hay link que pegar.** ⚠️ **Lo que NO se cierra es la
>   lección de §5.34** — el riesgo de tener media documentación fuera del alcance de cualquier script del
>   repo sigue existiendo, y su arreglo candidato (que `verificar_estado.py` compare prosa) sigue abierto
>   más abajo en esta misma sección.
- [x] ~~Ronda M0–M10 (adaptar la demo al Doc. Técnico)~~ → **COMPLETA** (2026-07-30, demo v4.0). Ver bitácora.
- [x] ~~**Validar la demo v4.0 con IPPU** (puerta de entrada a M11 según el plan; en especial el cambio de IDEA a línea base única).~~ → **La reunión fue el 2026-08-21** y contestó lo que hacía a este pendiente: **el IDEA es ANUAL** (§5.36) — o sea que **el cambio a línea base única estaba equivocado**. ⚠️ **Lo que NO quedó validado** sigue anotado: 6 bandas del IDEA, 7 estados de inclusión, lista de talleres del año, anualización del estado de inclusión (ver `respuestas-reunion-ippu-2026-08-21.md` §16). Ritmo sugerido por el Doc. Técnico §12: revisiones quincenales.
- [x] ~~**F1-nav · ajustes de navegación del frontend · rama `demo/F1-navegacion`** — (a) push y (d) merge/PR~~ → **RESUELTOS · medido el 2026-09-09 (sesión M12.8b-2b).** Cuatro rondas sobre esa rama (**F1-nav** · **F1-nav2** · **F1-nav3** `648cb04` · **F1-nav4** `4f29bc9`), 2026-08-16 → 2026-08-19, ver §13. **La rama ya no existe** —ni local, ni en `gitlab`, ni en `origin`—: se **mergeó a `main` el 2026-08-20 22:34** por el merge `d94b102` (2 padres; «merge: integrar demo/F1-navegacion a main (restyle + B1/B2 + Ateneos + Inclusión)»), presente en los tres (`main`, `gitlab/main`, `origin/main`); **0 commits que la rama tuviera y `main` no**. Los `4f29bc9` · `230b4c0` (merge de `main`) · `554ff37` que la nota original (2026-08-19) daba por «sin pushear» están **todos en `main`**. El «⚠️ CON 4 COMMITS SIN PUSHEAR» y la duda «a qué remotos» se resolvieron **al día siguiente de escribirse** y nadie volvió a mirar en tres semanas. Este clone tiene **los dos remotos** (`gitlab` + `origin`), no sólo `origin`.
- [x] **Cuatro inconsistencias detectadas en el cruce del 2026-08-19** → **LAS CUATRO CERRADAS** (1 y 2 en M12.8b-2, 3 y 4 en M12.8b-4 — ver sub-notas). El texto original y su rastreo se conservan abajo. Eran (ver §13, segunda entrada del día); ninguna bloqueaba, todas de documentación: **(1)** **§9 «Datos clave» quedó pre-M12** y se contradice con §5 y §7 de este mismo archivo — dice «**5 grupos**» (§5.18/D9: son **4** por color) y «**18 talleres**» (§7 Resueltas: son **14**, y el «8 vs 18» **era falso**); además `30 INAU + 108 BPS` = 138, no los «~120 NNA» de la misma línea. **(2)** Los conteos de `puntos-a-validar.md` que declara §6 están viejos: dice «9 puntos para IPPU / 8 para el equipo», el archivo tiene **14** y **10** (los 6 supuestos sí dan). **(3)** Dos preguntas de §7 que nunca entraron a `consulta-a-ippu.md`: **catálogo de centros educativos** —y P31 del cuestionario ya confirmó que el Área de Inclusión existe y está «todo en Drive, sin planilla estructurada», así que hay contexto para preguntarlo— y **«tutor»** (`puntos-a-validar.md` §2.10; está clasificada como punto de equipo, pero el fondo —si hay un referente por NNA distinto del técnico responsable— sólo lo contesta IPPU). **(4)** La deuda de registro de F1-nav3. Se dejaron anotadas y sin tocar porque §9 y los conteos son cambios sobre decisiones que §5 manda modificar por escrito, y la bitácora de F1-nav3 tiene dueño.
  - ⚠️ **Actualización M12.8b-2 (2026-09-09):** **(1) y (2) aplicadas.** §9 y §1 corregidos contra medición — 5 grupos con nombre (§5.61), 14 talleres (§5.14), y la discrepancia `30 + 108 = 138` vs «~120» marcada y ruteada a IPPU (`preguntas-ippu.md` C11); el conteo de `puntos-a-validar.md` que declara §6 se remidió (§1 = 17 subsecciones / 5 abiertas · §2 = 17 / 8 · §3 = 6 supuestos). El argumento de «§5 manda modificar por escrito» ya no aplica: §5.14 y §5.61 están escritas y esta sesión sólo las aplicó. **Siguen abiertas (3)** —las dos preguntas que nunca entraron a `consulta-a-ippu.md`; «tutor» ya está absorbido en `preguntas-ippu.md` B5— **y (4)** —la deuda de registro de F1-nav3—.
  - ⚠️ **Actualización M12.8b-2b (2026-09-09):** **(3) CERRADA — verificado dónde aterrizó cada pregunta.** «tutor» → `preguntas-ippu.md` **B5** (vía `puntos-a-validar.md` §2.11, que «absorbe §2.10»; la nota de deduplicación de B5 nombra «tutor» y lo unifica). Catálogo de centros educativos → `puntos-a-validar.md` **§2.9** (gestión del catálogo de centros junto con la de talleres → M11.3/M11.4) + **§5.52** (`inclusion.centro` es **texto, no FK**; el Prototipo v4 **no tiene** catálogo de centros → no hay nada normativo que sembrar) + `preguntas-ippu.md` **C3** (pedir la planilla del Área de Inclusión, de donde saldría el catálogo — `respuestas-reunion-ippu-2026-08-21.md` §16 lo dispara desde P31). `consulta-a-ippu.md` es snapshot y no se edita. **Queda sólo (4)** —la deuda de registro de F1-nav3, de quien la hizo—.
  - ⚠️ **Actualización M12.8b-4 (2026-09-09):** **(4) CERRADA por declaración — §5.85.** La deuda de registro de F1-nav3 se declara **PERDIDA**: nadie la escribió en tres semanas, la rama `demo/F1-navegacion` ya no existe, y un registro reconstruido por inferencia es peor que un hueco reconocido (§5.83). El registro que queda es el commit `648cb04` y el bullet de F1-nav de este §6. Con esto **las cuatro inconsistencias del 2026-08-19 están cerradas** (1 y 2 en M12.8b-2, 3 y 4 acá).
  - [x] ~~**M11.1** infra Postgres-only~~ → **HECHO** (2026-08-07, rama `feat/m11-backend-v2`). `docker-compose.yml` con Postgres 16 en `127.0.0.1:5440` (§5.9) + base `ippu_test` aparte para pytest; `config.py` **rechaza al arrancar** cualquier URL que no sea Postgres; Alembic sin el batch-mode de SQLite y con `compare_type`; convención de nombres de constraints para que el autogenerate sea reproducible entre las tres máquinas.
  - [x] ~~**M11.2** modelos + migración + catálogos~~ → **HECHO** (2026-08-07). **28 tablas** en 4 módulos (`catalogos` · `identidad` · `modulos` · `transversales`), migración inicial única, y seed idempotente de catálogos **generado desde la demo v4.1** (12 dimensiones IDEA + 60 descriptores, 24 ítems IPPU-TEA, baremo, 12 categorías documentales, 4 recordatorios, 8 talleres, 3 servicios). Se retiró el backend v1 completo (modelos/schemas/routers/seed/tests + 3 migraciones): hablaba del modelo pre-Documento Técnico. **Verificado:** reconstrucción limpia (drop schema → `alembic upgrade head` → seed) + **21 tests estructurales en verde** + API levanta.
    - [x] ~~⚠️ **Primera tarea de M11.3: un reconocimiento estilo R0 contra el código**~~ → **HECHO
      (2026-09-10, sesión M12.8b-1b · PARTE B) — `docs/notas/relevamiento-M11.3-2026-09-10.md` (R1).**
      Solo lectura, en BLOQUES, hallazgos numerados **R1-01…R1-10**. Medido: la capa de servicios sigue
      en cero (0 routers/schemas/services, sólo `/health`); **el bloque central de M11.3 es construible
      hoy** (secuencia, firma=bloqueo, validaciones §4.3, baremo desde `pct`, fotos §8.4, histórico
      inmutable, guard D7); lo bloqueado es periférico y agrupado — **Anexo A** (B1 / §1.16), **«qué IDEA
      rige»** (B2b + I1), **usuarios + `tecnico_grupo`** (B5 + B6), **informes + divulgación** (B7 + B11 +
      B12). Hallazgos que necesitan a Lucas: **R1-01** la regla del Δ está a medio reformular en
      `esquema-datos-v2.md` §4 y `backend/README.md:131` (§5.36 la cambió a «mismo instrumento», el
      documento se contradice) — prerrequisito de escribir ese guard; **R1-02** «qué IDEA rige» sólo en
      prosa (`modulos.py:228-233`) y para el modelo viejo; **R1-07** §2.8 (abrir año de grupos) **no**
      bloquea el arranque, es feature de M11.3/M11.4. **I1 re-medido:** backend aditivo (0 FK, 0 tests
      rotos); demo **17 usos `flujo.lb` en 6 módulos**. Recomendación (no decisión): I1 **antes** de
      M11.3, porque «qué IDEA rige» no es escribible sin `idea.anio`. Las 7 preguntas para Lucas están en
      el BLOQUE 6.4 del relevamiento.
  - [x] ~~**M12.0** decisiones al papel + verificación del punto de partida~~ → **HECHO** (2026-08-14, Lucas).
        HTML del prototipo incorporado, mapas de estructura actualizados, repo verificado contra la realidad
        y **diff de los 60 descriptores reportado** (ver bitácora §13).
  - [x] ~~**M12.1** correcciones al esquema existente~~ → **HECHO** (2026-08-14, Lucas). **D9 confirmada**
        e implementada · 6 bandas (`banda_idea`) · interpretación del Δ (`delta_interpretacion`, la alerta
        Δ ≤ −7 sale de ahí) · `manual_version` + metadatos de origen · `idea_ficha`/`idea_ejemplo`/
        `idea_regla` + `descriptor_breve` · recordatorios 4 → 8 · auditoría a nivel campo · vocabulario ·
        cita Rivière 1997/2002. **33 tablas**, generador de catálogos versionado,
        **53 tests en verde + 1 salteado a propósito** → tras la enmienda **§5.19** (mismo día): migración
        regenerada con las 33 tablas y **54 en verde, 0 salteados**. Ver bitácora §13.
  - [x] ~~**M12.2** puntuación independiente y consenso (D7)~~ → **HECHO** (2026-08-14, Lucas). **35 tablas**:
        `puntuacion_idea` (0–8 + `NS` tipado en 3 estados) y `puntuacion_protocolo` (1–5), con `valor_t1`/
        `valor_t2` **nullable**, `documentacion`, `diferencia` como **columna generada** y evaluadores en
        `idea`/`protocolo` con `CHECK` de que no sean la misma persona. **El consenso no se movió** de
        `dim`/`items`. `procedimiento` y `documentacion_pendiente` son derivados (`hybrid_property`), y los
        tres tramos (0 · 1 · ≥2) son **constante y no catálogo** — es el invariante metodológico del
        Manual. **El guard queda para M11.3**; kappa **no** se calcula. **74 tests en verde, 0 salteados**,
        migración regenerada (`f54959f07cc4`) con el test de coincidencia pasando. Ver bitácora §13.
  - [x] ~~**M12.3** catálogo dinámico de talleres (D5)~~ → **HECHO** (2026-08-14, Lucas). Los **14 reales**
        del prototipo reemplazan a los 8 de la demo; `taller` suma `orden`, `grupos_orientados`
        (**array de nombres de color, no FK**: con D9 un `grupo_id` ataría el taller a un año) y
        `retirado_en`, y **`activo` pasó a derivado** (`hybrid_property`). Se **retiró `hce_taller`**
        (§5.20): la participación la crea M12.6 como `pai_taller`, por nombre. ⚠️ **34 tablas — bajó de 35
        y no es regresión:** M12.3 no crea tablas. El test de participación del plan se traspasó a **M12.6**
        (§5.21). **92 tests en verde, 0 salteados**, migración regenerada (`3f11e10c13ed`). Ver bitácora §13.
  - [x] ~~**M12.4** HCE-SEV · Severidad DSM-5-TR~~ → **HECHO** (2026-08-15, Lucas). **36 tablas**:
        `severidad_dsm` (**0..1 por expediente, PK = `hce_id`**, dos dominios independientes 1–3,
        justificación / fecha / profesional NOT NULL) y su catálogo `severidad_nivel` (3 grados con
        etiqueta, los dos descriptores largos y los apoyos, generados de `SEV_*`). Las **etiquetas se
        derivan**, no se guardan. ⚠️ **Se retiró `hce_diurna.nivel_soporte`** (§5.24) — es una columna,
        no una tabla: **el conteo sube de 34 a 36 por las dos tablas nuevas, nada más**. **123 tests en
        verde, 0 salteados**, migración regenerada (`f432ea139fd9`). Ver bitácora §13.
  - [x] ~~**M12.7** Ateneos y jornadas~~ → **HECHO** (2026-08-15, Lucas). **38 tablas**: `ateneo` (una
        sola entidad con campos según tipo, como el prototipo) y `ateneo_acuerdo`. **`AT_TIPOS` entró
        como constante, NO como catálogo** (`core/constantes.py::ATENEO_TIPOS`) porque el tipo es el
        **discriminador** contra el que están escritos los 5 CHECK de obligación/prohibición: como
        catálogo editable, un quinto tipo cargado desde la app caería fuera de todos. **`codigo`
        (`AT-2026-001`) y `sensible` son derivados**, no columnas — el correlativo real es
        `UNIQUE(anio_correlativo, numero)`, patrón de D9. **Dos decisiones nuevas: §5.25** (HCE-DOC gana
        alcance institucional — `documento.hce_id` nullable + `ateneo_id` + XOR) y **§5.26** (nomenclatura
        `hce_id` = pertenencia · `hce_<calificador>_id` = referencia, **que M12.6 hereda**).
        **240 tests en verde, 0 salteados**, migración regenerada (`9246e659d2c9`). Ver bitácora §13.
  - [x] ~~**M12.5** HCE-INC · Inclusión educativa y social~~ → **HECHO** (2026-08-26, Lucas).
        **42 tablas**: `inclusion` (ficha), `inclusion_bitacora` (gestiones) y **dos catálogos** —
        `estado_inclusion` (7 filas, con descripción y semáforo) y `catalogo_centro_educativo`
        (**0 filas, a propósito**). Los otros cuatro vocabularios del módulo (`INC_TIPOS`, `INC_TEMAS`,
        `INC_MEDIOS`, `INC_ROLES`) entraron como **constantes** con CHECK, no como catálogos: son listas
        planas sin atributos, y `INC_TEMAS` además es el **discriminador** de `sensible` — el mismo
        argumento con que `AT_TIPOS` es constante (M12.7). **`sensible` es derivado**
        (`tema == 'Clínica — sensible'`), con expresión SQL para que la Fase 4 pueda filtrar **en la
        base**; su docstring dice explícitamente que significa **restringido para COMPARTIR, no para
        guardar** (I4 · §5.39 / I10 · §5.45) y que **hoy es una clasificación sin efecto**, porque el
        modelo todavía no representa la divulgación. **Tres decisiones nuevas: §5.50** (regla de lectura
        de fuentes con demo adentro, **que M12.6 y M12.8 heredan**), **§5.51** (el estado es continuo, no
        anual — pregunta abierta a IPPU en `puntos-a-validar.md` §1.15) y **§5.52** (`centro` es texto,
        no FK — se suma a `puntos-a-validar.md` §2.9). **307 tests en verde, 0 salteados**, migración
        regenerada (`aa26917b6e76`). Ver bitácora §13.
  - [x] ~~**M12.6** HCE-PAI~~ — **HECHO el 2026-09-02, en modo SOLO ESQUEMA** (§5.54). **8 tablas**:
        `pai` (39 campos propios — eran 43 en M12.6; la sección VII/FODA salió en M12.8a, §5.59) +
        `pai_objetivo` · `pai_evaluacion_previa` · `pai_equipo` ·
        `pai_coordinacion` · `pai_taller` · `pai_prestacion` · `pai_circuito`. **50 tablas**, **389 tests**,
        migración `72b96030362d`. Decisiones **§5.55 (L2)** —los campos editables de las secciones I y II
        son columnas propias, la carga única es **por campo y no por sección**— y **§5.56 (L3)** —los tres
        vocabularios del PAI son **constante y no catálogo**, y lo dice el propio prototipo—. El test de
        participación que §5.21 traspasó desde M12.3 **quedó escrito**. Ver bitácora §13.
        ⚠️ **Lo que M12.6 NO hizo, a pesar de tenerlo asignado: los nombres reales de los grupos (I2).**
        Se sacó del alcance de M12.6 a propósito; **lo ejecutó M12.8a-1 (2026-09-03)** — el seed planta
        los cinco reales (§5.61). Queda sólo la creación/renombrado **desde la app**
        (`puntos-a-validar.md` §2.8).
  - [x] ~~**Corregir `docs/markdown/prototipo-v4-referencia.md:166`**~~ → **HECHO (2026-09-02, sesión L5).**
        La línea decía «las secciones I, II, VI, XI y XV … modelarlas como referencias»; ahora dice
        **VI, XI y XV**, y una nota ⚠️ remite a **§5.55 (L2)**: los siete campos editables de I y II
        (`ingresoIppu` + los seis de §II) son **columnas propias de `pai`**. Corregido contra la lista
        «Campos de cabecera (`p.pai`)» del mismo archivo, sin reinvestigar.
    - [x] ~~**M12.8b-1** — `backend/docs/esquema-datos-v2.md` al día, pase acotado~~ → **HECHO
          (2026-09-03/04, sesión M12.8b-1, solo documentación).** El documento pasa a **v3** (encabezado
          de versión + registro de cambios); **el archivo no se renombra** (§5.81). Puesto al día:
          cabecera y §3 al estado medido (**51 tablas**, migración `559b1a79cb77`), `grupo` con los cinco
          nombres reales (§5.61), `idea` descrito como está + aviso **I1 / §5.36**, `ateneo.observaciones`
          (§5.66), **`divulgacion`** completa en §2.3 + §1 + §4 (§5.80), esbozo de `tecnico_grupo` **NO
          construido** (§5.79), bloque §12-A reescrito en prosa (§5.65). ⚠️ El criterio §12-A: los cuatro
          números `IDEA 58 · PA 60 · PB 79 · Δ +19` **se verificaron presentes y consistentes** en
          `demo/js/flujo.js` (Arquetipo 1 / Martín / 102) — el checkpoint previo los había dado por
          ausentes por un grep incompleto; §5.65 y su premisa quedan intactas (ver bitácora §13).
    - [x] ~~**M12.8b-1b** — la **sección HCE-PAI** del documento del esquema~~ → **HECHO (2026-09-10,
          sesión M12.8b-1b, sólo documentación).** `esquema-datos-v2.md` §2.2 describe las **8 tablas /
          81 columnas** de `app/models/pai.py` (re-medidas contra `Base.metadata` **y** la migración
          `559b1a79cb77` — coinciden con el 8 / 81 de M12.8b-1), en el formato de HCE-INC/ateneos, con
          las decisiones §5.14, §5.20–§5.23, §5.26, §5.54–§5.57, §5.59 y los tres recuadros (NO GUARDS ·
          §4/§8 del Manual sin identificar · `pai_prestacion` como excepción a §5.22). **§1:** `pai` + 7
          hijas agregadas al ER; retirado el aviso «diagrama incompleto». **§4:** dos filas de guards de
          PAI (§IX por `tipo`, Anexo A — la 2.ª BLOQUEADA por fuera, §1.16 / B1). **Cabecera, registro de
          versiones (fila v3) y §3:** cobertura 43/51 → **51/51**. Se agregó también el **nombre oficial
          «Proyecto de Atención Integral»** (§5.42, `puntos-a-validar.md` §1.11). Commits `a93eea3` +
          `474d93b`.
    - [x] ~~**M12.8b-2** — pase mecánico de prosa en el resto de los documentos vivos (no toca el
          esquema)~~ → **HECHO (2026-09-09, sesión M12.8b-2, sólo documentación + 2 docstrings de `app/`).**
          Corregidos: `CLAUDE.md` (432 tests · «documento v3, el archivo no» · «Δ sólo dentro del mismo
          instrumento» + dueño de M11.3 y §12-A→M11.5), `handoff.md` §0.5 (307→432 — **no estaba en la
          lista de M12.8b-1**), §6 (bullet `tecnico_grupo` → §5.79 · bullet DIVULGACIÓN → RESUELTO §5.80),
          §9/§1 (14 talleres §5.14 · 5 grupos con nombre §5.61 · discrepancia 138 vs ~120 → `preguntas-ippu.md`
          C11), `docs/estructura-repositorio.md:223` (307→432 · + 2 tests que faltaban en la lista),
          `preguntas-ippu.md` B5/B6 (`tecnico_grupo` a M11.3) + **C11** nueva, `esquema-datos-v2.md`
          (`grupos_orientados` = nombres §5.61 sin CHECK · `creado_en/actualizado_en` «1 de 38» → **3 de
          51**), y las docstrings de `Grupo` (`identidad.py`: cuatro colores → cinco nombres reales) e
          `Idea` (`modulos.py`: marca I1 / §5.36). Conteo de `puntos-a-validar.md` remedido: §1 = 17
          subsecciones / 5 abiertas · §2 = 17 / 8 · §3 = 6. Ver bitácora §13.
- [x] ~~**DECISIÓN TÉCNICA PENDIENTE — la tabla `grupo` no admite más de un año.**~~ → **CERRADA**
  (2026-08-14, **§5.18 / D9**): opción (b), **id propio + `UNIQUE(nombre, anio)`**, y el nombre pasa a ser el
  **color** (Azul · Celeste · Naranja · Verde), que es el dominio real de IPPU. **Confirmada por el equipo
  e implementada en M12.1** (modelo, FKs de `hce_diurna` y `foto` a entero, seed de los 4 grupos, 5 tests).
  Queda **un residuo más chico anotado en §5.18**: con granularidad anual, un cambio de técnico a mitad de
  año sobrescribe la fila y sólo deja rastro en `auditoria`. El planteo original queda abajo como registro:
- [x] ~~**ENVIAR A IPPU:** `docs/notas/consulta-a-ippu.md`~~ → **ENVIADO el 2026-08-19**, sin respuesta todavía (§5.28: es una pregunta en vuelo, no un silencio). ⚠️ **El equipo lo revisó antes de mandarlo y sacó tres preguntas, y el repo describió mal el documento hasta el 2026-08-20 (§5.34).** Contenido real de lo enviado: **Parte 1** lo que entendimos de su trabajo (6 puntos) · **Parte 2** **8** supuestos que tomamos —no 10: se retiraron los dos del **baremo**— · **Parte 3** **14** dudas puntuales —no 11: las agregaron M12.2 (§3.8, puntuación independiente) y M12.7—. Las ⚠️ que quedaron en el documento enviado son **tres**: **2.1** (¿el IDEA se hace una vez o todos los años?), **3.2** (acceso al sistema actual) y **3.8** (puntuación independiente); **3.1** (talleres) va sin ⚠️ porque el Prototipo v4 ya la respondió, y **3.12** (ateneos de grupo) la marcó M12.7. **La cuarta ⚠️ que este pendiente nombraba —«citas bibliográficas de la escala»— ya no existe:** era §3.2 del borrador y **nunca se preguntó** → `puntos-a-validar.md` §1.4. **La numeración cambió de §2.7 y §3.2 en adelante** (mapa en §5.34): citar siempre por la del archivo, que es la que IPPU tiene delante. ⚠️ **Y los dos documentos ya no son «el mismo contenido»** — `consulta-a-ippu.md` es el snapshot de un Google Doc del equipo; `puntos-a-validar.md` es interno y **más largo**.
- [x] ~~**Modularizar la demo**~~ → **HECHO** (2026-08-07, §5.5). La demo dejó de ser recurso exclusivo: **se puede trabajar en paralelo** tomando archivos distintos de `demo/js/`.
- [x] ~~**Demo — analítica institucional real**~~ → **HECHO** (2026-08-07, demo **v4.1**, ver §3 y bitácora). Los 4 KPIs y los gráficos por escala se calculan del modelo; se agregó la tarjeta de evolución Protocolo A → B. Hallazgo del camino: dos de los indicadores viejos no estaban hardcodeados por comodidad sino que eran **incalculables por diseño** desde M4. **Lo que queda abierto ahí:** el heatmap de talleres sigue con datos de muestra (§5.1.3) y el cruce taller × escala no va a tener sustento hasta que haya varios NNA con el ciclo A → B cerrado — hoy hay **1 de 7**.
- [x] ~~**Re-indexar el grafo de conocimiento (`graphify-out/`)**~~ → **HECHO** (2026-08-07). Pasó de 572 nodos / 870 aristas / 80 comunidades a **736 / 1.039 / 163**, ya con los 12 módulos de `demo/js/` como comunidades propias. **La extracción semántica de los 25 documentos quedó cacheada**, así que re-correrlo no vuelve a gastar LLM salvo en los archivos que cambien. Dos cosas a saber: el diagnóstico reporta **67 aristas con extremo colgante** (5,8 % — el extractor emitió aristas hacia IDs que no declaró como nodos; artefacto típico de LLM, no corrupción), y `cost.json` **subregistra esta corrida** con 0 tokens porque los subagentes murieron por límite de sesión antes de poder reportar su uso.
- [x] ~~**Rama `gitlab/feature/base-datos-hce` (Victor):** aparcada, **no** descartada (§5.3). Decidir en reunión de equipo qué se hace con ella al terminar M11.~~ → **CERRADO el 2026-09-03 (§5.68 / L15):** archivada como tag anotado **`archivo/base-datos-hce`** (sobre `dfb1732`, en los dos remotos) y **borrada de `gitlab`**. Ver §12.5.
- [x] ~~Elegir un remoto principal~~ → **decidido 2026-08-07: `gitlab` principal, `origin` espejo** (§5.4, ver §12.2).
- [x] ~~Definir **stack backend**~~ → **Python + FastAPI + SQLAlchemy + Alembic**, SQLite en dev → PostgreSQL en prod. (Lucas eligió esta recomendación.)
- [x] ~~Diseñar **esquema de datos**~~ → hecho y documentado en `implementacion/L1-hce-idea/backend/docs/esquema-datos.md` (+ diagrama ER interactivo como Artifact). 14 tablas núcleo + 4 provisionales (áreas/general). **Pendiente:** los **9 endpoints CRUD** (Fase 2).
- [x] ~~**Fase 2 (backend):** endpoints CRUD~~ → hecho: 20 endpoints (NNA CRUD + búsqueda/estado, IDEA, Likert, observaciones, eventos, catálogo, personas) con validación Pydantic, Swagger en `/docs`, `total`/`equivalente_idea` calculados en servidor. **12 tests pytest en verde** (base aislada). **Pendiente:** endpoints de áreas/general (provisionales) y de notas si hicieran falta.
- [x] ~~Extender la demo con los módulos faltantes~~ → hecho (v3.1): Grupos, Usuario, Eval. por áreas y Eval. general. **Pendiente:** que IPPU defina los protocolos reales de "por áreas" y "general" (hoy son provisionales); luego ajustarlos. Ya commiteado y pusheado (commit `cbb3119`).
- [x] ~~Demo v3.2~~ → hecho: pantalla de **inicio de sesión** (usuario pre-creado), **barra de búsqueda** en inicio (nombre/apellido, N.º de HCE, cédula — tolerante a acentos y puntos), **distinción activos/inactivos** (campo `activo`, filtro por estado, alta/baja desde el expediente) y paso **Anamnesis** en el alta de NNA (wizard reordenado: Datos del NNA → Datos clínicos → Anamnesis → Confirmar). Verificado con Playwright (19/19 checks). **Pendiente:** login real (JWT) y persistencia son backend.
- [x] ~~Demo v3.3~~ → hecho: **listado simplificado** (N.º HCE, C.I., Nombres, Apellido, Estado); **editar NNA** (modal reutilizado en modo edición); **evaluaciones movidas al expediente** (barra de botones Anamnesis · IDEA · Intermedia · Áreas · General bajo el encabezado; se quitaron del sidebar); vista **Pendientes** (NNA activos sin IDEA anual); **IDEA con frecuencia ANUAL** (selector por año, KPIs y seguimiento anuales); **informe por NNA** generado automáticamente con **descarga vía Imprimir→PDF** (`@media print`) y **guía de interpretación** de bandas embebida. Verificado con Playwright headless (27/27 + PDF). **Pendiente (no prioritario):** separar HTML/CSS en archivos y organizar por pestañas. **Pendiente:** que IPPU defina protocolos reales de áreas/general y de la evaluación anual.
- [x] ~~inicializar git~~ → hecho: repo privado `lucaspimentel-uy/IPPU-UTEC`. Recordar `git push` tras cambios. (Ojo: `handoff.md`/`CLAUDE.md`/conversor no se versionan a propósito.)
- [x] ~~Crear repo en GitLab de UTEC~~ → hecho: proyecto **privado** `juan.pimentel/IPPU-UTEC` (https://git.utec.edu.uy/juan.pimentel/IPPU-UTEC). Remoto local `gitlab` (además de `origin`=GitHub). SSH puerto 22 bloqueado → se usa **HTTPS**. Para pushear a UTEC: `git push gitlab main` (pide credenciales: PAT o login por navegador vía Git Credential Manager).

