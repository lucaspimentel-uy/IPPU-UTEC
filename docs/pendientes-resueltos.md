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

---

## Movido el 2026-10-16 — sesión H2 (`handoff.md` §5.137)

> Mudanza de lo **cerrado** y lo **superado** de `handoff.md` §6 y §7 (más el cuerpo viejo de §4), **verbatim**:
> cifras y nombres de archivo viejos incluidos, no se corrigen. Cada bloque lleva antes del texto una línea
> «Cierra / destino» con la decisión o el motivo que lo saca de §6/§7. Los bloques marcados **PARTIDO** o **REESCRITO**
> dejaron en §6 o §7 un ítem corto con lo que seguía abierto. Técnica del stub de §5.84: `handoff.md` conserva los
> encabezados «6.» y «7.», así que toda cita a «§6» o «§7» sigue resolviendo; los identificadores `P-NN`, `Q-NN` y
> `S-NN` son de esta mudanza.

### 6. Pendientes — cerrados o superados

**[P-01] Nota de §6: «La cola resuelta de §6 se archivó el 2026-09-11»**  
*Cierra / destino: reemplazada por la nota nueva de §6 (§5.137).*

> **La cola resuelta de §6 se archivó el 2026-09-11 (sesión M12.8b-3a), medido y aprobado en
> M12.8b-1b (2026-09-10) sin causar rework** — ningún archivo fuera de §6 cita un bullet resuelto
> por su posición. **42 bullets `[x]` (199 líneas) pasaron, verbatim, a
> `docs/pendientes-resueltos.md`**, con la misma técnica de stub que usó §13 (§5.84): §6 queda con
> los **39 bullets `[ ]` que siguen abiertos**. Las citas «§6» que apuntan a un pendiente abierto
> siguen resolviendo igual; una cita a un bullet ya resuelto por posición no existía (condición
> verificada antes de mover).

---

**[P-02] «DECIDIDO, SIN IMPLEMENTAR» — texto y entrada I1**  
*Cierra / destino: I1 HECHO el 2026-09-16 (§5.36, §5.91); la lista se revisó contra M11.3 y quedó con una sola entrada viva (§5.103 B12), en §6.*

> ### 🛑 DECIDIDO, SIN IMPLEMENTAR — decisiones de §5 que la base de datos contradice hoy
>
> **Qué es esta lista y por qué existe** (2026-08-26, sesión de higiene). Una decisión escrita en §5 rige
> desde que se firma (§12.6), pero **el esquema puede seguir diciendo lo contrario durante semanas**. Esa
> ventana no está anotada en ningún lado: §5 dice qué se decidió y los bloques de arriba dicen qué falta
> hacer, pero **nada dice «el código todavía afirma lo contrario de esto»**. Se abre esta lista para que
> ninguna de las dos se pierda de vista, y con una regla: **una entrada sale de acá cuando la base deja de
> contradecir la decisión, no cuando alguien la mira.**
>
> ⚠️ **Vacía desde el 2026-09-16 (I1 cerró la única entrada que tenía).** Se deja la explicación de arriba
> porque el mecanismo sigue vigente para la próxima decisión de §5 que la base tarde en reflejar — no
> porque haga falta algo acá ahora.
>
> - [x] ~~**I1 · El IDEA es ANUAL**~~ (§5.36) → **HECHO (2026-09-16, sesión M12.8-cierre+I1, Parte B).** La
>   base ya **no** contradice la decisión: `idea.anio` existe (`SmallInteger NOT NULL`, mismo tipo que
>   `grupo.anio`) con `UNIQUE(hce_id, anio)` (`uq_idea_hce_anio`), mismo patrón que `protocolo`/
>   `informe_cierre`. NOT NULL, no nullable como preveía la medición original (§5.31/R0): el costo de
>   exigirlo era sólo `anio=` en 9 construcciones `Idea(` de test, y los otros dos `*_anio` del esquema ya
>   eran NOT NULL — con el UNIQUE puesto, nullable habría dejado sin proteger justamente las filas cargadas
>   sin año. **R1-01 también se corrigió en el mismo cambio:** `esquema-datos-v2.md` §4 fila 4 y
>   `backend/README.md:131` ya no dicen «Δ sólo B−A»; dicen «Δ sólo dentro del mismo instrumento» (§5.36).
>   ⚠️ **Lo que queda, deliberadamente fuera de I1 (§5.91):** el **selector de año en la demo**
>   (`nna.flujo.lb` es un objeto único, ~18 usos en 6 módulos — es la mitad del round de demo, no de
>   backend) y **la regla de «cuál IDEA rige»**, que sigue en prosa como «la de mayor `fecha_consenso`»
>   (`app/models/modulos.py`, docstring de `Idea`) — su reformulación es de **M11.3** (§5.36/§5.35), que
>   además necesita **B2(b)/B10** (`docs/notas/relevamiento-M11.3-2026-09-10.md`) antes de escribirse. No
>   se abrió `app/services/` ni se escribió ningún router. ✅ **[Actualizado el 2026-10-05: B2(b)/B10
>   respondidas y la regla DEFINIDA en §5.97 («su año» / «firmado de mayor `anio`»); el docstring de `Idea`
>   ya no dice «mayor `fecha_consenso`». La implementa M11.3.]**

---

**[P-03] Encabezados de los grupos anteriores de §6**  
*Cierra / destino: reemplazados por los tres grupos nuevos de §6 (§5.137 d).*

> ### 🆕 Pendientes abiertos por la reunión con IPPU del 2026-08-21 (registrada el 2026-08-26, §5.36–§5.49)
>
> **Ninguno de estos existía antes de la reunión. Todos tienen decisión escrita detrás y ninguno tiene
> dueño.** El detalle de cada uno está en `docs/notas/puntos-a-validar.md`.
>

> ### 🆕 Abiertos / movidos por la sesión L9 (2026-09-03, §5.70–§5.78)
>

> ### 📌 Pendientes abiertos por la Fase B del 2026-08-20 (F1 aterrizó — estos ya no esperan a nada)
>
> **Los que decían «cuando aterrice F1» y ahora se deben por nombre:**

> **Nuevos de esta noche:**

---

**[P-04] Los nombres de grupo (había sido «BLOQUEANTE»)**  
*Cierra / destino: los cinco nombres reales ya están sembrados (M12.8a-1, §5.61; «Taller de Adolescentes» es un grupo, §5.107); lo que seguía abierto (crear/renombrar desde la app) sigue en §6.*

> - [x] ~~**Los nombres de grupo — pasaron de hueco anotado a BLOQUEANTE**~~ → **La etiqueta
>   «BLOQUEANTE» era falsa — corregida en M12.8b-3a-bis (2026-09-11), medido, no sólo re-leído.**
>   **RE-MEDIDO contra la base** (`SELECT nombre, anio FROM grupo`): los **cinco** nombres reales
>   —**Inicial · Escolares · Preadolescentes · Adolescentes · Taller de Adolescentes**— ya están sembrados,
>   todos con `anio = 2026` (M12.8a-1, §5.61). **El dominio de `taller.grupos_orientados`** (M12.3) ya está
>   documentado contra los cinco nombres reales, **sin CHECK** (documentación, no restricción) —
>   `esquema-datos-v2.md:577`, corregido por M12.8b-2 —. Lo que sí sigue siendo cierto y **es el único
>   registro de esto**: el seed es ***insert-only*** sobre `grupo` — no hay endpoint, servicio, script ni
>   pantalla que cree o renombre un grupo desde la aplicación.
>   - **Observación de por qué la etiqueta duró tanto:** «corregir los nombres es exactamente la operación
>     que no se puede hacer» era cierto de **la base** (el seed es insert-only) y se sobregeneralizó a
>     todo. Es plausible que por eso tres barridos seguidos saltearan `demo/`, donde los nombres están
>     *hardcodeados* y sí son editables — ver el bullet nuevo de `demo/js/grupos-usuario.js` más abajo.

---

**[P-05] Modelar usuarios, roles y asignación técnico↔grupo (ACOTADO)**  
*Cierra / destino: PARTIDO: `tecnico_grupo` cancelada (§5.100) y login mínimo hecho (§5.101, §5.118); lo abierto (vocabulario de roles, matriz) sigue en §6 como «Roles y matriz de permisos completos».*

> - [ ] ⚠️ **ACOTADO el 2026-10-05 (§5.100/§5.101): `tecnico_grupo` CANCELADA; para el 26/11 sólo login mínimo `admin` \| `tecnico`; el resto de la matriz es posterior.** **Modelar usuarios, roles y asignación técnico↔grupo** (§5.41 / I6 · **§5.72** · **§5.79** ·
>   `puntos-a-validar.md` §2.11). Un usuario por técnico · el técnico ve sólo sus grupos · ADMIN ve todo,
>   asigna y crea otros ADMIN. ⚠️ **§5.79 derogó la ubicación de §5.72:** la tabla **`tecnico_grupo`** N:M
>   con vigencias (aditiva, al lado de `tecnico1_id`/`tecnico2_id`) **NO entra en M12.8a — se construye en
>   M11.3**, junto con el servicio de asignación que la va a leer; §5.79 deroga la *ubicación*, no la
>   decisión de fondo. ⛔ **[Superado el 2026-10-05: §5.100 CANCELA la tabla.]** **`grupo.tecnico?_rol` ya existen** y no se agregan. **Queda también para M11.3 /
>   Fase 4:** el **vocabulario de roles** (lista de 5 propuesta en §5.72, a confirmar por Lucas — no va
>   todavía a un CHECK), la **conflación `admin` ↔ «dirección no técnica»** del Protocolo, y toda la
>   **matriz de permisos**. Con `tecnico_grupo` fuera de M12.8a, esta pieza ya **no agranda M12.8**. Ver
>   §5.87 (2026-09-11): la tabla es M11.3, el servicio de asignación espera a B5/B6. ⛔ **[Superado el
>   2026-10-05: §5.100 cancela la tabla; §5.101 fija el alcance del 26/11.]**

---

**[P-06] `tecnico_grupo` se cancela y `btree_gist` no entra**  
*Cierra / destino: §5.100.*

> - [x] ⛔ **CERRADO el 2026-10-05 (§5.100): `tecnico_grupo` se CANCELA y `btree_gist` no entra** — sin tabla no hay invariante que expresar (B6 «No», B5b «No»). *Se conserva el hallazgo como historia:* ⚠️ **El invariante «≤2 asignaciones vigentes por grupo, sin solaparse» de `tecnico_grupo` (§5.79)
>   NO es expresable como está descrito — hallazgo de M12.8b-3a, verificado contra el modelo, NO decidido
>   ni construido.** §5.79 afirma que hace falta un `EXCLUDE` con `btree_gist`; eso es cierto pero
>   insuficiente: un `EXCLUDE` se evalúa **de a pares** (`EXCLUDE (grupo_id WITH =, periodo WITH &&)`
>   impide una SEGUNDA fila que se solape con la primera — expresa «a lo sumo UNA vigente», no dos) y no
>   hay una formulación de `EXCLUDE` que exprese directamente «a lo sumo DOS». Un discriminador de slot
>   (`EXCLUDE (grupo_id WITH =, slot WITH =, periodo WITH &&)`) sí daría exactamente dos, pero el esbozo
>   de §5.79 tiene **`rol text, SIN CHECK`** — una etiqueta libre, verificado contra el esbozo: tres filas
>   con tres `rol` distintos lo satisfarían igual. **Verificado también contra el modelo:**
>   `grupo.tecnico1_id`/`tecnico2_id` siguen existiendo (`app/models/identidad.py:131,133`) y son la
>   fuente de verdad — el «a lo sumo 2» ya está garantizado estructuralmente ahí, por tener exactamente
>   dos columnas. `tecnico_grupo` es la **historia** (debe poder registrar a A en marzo, a B en junio y a
>   A saliendo), no el invariante. **Dónde propagó la afirmación no verificada:** §5.79 (`handoff.md`),
>   y `docs/notas/relevamiento-M11.3-2026-09-10.md` BLOQUE 3.2 (línea 253), BLOQUE 6.1 (líneas 430–431),
>   BLOQUE 6.3 (línea 471) y la pregunta 5 del BLOQUE 6.4 (línea 496). **No se corrige acá** (R1 y §5.79
>   son registros, no se corrigen): queda como punto abierto nombrado para quien diseñe el servicio de
>   asignación en M11.3.

---

**[P-07] Ateneos — dos faltantes concretos (observaciones y adjuntos)**  
*Cierra / destino: PARTIDO: el campo de observaciones existe (`ateneo.observaciones`, M12.8a-1); los adjuntos siguen en §6.*

> - [ ] **Ateneos — dos faltantes concretos** (§5.46 / I11): un campo explícito de **observaciones** (hoy
>   no existe) y **adjuntos de documentos, PPTX en particular** (hoy no hay ninguna validación de tipo de
>   archivo). «Agregar acuerdo» ya existe y se queda.

---

**[P-08] Re-confirmar que el consentimiento no traba el flujo**  
*Cierra / destino: §5.94 (IPPU lo confirmó por escrito).*

> - [x] ✅ **CERRADO el 2026-10-05 (A3, §5.94): IPPU lo confirmó por escrito.** ~~⚠️ **Re-confirmar con IPPU el punto de segunda mano: el consentimiento no traba el flujo**~~
>   (§5.38 / I3). Es el **único** ítem de la serie I que no se escuchó en la reunión. **Primero en la
>   lista del próximo contacto.**

---

**[P-09] Preguntar cuánto del Prototipo v4 es material de IPPU**  
*Cierra / destino: §5.92 (el Prototipo v4 dejó de ser fuente normativa: la respuesta ya no condiciona nada).*

> - [ ] **Preguntar cuánto del Prototipo v4 es material de IPPU y cuánto es relleno generado** (§5.37).
>   Los cuatro nombres de grupo por color **estaban adentro del Prototipo v4** y no son de IPPU: si eso
>   pasó una vez, la **fuente normativa de precedencia 1** (§5.10) necesita el mismo escrutinio que le
>   hicimos al cuestionario.

---

**[P-10] Pase mecánico de vocabulario («fase» y numeración de líneas)**  
*Cierra / destino: M12.8b-3b CANCELADA, §5.92.*

> - [ ] **Pase mecánico de vocabulario: «fase» y numeración de líneas** (§5.75 / §2.3 y §5.76 / §2.4). Las
>   dos decisiones están cerradas; falta **renombrar las apariciones en los documentos vivos** — un término
>   por sentido (**etapa** backend · **etapa del convenio** · **línea** · **ronda** · **fase** sólo para el
>   Documento Técnico) y citar siempre «L1 = HCE». Conteo por archivo en §2.3. **No** se tocan las fuentes
>   (`Documento de trabajo.md`, cuestionario Q47, `docs/prompts/*`, `relevamiento-*`): se anota la
>   divergencia. Es un pase aparte, sin dueño.

---

**[P-11] Partir `handoff.md` — mitad hecha, la otra mitad medida**  
*Cierra / destino: §5.84 (bitácora mudada), cola de §6 archivada el 2026-09-11 y ahora de nuevo (§5.137 d); §5 no se muda: es referencia fuera del arranque (§5.114, §5.137 a).*

> - [ ] **Partir `handoff.md` — mitad hecha, la otra mitad medida.**
>   - ✅ **§13 (la bitácora) se mudó a `docs/bitacora.md` el 2026-09-09** (M12.8b-4, §5.84). Verificada
>     **byte-idéntica** (mismo sha256, 2.014 líneas / 266.246 bytes), con stub de redirección acá.
>     `handoff.md` pasó de **5.081 → 3.139 líneas (−38 %)** · 537 KB → 278 KB (−48 %).
>   - **¿Se muda también §5? — precio medido en M12.8b-4, sin decidir nada.**
>     - `handoff.md` sin §13 son **3.139 líneas**; de eso **§5 = 2.411 (77 %)**, §6 = 441 (14 %), estado
>       (§0–§4, §7–§12) + stub = 281 (9 %). Sacar §5 dejaría `handoff.md` en **~700 líneas**.
>     - Citas que **nombran el archivo** pegado a `§5.NN` (`handoff.md §5.NN`, con o sin backtick, hasta
>       4 separadores): **181** fuera de `docs/prompts/` (+6 dentro, históricas). `puntos-a-validar.md` 29
>       · `preguntas-ippu.md` 21 · `esquema-datos-v2.md` 13 · `estructura-repositorio.md` 13 · `PLAN-M12`
>       11 · `consulta-a-ippu.md` 10 · `CLAUDE.md` 10 · `README.md` 6 · `constantes.py` 5 ·
>       `backend/README.md` 5 · `generar_catalogos_backend.py` 5 · `catalogos.py` 4 · resto ≤3. En
>       `app/` + `tests/`: **~29**.
>     - Total `§5.NN` en el repo: **1.886**. Las otras **~1.705 (90 %)** son la forma escueta «§5.NN» sin
>       ruta: **no se rompen** vivan donde vivan las decisiones. (Medido con `grep -rhoE` sobre `§5\.[0-9]+`
>       menos `node_modules`/`graphify-out`; las filename-adjacentes, con `handoff(\.md)?` seguido de hasta
>       4 separadores y `§5\.[0-9]+`.)
>     - Con la **misma técnica del stub** (conservar `## 5. Decisiones tomadas` como redirección) las 181
>       tampoco se rompen: el costo mecánico baja a **un stub + una línea** en
>       `herramientas/verificar_estado.py:90` — `FIN_DE_LO_VIGENTE = re.compile(r"^##\s*5\.\s", …)` pasaría
>       a `r"^##\s*6\.\s"` para que el corte de «lo vigente» sea §6. **`verificar_estado.py:59` es el
>       único lector programático de `handoff.md`**; nada más en `app/`, `tests/` ni `herramientas/` lo abre.
>     - Lo no-mecánico: §5 es append-only y lo consultan las sesiones para la regla anti-contradicción
>       (§12.6). Sacarlo de «el archivo que se lee primero» es decisión de Lucas, no medición.
>   - **Archivar la cola resuelta de §6 — medido en M12.8b-1b (2026-09-10), sin mover nada.** Lucas aprobó
>     archivar la cola `[x]` de §6 **a condición de que no cause rework**; esta medición es esa condición.
>     - §6 son **441 líneas** (2523–2963). Checkboxes: **40 abiertos `[ ]` / 40 resueltos `[x]`** (a
>       cualquier indentación). El grupo resuelto ocupa **≈173 líneas ≈ 39 %** de §6 (asignando cada línea
>       al último bullet abierto hasta el siguiente bullet o encabezado). ⚠️ **Medido al abrir la PARTE C;
>       el cierre de esta misma sesión marcó `[x]` dos bullets más (M12.8b-1b y el reconocimiento de
>       M11.3), así que al terminar son ~38 / ~42.** Coincide con «40 / 40 y ~40 % de
>       líneas» de la última medición.
>     - **Ningún archivo de fuera de §6 cita un bullet resuelto por su posición.** `grep` de
>       `handoff.md §6` / `§6` sobre `docs/` + `app/` + `tests/` + `demo/` + `CLAUDE.md` + `docs/bitacora.md`:
>       todas las citas son (a) punteros genéricos «ver §6 para el estado» / «§6 fija el procedimiento», o
>       (b) punteros a bullets **abiertos** — **I1** (`esquema-datos-v2.md:73,817`, `README.md:109`),
>       A3/C8/C9/C10 (`preguntas-ippu.md:302`). La única cita que **toca** un bullet resuelto es
>       `relevamiento-estado-2026-08-26.md:1260` (D-10 cita la entrada F1-nav) — y R0 es un registro
>       congelado que ya la da por resuelta; moverla no lo invalida.
>     - `verificar_estado.py` **no lee §6**: corta `handoff.md` en `## 5.` (`FIN_DE_LO_VIGENTE`,
>       `verificar_estado.py:90`) y sólo compara su cabecera (`SOLO_CABECERA`). Archivar la cola de §6 no
>       lo afecta.
>     - **La técnica del stub de M12.8b-4 cubre el caso** —y apenas hace falta—: como nadie cita un bullet
>       resuelto por posición, un puntero de una línea donde estaba la cola alcanza; las citas genéricas a
>       «§6 = pendientes» siguen resolviendo porque §6 sigue existiendo con sus 40 abiertos.
>     - **Rework de archivar la cola resuelta: cero.** Si es una sesión o tres lo decide Lucas.

---

**[P-12] Cabecera de estado en `puntos-a-validar.md`**  
*Cierra / destino: ya existe: el archivo abre con «Estado» y con el aviso «No son el mismo contenido» respecto de `consulta-a-ippu.md`.*

> - [ ] **Cabecera de estado en `puntos-a-validar.md`**, como la que ganó `consulta-a-ippu.md`: qué es,
>   qué no es, y que **ya no es «el mismo contenido»** que la consulta.

---

**[P-13] Plegar `respuestas-reunion-ippu-2026-08-21.md`**  
*Cierra / destino: los cuatro pasos están hechos (§5.53); el archivo se conserva a propósito (§16 y las dos correcciones de acta).*

> - [ ] **Plegar `docs/notas/respuestas-reunion-ippu-2026-08-21.md`** — ⚠️ **3 de 4 pasos HECHOS el
>   2026-08-26; el archivo NO se borra.** Hechos: los «sí» pasaron a `puntos-a-validar.md` con fecha, los
>   «no» abrieron entradas en §5 (serie **I**, §5.36–§5.49) y las respuestas se escribieron bajo su
>   `> _Respuesta:_` en `consulta-a-ippu.md`. ⚠️ **El cuarto —el Google Doc del equipo— quedó cumplido
>   el 2026-08-26 por §5.53 (K1): el Doc está vacío y se retiró su designación.** Con eso **los cuatro
>   pasos están**, y aun así **el archivo NO se borra**, por la razón que este pendiente ya daba y que
>   nunca dependió del Doc: es lo único que conserva **las dos correcciones de acta** y **los 12 bloques
>   que quedaron sin respuesta** (§16 del propio archivo).

---

**[P-14] El harness de verificación no corre de punta a punta**  
*Cierra / destino: arreglado en `c1ca4eb`; `fingerprint.js` ya corre contra la demo conectada (§5.124); sin baseline versionado (§5.137 e).*

> - [ ] ⚠️ **El harness de verificación no corre de punta a punta.** `fingerprint.js:82` recorre
>   `['inicio','pendientes','analitica','grupos','usuarios']` y **`usuarios` ya no es un `.navitem`**
>   (B2 lo sacó de la barra): el `page.click()` **tira** y la corrida aborta. Faltan además `inclusion`
>   y `ateneos`. Es barato de arreglar; lo caro es correrlo sin saberlo. **Decidido que el procedimiento
>   de dos worktrees queda documentado en vez de commitear un baseline** (§13, Fase B): si se prefiere
>   un baseline versionado, hay que sacar `*.json` del `.gitignore` y **fijar el escenario de la Parte
>   C**, y eso es una decisión, no una tarea.
>   - ⚠️ **Medido el 2026-09-09 (M12.8b-2b):** el *bloqueo de selector* de arriba **ya no aplica.**
>     `c1ca4eb` (2026-08-21) reemplazó el `.navitem`-para-todo por un mapa `VISTAS` con las **7 vistas**
>     (`usuarios` por `.userchip`; `inclusion` y `ateneos` incluidas) y dos guardas que fallan nombrando
>     la vista; el mensaje del commit reporta «42 pasos, exit 0». Los `*.json` **ya están versionados**
>     (`baseline.json` · `mut41.json` · `mut42.json`, §5.69) y Playwright está instalado local (gitignore).
>     Lo que **queda abierto** es correr el harness contra la demo post-F1, confirmar que `baseline.json`
>     es la foto post-F1 y **fijar el escenario de la Parte C** — la decisión que este pendiente ya pedía.

---

**[P-15] Cuatro puntos donde la presentación se desincronizó de una decisión**  
*Cierra / destino: PARTIDO: el 1.º (total del IDEA con los cortes derogados) ya no existe tras la 3-e (§5.135); los otros tres siguen en §6.*

- [ ] ⚠️ **Cuatro puntos donde la capa de presentación se desincronizó de una decisión ya tomada —**
  **próxima sesión de demo, antes que cualquier otra cosa (verificados contra un harness que ya funciona,
  no a ciegas):**
  1. **`ui-core.js:257-268` pinta el total del IDEA en vivo con los cortes DEROGADOS.** No es un problema
     de color, es una **vista en vivo que contradice una decisión de §5 ya ratificada**: usa `total>=65 →
     --bad`, `total>=33 → --warn`, si no `--ok` — el modelo de **3 tramos** que **§5.13 (D4) declaró
     derogado el 2026-08-14** en favor de `IDEA_BANDAS` (`catalogos.js:16-23`, 6 bandas: 0–15/16–30/
     31–55/56–75/76–90/91–96, con sus propios colores ya asignados por banda). Nadie tocó
     `ui-core.js:257-268` cuando D4 landeó. **Medido, no estimado — los dos modelos disienten en 13 de
     los 97 totales posibles (0–96):** en **31 y 32** el indicador en vivo muestra *"Espectro leve"*
     (`--ok`) cuando la banda ratificada dice **"Leve a moderado"** (`--warn`) — subestima; en **65 a
     75** (11 puntajes) muestra *"Espectro severo"* (`--bad`) cuando la banda ratificada dice
     **"Moderado"** (`--warn`, no llega a banda 5 hasta 76) — **sobreestima**. Un técnico cargando el
     formulario en vivo ve un nivel de severidad distinto del que el propio sistema declara oficial
     apenas guarda. **No se toca ahora** (§5 de esta sesión lo prohíbe): es el primer cambio de la
     próxima ronda de demo, para verificarlo contra el harness ya arreglado.
  2. **`renderUsuario()` (`grupos-usuario.js:317`) duplica crumbs/título** — mismo defecto que
     `8fbb629` corrigió en Grupos (cabecera estática de `index.html` + cabecera propia del `render()`),
     prometido para "la próxima" en el mensaje de ese commit y **nunca llegó a escribirse acá** — se
     escribe ahora para que no se pierda una segunda vez.
  3. **El detalle de Ateneos (`ateneos.js:416`) duplica título** — el `h1` del registro contra el
     `h1.pagetitle` estático de `index.html`, mismo defecto, mismo commit que lo prometió sin cumplirlo.
  4. ⚠️ **`grupos-usuario.js:14-16` (verificado línea a línea) afirma los cuatro colores derogados por
     §5.61 como si fueran los nombres reales:** *«§5.18 / D9: los grupos reales de IPPU son por color
     (Azul · Celeste · Naranja · Verde). … el prototipo v4 confirma los 4 colores.»* Es la **única
     ocurrencia sobreviviente de la fórmula derogada que IPPU PUEDE VER** — está en la demo, no en un
     comentario de backend (hallada por el barrido retroactivo de M12.8b-3a, registrada acá recién en
     M12.8b-3a-bis). **NO SE CORRIGE ACÁ:** esos nombres pueden ser *claves de búsqueda* (lookup keys) y
     no sólo etiquetas de pantalla — cambiarlos sin verificación visual en navegador arriesga romper la
     vista. **Dueño: Lucas.**
  - **Por qué van juntos:** los cuatro son la misma familia — la presentación quedó un paso atrás de una
    decisión ya tomada (§5.13 en el primero, la limpieza de `8fbb629` en el segundo y el tercero, §5.61
    en el cuarto) — y **son exactamente el primer cambio que corresponde verificar contra el harness
    recién arreglado**, no contra la pantalla a ojo. **No se tocan en la sesión que escribe esto**
    (alcance explícito: sólo mide y documenta). Borrador de la regla de dominio que motivó encontrar el
    punto 1: `docs/notas/borrador-color-y-significado-clinico.md` (sin firmar — ver banner del archivo).

---

**[P-16] F1-nav · lo que quedó abierto**  
*Cierra / destino: (b) y (c): sustituidas por `conectada.js`, el contraste y `capturas.js` (§5.122, §5.135); las deudas: roles §21.1 → §7 y «Roles y matriz»; Nº de HCE → §5.109; cambio de responsable → `PATCH /grupos/{id}` audita (§5.120); ateneos sin HCE-LOG/adjuntos/guards → ítems de §6; `.hint` ya existe en `estilos.css`.*

- [ ] **F1-nav · lo que quedó abierto → pasa a la próxima ronda de demo:**
  - **(b) verificación visual en navegador** — ninguna de las 4 rondas la hizo (Claude Code no controla browser): recorrer Analítica · Grupos · alta de NNA · expedientes · Inclusión · Ateneos.
  - **(c) re-baseline del fingerprint Playwright** (`demo/verificacion/`, §5.69). ⚠️ El *bloqueo de selector* que registra el pendiente «El harness de verificación no corre de punta a punta» de este mismo §6 —`fingerprint.js:82` asumía `.navitem` para `usuarios`— **ya está arreglado** por `c1ca4eb` (2026-08-21): el mapa `VISTAS` cubre las 7 vistas (`usuarios` por `.userchip`, `inclusion` y `ateneos` incluidas) con dos guardas que fallan **nombrando la vista**; el commit reporta «42 pasos, exit 0». Lo que **queda** de (c): correr el harness contra la demo post-F1 y decidir si el `baseline.json` versionado es la foto post-F1 + fijar el escenario de la Parte C (§5.69). Cruzar con ese pendiente de §6.
  - **Deudas que este bullet es el único registro de — se preservan:** cambio de responsable **sin HCE-LOG** (§5.18 y §7); **matriz de roles §21.1 pendiente con IPPU** (§7 F1-nav2); **formato oficial del Nº de HCE** por confirmar (§7 F1-nav2); de F1-nav4 — **ateneos sin HCE-LOG** (el de la demo es por NNA, un ateneo es transversal — misma limitación que §5.18) y **sin adjuntos** (HCE-DOC en la demo es por expediente; §5.25 ya modeló el XOR) y sin los guards de M11.3; **`.hint` no existe como clase global** (sólo `.field .hint`), Grupos e Inclusión la usan suelta y sin estilo, y F1-nav4 definió `.at-hint` propia. **Preguntas abiertas de las rondas:** «tutor» (2026-08-16, §7 — hoy absorbida en `preguntas-ippu.md` B5), permisos §21.1 y formato HC (2026-08-17, §7). F1-nav4 no abrió ninguna: sus dos divergencias ya están en `puntos-a-validar.md` §1.13 (prefijo único `AT-`) y §1.14 (correlativo de registración) y `consulta-a-ippu.md` **§3.12 y §3.13** las preguntan (eran §3.13/§3.14 antes de la revisión del equipo del 19/08 — §5.34).
  - ~~**F1-nav3 sin entrada de bitácora ni acá**~~ → **DECLARADA PERDIDA y cerrada por declaración** (2026-09-09, **§5.85**). Tres sesiones la reportaron abierta, la rama ya no existe, nadie la escribió: no se reconstruye por inferencia (§5.83). El registro que queda es el commit `648cb04` y este bullet.

---

**[P-17] Ronda de alineación de la demo v4.1 con el Prototipo v4 (y notas de Samuel)**  
*Cierra / destino: PARTIDO: verificación superada por la Fase 3 (§5.122–§5.135); PAI, INC y SEV → plan L1 (C4, C2) y «PAI» en §6; ateneos HECHO en la demo (F1-nav4); talleres sin gestión → «Administración de catálogos»; la vista «Intermedia» sigue en §6.*

- [ ] **Ronda de alineación de la demo v4.1 con el Prototipo v4 · COMMITEADA, pendientes de verificación** (Samuel + Lucas, 2026-08-16, §5.27). **6 alineaciones aplicadas** (cita Rivière · bandas IDEA 6 tramos · Δ con acción · 14 talleres · grupos por color · vocabulario ya cumplido) + 2 fixes de layout (heatmap, ancho de main). **Commiteada en `main` el 2026-08-16** por Lucas para desbloquear la sesión F1-nav que arrancó a continuación (`demo/F1-navegacion`). **Falta post-commit (migradas de pre-commit):** **(a)** verificar visualmente en navegador (doble clic en `demo/index.html`, recorrer Analítica · Grupos · alta de NNA · expedientes) — solapa parcialmente con la verificación de §6 de F1-nav; **(b)** re-baseline del **fingerprint Playwright** (`demo/verificacion/`) — 3 pasos rompen a propósito (bandas, talleres, grupos); Playwright no estaba instalado en el clone al momento del commit. **Deudas nuevas:** el catálogo de talleres ahora tiene los 14 pero **sin gestión** (retirar/agregar, orientación a grupos) — la demo carga nombres, no administra; anotado como absorción parcial de D5 (§5.14). Cuando la demo incorpore HCE-SEV en una ronda futura, `p.apoyo` de `datos.js` pasa a derivarse (deuda que ya venía de §5.24).
  - **Notas de Samuel al cerrar sesión (2026-08-16) para la próxima ronda:**
    - **FALTA agregar como módulos nuevos** (no entraron en las alineaciones, requieren ronda propia):
      - **PAI INAU** (= HCE-PAI, Propuesta de Atención Individual) — 15 secciones + tablas hijas
        (objetivos, evaluación PAI anterior, equipo, coordinaciones con 6 filas fijas). El más grande.
        Sección VII y XI son referencias (carga única desde HCE-00/ORG/LB/PA/PB/SEV), decidido en §5.22.
      - **HCE-INC** (Inclusión educativa, dentro del expediente) — ficha (`centro`, `tipoCentro`, `grado`,
        `modalidad`, referente educativo, estado) + **bitácora** con 5 catálogos (TIPOS, ESTADOS, TEMAS,
        MEDIOS, ROLES). `sensible` derivado (`tema === 'Clínica — sensible'`). No hay catálogo de
        centros educativos en el prototipo — es texto libre.
      - ~~**Ateneos clínicos y jornadas de capacitación** (vista transversal, no por NNA) — una sola
        entidad `DB.ateneos[]` con **4 tipos** (`AT_TIPOS`: Ateneo clínico · Ateneo de grupo · Ateneo
        institucional · Jornada de capacitación); correlativo `AT-2026-001`. Campos según tipo. Ver
        §5.25 y §5.26 del backend por convenciones de nomenclatura y XOR con HCE-DOC.~~
        → **HECHO en la demo** (F1-nav4, 2026-08-19, ver §13): `demo/js/ateneos.js` + vista
        `#view-ateneos` + panel en el expediente. Falta la parte de HCE-DOC (adjuntos por ateneo).
      - *(Pendiente de decidir si entra: **HCE-SEV** — módulo chico, va entre CI e IDEA. La demo hoy
        tiene `p.apoyo` como string suelto que se derivaría de este módulo.)*
    - **CORREGIR** (chico, dentro del alcance actual):
      - **Panel inicial** (vista Inicio, no expediente): tiene una **referencia a «Eval. intermedia»**
        que quedó colgada. La Eval. intermedia fue reemplazada por PA/PB en M5 (v3.7, §M5.2 del plan);
        el código sigue en `demo/js/` sin exponerse — pero el panel inicial la menciona. Buscar en
        `index.html` y `js/ui-core.js`.
      - **Pestaña Analítica Institucional**: también tiene la misma referencia a Eval. intermedia,
        corregir en el mismo pasaje.

---

**[P-18] M11 · Backend v2 — encabezado del ítem**  
*Cierra / destino: §5.106 (rebanadas verticales); el trabajo abierto pasó a los grupos de §6.*

- [ ] **M11 · Backend v2 — EN CURSO, en REBANADAS VERTICALES** (§5.106, 2026-10-05; reemplaza el orden
  M11.3 → M11.4 → M11.5 → M11.6). Sin dueño exclusivo (§5.6); **M11.3 lo toma Lucas** (§5.67). Decisiones
  de arquitectura cerradas (§5.2); esquema en `backend/docs/esquema-datos-v2.md` (§4 reglas, **§5 = este
  plan**). **Meta: prototipo presentable SIN datos reales el 2026-11-26** (§5.92), con la **demo HTML
  existente conectada a la API**; React + Tailwind es posterior. **M12 cerró el 2026-09-16: ya no hay
  pausa.** Cada rebanada = servicio + schema + router + tests de su dominio:

---

**[P-19] M11.3-a, a2, a3, b, c, d1, d1-fix, M11.5-a (+fix) y B-front**  
*Cierra / destino: HECHOS: §5.108–§5.121.*

  - [x] **M11.3-a** cimientos + persona/HCE — **HECHO 2026-10-06** (§5.108). `POST /hce` · `GET /hce`
    (búsqueda) · `GET /hce/{id}` · `PATCH /hce/{id}`; 66 tests nuevos. Las rebanadas siguientes **heredan** el
    contrato `{data, warnings}` / `{code, detail[]}` y la regla «el servicio hace `flush`, el router
    commitea». **Puntos abiertos que la rebanada dejó (no inventó reglas)** — cinco de los seis quedaron
    **cerrados en M11.3-a2** (abajo); sólo queda el de alta/baja:
    - ~~`tipo` de la auditoría de creación~~ → **RESUELTO (M11.3-a2, §5.112):** `tipo='carga'`.
    - ~~Regla de `hc_historico`~~ → **RESUELTO (M11.3-a2, §5.109):** entero ≥ 1000, único, asignado `max + 1`.
    - ~~«N.º de HCE» en la búsqueda~~ → **RESUELTO (M11.3-a2, §5.109):** sólo `hc_historico`; el `id` es interno.
    - ~~Falta `GET /grupos`~~ → **RESUELTO (M11.3-a2):** `GET /grupos?anio=` y `GET /profesionales?activo=`.
    - **Alta/baja del expediente** (`activo`, `fecha_baja`, `evento`) **no se edita por `PATCH /hce`**: es
      la línea de tiempo (`evento`), no HCE-00. **Diferido a M11.3-d** (baja/reingreso).
    - ~~Grupo en la búsqueda de cualquier año~~ → **RESUELTO (M11.3-a2, §5.111):** por año, por omisión el en curso.
  - [x] **M11.3-a2** identidad + listas de lectura — **HECHO 2026-10-06** (§5.109–§5.114). `hc_historico`
    entero ≥ 1000 único asignado por el servidor (lock por transacción) · CI canónica · búsqueda por grupo con
    `anio` · auditoría `carga` en el alta · `GET /grupos` y `GET /profesionales` · migración regenerada
    (head `dcc838486407`) · 20 tests nuevos (**521 passed, 0 skipped**).
  - [x] **M11.3-a3** convenciones transversales (JSONB `NULL`, vacío en fecha/entero/FK, 500 con sobre, GET sin commit) — **HECHO 2026-10-06** (§5.115). 18 tests nuevos (**539 passed, 0 skipped**); sin cambio de DDL.
  - [x] **M11.3-b** estado de flujo + `warnings` (la secuencia **sólo avisa**, §5.95; el CI **no traba**,
    §5.94) + firma/addendas (firma = bloqueo, 409) + validaciones del IDEA / totales / banda — **HECHO
    2026-10-06** (§5.116). `GET /hce/{id}/flujo` · CI mínimo (`/hce/{id}/consentimiento`) · IDEA
    (`/hce/{id}/idea`, `/idea/{id}`, `firmar`, `addendas`, `vigente`) · 61 tests nuevos (**600 passed, 0
    skipped**); sin cambio de DDL. ~~**Falta decidir:** los «recomendados» de §4.3 para el IDEA (§5.116).~~
    **Decidido en §5.117 (a)** (aviso al firmar); los de PA/PB/IC, en §5.118 (c).
  - [x] **M11.3-c** PA/PB/IC + **Δ sólo dentro del mismo instrumento** (§5.36) + alerta + datos del IC
    para el PDF (§5.102). Totales = las sumas definidas (§5.105). **Sin guard de consenso** (§5.98). —
    **HECHO 2026-10-07** (§5.117, rama `m11.3-c`): `/hce/{id}/protocolo`, `/protocolo/{id}` (+`firmar`,
    `addendas`), `/hce/{id}/idea/delta`, `/hce/{id}/informe-cierre`, `/informe-cierre/{id}` (+`firmar`,
    `addendas`, `recibi`, `documento`) · recomendados del IDEA como aviso · 34 tests nuevos (**634 passed,
    0 skipped**); sin cambio de DDL.
  - [x] **M11.3-d1** correcciones de la revisión b+c (Δ del PB firmado antes que su PA, recomendados de
    PA/PB/IC) + **HCE-VF** (`/hce/{id}/valoracion-funcional`, baremo sólo desde `pct`) + **login mínimo**
    (`/auth/login`, `admin` | `tecnico`, alcance por grupo con 404) + `GET /hce` paginado (`X-Total-Count`) +
    baja/reingreso por PATCH + CORS por `.env` — **HECHO 2026-10-07** (§5.118, rama `m11.3-d1`) · 84 tests
    nuevos (**718 passed, 0 skipped**); sin cambio de DDL.
  - [x] **M11.3-d1-fix** cierre de la revisión de d1: `SECRET_KEY` obligatoria · autor de la addenda = token
    · `usuario_id` de la firma con test · 409 de unicidad genérico para `tecnico` · login a tiempo constante ·
    matriz de visibilidad — **HECHO 2026-10-07** (§5.119, misma rama `m11.3-d1`) · **751 passed, 0 skipped**.
  - [x] **M11.5-a** seed espejo **vía API** = el criterio **§12-A ejecutable** (§5.65) + `PATCH /grupos/{id}`
    (asignación de técnicos, sólo `admin`) — **HECHO 2026-10-07** (§5.120): `app/seed_demo.py`,
    `tests/test_m11_5a_seed_demo.py` (IDEA 58 · PA 60 · PB 79 · Δ +19, sin alerta, devueltos por la API) ·
    39 tests nuevos (**790 passed, 0 skipped**); sin cambio de DDL.
    - [x] **Fix de revisión (M11.5-a-fix, 2026-10-07):** la CLI comprueba los grupos **antes** del
      bootstrap de usuarios (sin `seed_catalogos` → exit 1, 0 usuarios); pares de los 3 rechazos sin par;
      test real de asignación y alcance de los dos técnicos; README sin el `UPDATE grupo` y con el orden de
      carga · **794 passed, 0 skipped**; sin cambio de DDL ni de comportamiento de la API.
  - [x] **B-front** lecturas para la demo conectada: `fecha_nac` + `flujo` del año en la lista (en bloque, 3 consultas),
    técnicos `{id, nombre, rol}` en `GET /grupos` y en el grupo del detalle, fechas del seed de Martín,
    CORS verificado — **HECHO 2026-10-07** (§5.121) · 17 tests nuevos (811) · **B-front-fix**: `ci` en la lista (§5.121 e) + consistencia sobre el seed + conteo exacto de consultas + preflights POST/PATCH (**815 passed, 0 skipped**); sin cambio de DDL.

---

**[P-20] Fase 3 · demo conectada a la API (3-a a 3-e)**  
*Cierra / destino: HECHOS: §5.122, §5.124–§5.127, §5.135.*

  - [ ] **Fase 3 · demo conectada a la API** (§5.122; reparto planeado).
    - [x] **3-a** cliente de API, login, listado, HCE-00 de solo lectura y componente de modo demostración — **HECHO 2026-10-14** (§5.122) · `demo/verificacion/conectada.js` **46/46** · contraste sin fallas nuevas (los mismos 14 pares que fallan que en la línea base).
    - [x] **3-b** HCE-00 editable, expediente nuevo (wizard), pantalla de consentimiento informado (CI) y stepper de flujo · `verificar_contraste_ui.js` y `fingerprint.js` adaptados a :5500 con login — **HECHO 2026-10-14** (§5.124) · `demo/verificacion/conectada.js` **78/78** · contraste: los mismos 14 pares que fallan que la línea base, sin fallas nuevas.
    - [x] **3-c** IDEA (LB) y PA/PB — **HECHO 2026-10-14** (§5.125; no hizo falta partirla en 3-c1/3-c2): pestañas LB/PA/PB del expediente contra la API (crear, editar, firmar sin cuerpo, addendas, 422 por campo, avisos, Δ/alerta/interpretación de la API, rampa de un solo matiz, marca de NS, suma «provisorio») + el arrastre de la revisión de 3-b (selector de grupos del técnico, diálogo vaciado al salir, cédula por valor bruto, `.demo-tag`, demo de ejemplo sin candados) · `conectada.js` **113/113** (tras la corrección de la revisión, §5.125 (i)) · contraste: los mismos 14 pares que fallan, todo par nuevo ≥ 4,5:1.
    - [x] **3-d** IC con documento impreso y recibí, y VF — **HECHO 2026-10-15** (§5.126): IC y VF en las pestañas del expediente (se retiraron `view-ic`, los selectores de NNA y el IC/VF/informe/recibí de ejemplo) · IC: crear/editar/firmar con dos firmantes elegidos al firmar/addendas/recibí en diálogo accesible, 422 por campo, avisos sin bloquear, 409 → solo lectura · documento impreso desde `/documento` (firmas de `informe.firmas[]`, sin «Soporte», estado del flujo si no está firmado) · `@media print` A4 con encabezado del expediente en cada hoja · VF: 404 = estado vacío, categoría y alerta solo de la API, sin sugerencia · `conectada.js` **155/155** (§5.127 e; el «151/151» original no se reproducía) · contraste: los mismos pares que fallan que la línea base, todo par nuevo ≥ 4,5:1. **Revisión corregida el 2026-10-15 (§5.127):** el impreso ya no se recorta a la derecha en la impresión ampliada, la edad se calcula a la fecha del documento, un 409 no se rotula como aviso y el foco no cae en `<body>` tras el diálogo.
    - [x] **3-e** accesibilidad y pasada visual — **HECHO 2026-10-16** (§5.135): un solo anillo de foco, enlace de salto, diálogos con Tab atrapado y confirmación al cerrar con datos tipeados, estados compartidos, mensajes de validación en castellano, regla de color (ok/warn/bad nunca en una clasificación clínica), tokens, tabindex móvil del IDEA, notas de accesibilidad reescritas y contraste con línea base nueva **sin pares que fallen** · `conectada.js` **181/181**.

---

**[P-21] Higiene H1**  
*Cierra / destino: HECHO: §5.136.*

  - [x] **Higiene H1** — **HECHO 2026-10-16** (§5.136): se descartó lo que nada carga ni cita (prompts de sesión, relevamientos y planes cerrados, el borrador de color firmado en §5.135, el extractor del Prototipo v4, el conversor Docling, graphify y la conversión de la demo de junio) y se cerraron las observaciones de la revisión de 3-e (§5.99 con su texto original, botones primarios sin `--teal` en línea, código muerto de Analítica). **Sigue H2:** reescribir `CLAUDE.md`, `README.md`, la cabecera y §0/§4/§6/§7 de este archivo, `docs/estructura-repositorio.md` y `demo/verificacion/README.md` sobre este árbol; en §4 y §6 quedan nombres de archivos ya borrados, como historia.

---

**[P-22] resto de M11.3-d (SEV, INC, documento histórico, foto)**  
*Cierra / destino: REESCRITO: el plan L1 lo trae al desarrollo hasta el 06/11 (C1–C5) y el sobrante queda en §5.118 (e) (§5.137 f).*

  - [ ] **resto de M11.3-d (SEV, INC, documento histórico, foto)** — sólo si sobra tiempo después del ensayo del 2026-11-26, y
    después de un `GET /hce/{id}/auditoria` de sólo lectura para HCE-LOG (hoy no existe en la API) · **foto sin trabas** (§5.99) ·
    ~~VF/baremo~~ y ~~login con 2 roles~~ hechos en M11.3-d1 (§5.118) · routers restantes que necesiten las pantallas conectadas ·
    **M11.6 reducido** (Swagger reemplaza `ejemplos-endpoints.md`).

---

**[P-23] Reglas nuevas que la implementación tiene que respetar (2026-10-05)**  
*Cierra / destino: implementadas en M11.3 y vigentes en `CLAUDE.md`, «Reglas de L1 en vigor» (§5.94–§5.99).*

  - ⚠️ **Reglas nuevas que la implementación tiene que respetar (todas de 2026-10-05):** §5.94 el CI no
    traba · §5.95 la secuencia sólo avisa (`warnings[]` + `auditoria` `tipo='excepcion'`) · §5.96 cadena
    por año · §5.97 qué IDEA rige · §5.98 puntaje único (D7 y «NS contra número» salen de M11.3) · §5.99
    guardar una foto no requiere nada. (Los detalles que §5.94/§5.95 dejaban para M11.3-b —aviso por falta
    de CI, contenido de los avisos, campo `excepcion`— **se decidieron en §5.116**.)

---

**[P-24] Realinear la demo con las reglas nuevas**  
*Cierra / destino: HECHO 2026-10-14 (§5.125 g, i).*

  - [x] **Realinear la demo con las reglas nuevas** (hoy la demo las contradice; no es la base, pero se
    conecta a la API en Fase 3): `demo/js/flujo.js:54-64` (`moduloHabilitado`) **bloquea** por CI y por
    secuencia → debe avisar (§5.94/§5.95), y sus textos al usuario —`flujo.js:58` «único requisito no
    exceptuable», `:194` y `:259` «único bloqueo sin excepción posible (§4.2)»— afirman lo que IPPU
    desmintió; `demo/js/hce-doc-org-vf.js:117-124` y
    `demo/js/recordatorios.js:39-55` **bloquean el guardado de fotos** sin autorización → no deben
    (§5.99). Se suma a los cuatro puntos de presentación de más arriba. Sin dueño. ✅ **HECHO 2026-10-14**: los candados y la excepción salieron en la Fase 3-c (§5.125 (g)) y el bloqueo de fotos, individual y grupal, en su corrección (§5.125 (i)); `conectada.js` `3c-j9`/`3c-j9b` lo verifican.

---

**[P-25] M12 · Absorción del Prototipo v4 — CERRADO (con M12.8, I1, M12.8b-3a y M12.8b-3b)**  
*Cierra / destino: HECHO el 2026-09-16 (§5.10–§5.92); M12.8b-3b CANCELADA (§5.92).*

- [x] **M12 · Absorción del Prototipo v4 — CERRADO** (arrancó 2026-08-14, cerrado 2026-09-16 en la sesión
  **M12.8-cierre**). Se intercaló **entre M11.2 y M11.3**. Decisiones D1–D9 escritas en **§5.10–§5.18**.
  Plan: `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md`. **Única excepción registrada:**
  **M12.8b-3b, CANCELADA** (pase de vocabulario, ver abajo, §5.92) — no bloqueaba nada y no hay margen
  para trabajo que no desbloquee de cara al 26/11.
  - [x] **M12.8** cierre — **HECHO (2026-09-16).**
        ⚠️ **Cambio de alcance decidido por Lucas en esta misma sesión, escrito acá porque §6 es lo que se
        toca; la entrada de §5 quedó asentada en la sesión M12.9 (§5.92):** el Prototipo v4 y la demo v4.1
        **dejaron de ser fuente normativa** — son insumo a consultar, no especificación a la que
        converger. Por eso "vaciar `DESDE_LA_DEMO`
        pasando todo al prototipo" (como decían el plan y la cabecera de este archivo) **ya no es el
        criterio**: mover un dato de un artefacto de IPPU a otro, ambos con la misma procedencia, no gana
        fidelidad y arriesga cambiarlo sin querer. **Criterio con el que se cerró:** una sección migra
        **sólo si el prototipo la trae verbatim** (declarar la fuente correcta sin tocar el dato); si no,
        se queda donde estaba, **con el motivo anotado en el código, no como pendiente**.
        - **Movido:** `categoria_documento` — estaba inline en `mDocs()` del prototipo (array `cats`, no
          catálogo estructurado), verificado **verbatim** contra los 12 valores existentes antes de mover
          (diff del JSON generado: cambia sólo `_origen`, cero cambio de dato).
        - **Se queda, con motivo permanente anotado en `generar_catalogos_backend.py`:** `idea_nivel`
          (el `descriptor` es el texto oficial de Rivière, no la paráfrasis del prototipo — decisión de
          M12.1, no reabierta) y `servicio` (el prototipo sólo nombra los tres servicios en prosa, sin
          `clave`/`activo` extraíble — inventarlos sería §5.37 de nuevo).
        - **Se queda, con motivo distinto:** `idea_dimension`, `ippu_item`, `baremo_categoria` — el
          prototipo trae algo parecido (`IDEA_DIMS`, `IPPU_ITEMS`, `BUND_CATS`) pero no idéntico:
          `idea_dimension` exigiría **derivar** `codigo`/`escala` (generar dato) y los otros dos son
          "parecidos", no verbatim. Quedan hasta que alguien verifique campo por campo.
        - **`solo_al_crear` (M12.3–M12.7):** medido, **ya estaba completo** — cada catálogo tiene el
          tratamiento correcto desde que se construyó (`taller` protegido, `severidad_nivel`/
          `estado_inclusion` deliberadamente sin protección por ser texto de instrumento,
          `catalogo_centro_educativo`/`grupo` con `solo_insertar`; M12.6/M12.7 no agregaron catálogos —
          `PAI_AREAS`/`PAI_PREST`/`PAI_CIRCUITO`/`AT_TIPOS` son constantes). Nada que extender.
        - **Índices de FK / `Numeric`→`Decimal`:** medidos, ya en 0 y ya correctos (test
          `test_ninguna_fk_del_esquema_queda_sin_indice` en verde; único `Numeric` del esquema,
          `valoracion_funcional.pct`, ya `Decimal`).
        - **Guards M12.1–M12.7, rechazo probado junto al caso que pasa:** auditados los 8 archivos de
          modelos con CHECK; **un solo hueco real** — `puntuacion_idea.rango_t2`/`ns_t2_sin_valor` (M12.2)
          no tenían el caso de rechazo probado (sólo `_t1`, su gemelo). Agregados
          `test_idea_rechaza_puntuacion_de_t2_fuera_de_0_8` y
          `test_ns_t2_y_valor_numerico_a_la_vez_se_rechazan` en `tests/test_m12_consenso.py`. El resto de
          lo que parecía sin probar (`rango_dimension`, `escala_valida`, `rango_item`, `clave_valida`…) es
          de catálogos M11.2, fuera del alcance de esta ronda.
        - **Criterio §12-A (D-6/§5.65):** ya estaba escrito en prosa (`esquema-datos-v2.md:785-809`) y ya
          nombraba los cuatro módulos, las 6 bandas y los 14 talleres — verificado que sigue coincidiendo
          con la ronda tal como quedó construida. Nada que reescribir.
        - Migración: sin cambios de modelo en esta parte, así que nada que regenerar; `alembic current`
          sigue en head `559b1a79cb77`, un solo archivo en `versions/`,
          `test_la_migracion_coincide_con_los_modelos` en verde. El rebuild limpio explícito (drop schema →
          upgrade head → seed) no se corrió — bloqueado por el sandbox de la sesión — pero no hacía falta:
          no hubo deriva de modelos que recoger. ⚠️ **Superado por I1 (Parte B, mismo día):** I1 sí cambió
          modelos, así que la migración se regeneró de nuevo — head final `b99294aec85c` (ver bullet I1
          abajo). Este número queda como registro del estado al cerrar M12.8 específicamente.
        - `pytest -q` al cerrar M12.8: **434 passed, 0 skipped** (432 + los 2 tests nuevos del hueco de
          consenso). Ambos `--check` en 0.
    - [x] **I1 · `idea.anio`** → **HECHO (2026-09-16, Parte B de esta misma sesión).** Ver bullet «🛑
          DECIDIDO, SIN IMPLEMENTAR» de arriba, que se archiva por esto — detalle completo ahí.
    - [x] ~~**M12.8b-3a**~~ → **HECHO (2026-09-11).** Ver bitácora. Escribió §5.86–§5.88 (tres respuestas
          de Lucas a BLOQUE 6.4 de R1), registró R1-01 y R1-05 como punteros vivos, midió y registró el
          hallazgo del invariante de `tecnico_grupo` y el barrido retroactivo de §5.83, corrigió los
          docstrings de R1-04/R1-05 y el conteo de `backend/README.md:131` (R1-10), y archivó la cola
          resuelta de §6 a `docs/pendientes-resueltos.md`.
    - [x] **M12.8b-3b — CANCELADA (2026-09-16, sesión M12.9, §5.92).** Pase mecánico de **vocabulario**:
          «fase» → un término por sentido y «L1 = HCE» para la numeración de líneas (§5.75 / §2.3 · §5.76 /
          §2.4). Estaba **diferida** desde M12.8b-3a (2026-09-11); con el alcance del 26/11 fijado en
          §5.92, Lucas la cancela **como decisión nombrada, no como pendiente que siga esperando**: no
          desbloquea nada y no hay margen para trabajo que no desbloquee de cara al 26/11. **Sin dueño**,
          y ya no lo necesita. Detalle y conteo por archivo, si algún día se retoma: bullet «Pase mecánico
          de vocabulario» de esta misma sección y `puntos-a-validar.md` §2.3. **M12.8b-2 no lo tocó**
          (alcance explícito: sólo cifras/afirmaciones falsas, sin pase de vocabulario).

---

**[P-26] Barrido retroactivo de §5.83 — medido, no aplicado**  
*Cierra / destino: las dos ocurrencias de «Δ sólo B−A» se corrigieron en I1 (§5.91); la del comentario de `grupos-usuario.js` sigue en §6 («Tres puntos de presentación»).*

    - [ ] **Barrido retroactivo de §5.83 — MEDIDO en M12.8b-3a (2026-09-11), no aplicado.** §5.83 exige que
          un barrido deje evidencia de grep; nunca se corrió retroactivamente contra las tres formulaciones
          derogadas que ya tienen entrada de §5 propia. Comandos corridos (repo completo, excluyendo
          `node_modules` y `graphify-out`): `grep -rn "Δ sólo B" --include="*.md" --include="*.py"
          --include="*.js" .` · `grep -rn "Azul.*Celeste.*Naranja.*Verde\|cuatro grupos por color" ...` ·
          `grep -rn "tecnico_grupo.*M12.8a\|M12.8a.*tecnico_grupo" ...`. **Resultado:**
          - **§5.36 (Δ «B−A»):** sin sobrevivientes nuevos — las únicas dos ocurrencias que afirman la regla
            vieja como vigente son las que **R1-01 ya nombró**: `esquema-datos-v2.md:723` y
            `backend/README.md:131`. El resto son registros (`docs/bitacora.md`, `docs/notas/relevamiento-*`,
            `docs/prompts/*`) o citas explicativas dentro de entradas de §5/§6 que narran la derogación
            (correctas, no stale).
          - **§5.61 (cuatro colores):** ⚠️ **una ocurrencia LIVE nueva, no detectada antes:**
            `implementacion/L1-hce-idea/demo/js/grupos-usuario.js:14-16` — comentario en presente que
            afirma «los grupos reales de IPPU son por color (Azul · Celeste · Naranja · Verde) … el
            prototipo v4 confirma los 4 colores», contradiciendo §5.61 (son **cinco, con nombre**). El resto
            de las ocurrencias son registros, o citan los colores como **el dominio del Prototipo v4**
            (correcto: el prototipo sí usa colores) o como historia ya corregida
            (`app/models/identidad.py:103`, en pasado).
          - **§5.79 (`tecnico_grupo` «es M12.8a»):** sin sobrevivientes — las ocurrencias en `handoff.md`
            son la propia §5.72 (registro histórico de lo que decía antes de derogarse, correcto que
            siga así) y §5.79/§6 citándola para derogarla; nada vivo afirma hoy que `tecnico_grupo` es
            M12.8a.
          - **Costo de aplicar lo que sí sobrevivió:** un comentario de `demo/js/grupos-usuario.js` (3
            líneas) más los dos ya nombrados por R1-01. **No se toca acá** (fuera de alcance de esta
            sesión — Paso 3 sólo autoriza docstrings/comentarios de `app/`, no de `demo/js/`).

---

**[P-27] Puntos a validar con IPPU y el equipo (con sus conteos del 2026-09-09)**  
*Cierra / destino: REESCRITO como puntero corto en §6 (los conteos eran del 2026-09-09; `CLAUDE.md` no lleva cifras que cambian).*

- [ ] **Puntos a validar con IPPU y el equipo** → `docs/notas/puntos-a-validar.md` (2026-08-07, **interno**). **Medido el 2026-09-09 (M12.8b-2):** §1 (para IPPU) = **17 subsecciones `### 1.N`, 5 abiertas** (§1.5 · §1.6 · §1.15 · §1.16 · §1.17 — coincide con la tabla por fuente de `preguntas-ippu.md`); §2 (para el equipo) = **17 subsecciones `### 2.N`, 8 abiertas** (§2.5 · §2.8 · §2.9 · §2.11 · §2.12 · §2.13 · §2.14 · §2.17; el conteo de «abiertas» hace un juicio sobre §2.10 —plegada a §2.11— y §2.12/§2.15 —parcialmente resueltas—); §3 (supuestos) = **6 filas** (la reunión del 21/08 confirmó 4 y dejó 2 para revisar), sin subsecciones `### 3.N`. Lo abierto y crítico: **acceso a la HCE actual + su esquema de BD** (§1.5) y **la firma del acuerdo de confidencialidad** (§1.6); del lado del equipo, **no hay forma de abrir un año nuevo de grupos** (§2.8). La lista consolidada para el próximo contacto con IPPU es `docs/notas/preguntas-ippu.md` (§5.78). Salió de M11.2: varios se detectaron construyendo el esquema (ej. las referencias documentales de los 24 ítems no están verificadas). **§1.3 (catálogo de talleres) quedó CERRADO en M12.3**: el «8 vs 18» era falso y la lista real la trae el propio Prototipo v4. §1.1 ganó cita de fuente primaria (cuestionario 15/06, P10/P12) y se corrigió el plan M12 §4, que la daba por cerrada por error — ver bitácora 2026-08-17.

---

**[P-28] La tabla `grupo` no admite más de un año**  
*Cierra / destino: §5.18 (id propio + UNIQUE(nombre, anio), M12.1).*

- [ ] ~~**la tabla `grupo` no admite más de un año**~~ (contexto histórico): Su PK es sólo la letra (`A..E`) pero lleva columna `anio`, así que **el grupo A existe para un único año en toda la historia**: crear el de 2027 obliga a sobrescribir el de 2026 (se pierde quiénes fueron sus técnicos) y los expedientes viejos, que en `grupo_id` guardan sólo la letra, pasan a apuntar al grupo nuevo **sin aviso**. Contradice cómo `protocolo` e `informe_cierre` resuelven los ciclos anuales con `(hce_id, …, anio)`. Detectado al revisar M11.2; **se implementó tal cual lo especifica `esquema-datos-v2.md` §2.1, sin corregirlo por cuenta propia** (cambiarlo modifica ese documento). Opciones: (a) PK compuesta `(id, anio)` · (b) id propio con `UNIQUE(letra, anio)` · (c) dejarlo y **quitar la columna `anio`**, si los grupos no se reconfiguran año a año. Anotado en los 3 lugares donde se va a mirar: `esquema-datos-v2.md` §2.1, el docstring de `Grupo` y `docs/notas/puntos-a-validar.md` §2.6. **No bloquea M11.3.**

---

**[P-29] Pedir a IPPU acceso al repositorio de la HCE actual y a su esquema**  
*Cierra / destino: §5.104 (A2).*

- [x] **Pedir a IPPU (crítico):** acceso al repositorio de la HCE actual + **esquema de la base de datos** actual. → **RESPONDIDO el 2026-10-05 (A2, §5.104): no tienen acceso; sí un video.** Ver el pendiente de arriba.

---

**[P-30] Resolver la confidencialidad**  
*Cierra / destino: §5.104 (A1).*

- [x] **Resolver confidencialidad:** documento legal a firmar por quienes accedan a datos sensibles (lo planteó el Director). → **RESPONDIDO el 2026-10-05 (A1, §5.104): no existe acuerdo firmado y IPPU pide dejarlo.** Rige la regla de `CLAUDE.md`: sólo datos simulados o anonimizados.

---

**[P-31] Fase 3: conectar la demo HTML a la API**  
*Cierra / destino: HECHA: §5.122, §5.124–§5.127, §5.135.*

- [ ] **Fase 3:** conectar la demo HTML a la API (reemplazar el array `NNA` por `fetch`) → persistencia real. ⚠️ **ENTRA en el 26/11** (§5.106): el frontend del 26/11 es la demo HTML conectada.

---

**[P-32] Fase 4 (auth JWT + roles) · Fase 5 · Fase 6**  
*Cierra / destino: PARTIDO: login mínimo hecho (§5.101, §5.118); la Fase 4 completa y la Fase 6 siguen en §6 («Después: …»); la Fase 5 es pytest + Swagger (§5.106).*

- [ ] **Fase 4:** auth JWT por terapeuta + roles. · **Fase 5:** tests + docs. · **Fase 6:** Docker + PostgreSQL. ⚠️ **Del 26/11 entra sólo el login mínimo `admin` \| `tecnico`** (§5.101, rebanada M11.3-d); roles y matriz completos son posteriores.

---

**[P-33] Micro-tarea: importar a `nivel_idea` los descriptores oficiales**  
*Cierra / destino: HECHA: los 60 descriptores oficiales están sembrados desde M11.2 (`idea_nivel.descriptor` es el texto de Rivière; §6 M12.8, ahora P-25).*

- [ ] **Micro-tarea:** importar a `nivel_idea` los descriptores oficiales (texto largo por nivel) desde `docs/markdown/escala-...idea.md`.

---

**[P-34] Con IPPU: definir el protocolo real de «áreas» y «general»**  
*Cierra / destino: §5.1 (2): «Evaluación por áreas» y «general» se descartaron como módulos activos.*

- [ ] **Con IPPU:** definir el protocolo real de "áreas" y "general" (hoy modeladas como provisionales, indicadores en texto libre).

---

### 7. Preguntas abiertas — respondidas

**[Q-01] Numeración de líneas**  
*Cierra / destino: §5.76 (se cita siempre «L1 = HCE»).*

- **Numeración de líneas:** la presentación y la demo usan L1=HCE. El *Documento de trabajo* y el cuestionario Q47 usan numeraciones distintas. Confirmar la oficial (no bloquea; el foco L1=HCE es consistente y el Documento Técnico lo ratifica).

---

**[Q-02] Decisiones de arquitectura de M11 (SQLite vs Postgres, dónde vive la lógica, portabilidad)**  
*Cierra / destino: §5.2.*

- **Para M11 (backend v2, no antes de validar M0–M6 con IPPU):** decisiones de arquitectura del Anexo A del plan — (a) SQLite vs. Postgres-only en dev, (b) dónde vive la lógica de negocio (Pydantic/servidor vs. triggers PL/pgSQL), (c) alcance de portabilidad institucional — y la nomenclatura de "fases" (hoy conviven 5 usos distintos del término).

---

**[Q-03] Descriptores del IDEA: ¿qué pasa con las evaluaciones ya aplicadas con la Guía corrida?**  
*Cierra / destino: §5.104 (B8) y §5.43: entran igual, sin marca.*

- **Descriptores del IDEA — ¿qué pasa con las evaluaciones ya aplicadas?** El Prototipo v4 declara haber
  corregido "un corrimiento de niveles detectado en materiales institucionales previos (Dimensiones 3, 4, 6
  y 12 de la «Guía del aplicador», hoy desestimada)". **Ese documento no lo tenemos y nuestros descriptores
  no vienen de ahí** (ver la bitácora del 2026-08-14: los 60 nuestros salen de la fuente oficial de Rivière
  y están en los niveles correctos). Igual queda la pregunta clínica, que **no nos toca resolver**: si IPPU
  aplicó evaluaciones con la Guía corrida, ¿qué se hace con esos puntajes históricos? Va a
  `puntos-a-validar.md` y a la reunión.

---

**[Q-04] ¿Los dos técnicos puntúan de forma independiente?**  
*Cierra / destino: §5.47 y §5.98 (un solo número de consenso).*

- **¿Los dos técnicos ya puntúan de forma independiente, o es práctica a introducir?** De la respuesta
  depende si §5.16 (D7, kappa) sirve desde el día uno o queda latente. ✅ **CERRADA** (§5.47, ratificada
  por escrito el 2026-10-05, §5.98): registran **un solo número de consenso**; D7 queda latente y el kappa
  **no es calculable**.

---

**[Q-05] Contradicción del prototipo: secuencia dura vs. guiada**  
*Cierra / destino: §5.95 (la secuencia sólo avisa).*

- **Contradicción del prototipo: secuencia dura vs. guiada.** Manual §3 ("ningún instrumento puede aplicarse
  sin que el anterior esté completo y firmado") vs. Especificaciones §1 ("flujo guiado, **no impuesto**").
  Su código implementa la guiada; nosotros también. Confirmar. (Anexo B del plan M12 tiene las otras cinco.)
  ✅ **CONFIRMADA el 2026-10-05 (B4, §5.95): «solo avisa».**

---

**[Q-06] ¿«Tutor» es sinónimo de Técnico/a responsable?**  
*Cierra / destino: §5.100 y §5.101 (B5: las etiquetas de rol son texto libre y no hace falta un referente por NNA).*

### Abierta por F1-nav (2026-08-16)
- **¿«Tutor» es sinónimo de Técnico/a responsable del grupo, un rol distinto (referente por NNA), o el
  tutor legal de la familia?** Los tres tienen consecuencias distintas en el modelo. F1-nav implementó
  lo definido (asignar/cambiar responsables 1 y 2 desde el panel §21.1) y NO creó un rol nuevo. Detalle
  en `docs/notas/puntos-a-validar.md` §2.10.

---

**[Q-07] Nº de HCE (`HC-YYYY-NNN`)**  
*Cierra / destino: §5.109 (`hc_historico` entero ≥ 1000, asignado por el servidor).*

- **Nº de HCE (`HC-YYYY-NNN`).** El Prototipo v4 muestra HC formateado (`HC-2025-014`). La demo no
  lo tiene como campo; F1-nav2 lo deriva con `nroHC(n) = HC-${año(altaFecha)||actual}-${id.padStart(3,'0')}`.
  Como los ids seed son 101-108, salen `HC-YYYY-101`..`HC-YYYY-108`. Si IPPU tiene un formato oficial
  del nº de HCE (probablemente sí — la HCE actual tiene ≈14 años), sustituirlo. Anexado a la lista
  §1.7 de `puntos-a-validar.md` cuando corresponda.

---

**[Q-08] Resueltas (movidas desde aquí)**  
*Cierra / destino: ya resueltas cuando se escribió; se conserva el párrafo.*

**Resueltas (movidas desde aquí):** stack backend = **FastAPI + SQLAlchemy + Alembic** (SQLite→Postgres); base = **PostgreSQL** (no MariaDB); alcance del MVP = ronda **M0–M10** sobre la demo + Fases A–D del Documento Técnico §12. **Cortes del baremo:** el prototipo usa exactamente los que asumimos (0–4 / 5–24 / 25–49 / 50–95 / 96–100) con su implicancia — confirma **qué usa IPPU**, no qué dice el decreto, así que el anexo del Decreto 72/025 sigue pendiente. **Talleres:** los 14 reales están en el prototipo (§5.14 / D5); el "8 vs 18" era falso.

---

### 4. Qué se hizo en esta sesión (2026-06-30) — cuerpo anterior

**[S-01] §4 · cuerpo de «Qué se hizo en esta sesión (2026-06-30)»**  
*Cierra / destino: historia de la sesión inicial; vive en `docs/bitacora.md`; §4 queda con una línea.*

1. **Conversor mejorado** (`herramientas/conversor_docling.py`): ahora acepta archivos/carpetas por CLI (modo batch), `-o` carpeta de salida, `-r` recursivo, `--overwrite`; salida UTF-8 (arregla crash con emojis en consola Windows); mantiene modo interactivo si se ejecuta sin argumentos.
2. **Convertidos a Markdown** los 12 documentos del proyecto (incl. `IPPU.pdf` escaneado con OCR) → `docs/markdown/`. 0 errores.
3. **Leído y sintetizado** todo el material (propuesta, presentación, documento de trabajo, respuestas de IPPU, guía de relevamiento, demo, escala IDEA).
4. **Arquitectura de carpetas** creada e implementada (ver sección 5 de `README.md`); archivos reubicados; carpetas viejas (`Implemetacion`, `Registro asistencia reuniones`) eliminadas.
5. Creados `handoff.md`, `CLAUDE.md`, `README.md`, `.gitignore`.
6. **Git + GitHub:** `git init`, commit inicial en rama `main`, y push a repo **privado** `lucaspimentel-uy/IPPU-UTEC` (https://github.com/lucaspimentel-uy/IPPU-UTEC). `handoff.md`, `CLAUDE.md` y `herramientas/conversor_docling.py` están en `.gitignore` (NO se publican). Se instaló `gh` (GitHub CLI) v2.95.0.
