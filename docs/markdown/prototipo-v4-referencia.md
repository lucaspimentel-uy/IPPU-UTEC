# Referencia — Prototipo v4 de IPPU (extraído)

> **Qué es esto.** El Prototipo v4 que IPPU nos pasó como link
> (`https://lovely-salmiakki-4db73d.netlify.app/#/inicio`) es **un único HTML autocontenido de 406 KB**:
> ~15 KB de markup y CSS, y **387 KB de JavaScript** con toda la aplicación y todos sus catálogos como
> literales. Este documento resume lo que hay adentro.
>
> **Rutas:** original en `docs/prototipo-v4/HCE_IPPU_Prototipo_v4.html` · datos completos en
> `docs/prototipo-v4/prototipo-v4-catalogos.json` · regenerador en
> `herramientas/extraer_prototipo_v4.js`.
> ⚠️ La carpeta salió de `docs/fuentes/` el 2026-08-20 (`handoff.md` §5.30): no es respaldo, es **insumo
> de build** — `herramientas/generar_catalogos_backend.py` la lee en tiempo de ejecución.
>
> Este `.md` es la **versión legible y citable** del prototipo, en lugar de la conversión Docling que el
> v1 no pudo tener (ver la excepción en `docs/estructura-repositorio.md`): Docling rinde solo el shell
> vacío de una app JS, así que la extracción se hizo por código.
>
> **Por qué importa.** Elimina la dependencia de que IPPU nos mande archivos: las fichas IDEA, los 60
> descriptores, los 24 ítems, el catálogo de talleres y los campos de PAI/INC/ateneos **ya los tenemos**.
> Lo que sigue faltando está listado al final.
>
> **Reproducible:** `node herramientas/extraer_prototipo_v4.js` → si IPPU publica una v5, se vuelve a
> correr y se diffea contra el JSON anterior.

---

## 1. Correcciones a lo que creíamos

| Creíamos | Es |
|---|---|
| `Prototipo4.md` es una conversión **parcial** del Manual (faltan §4 y §8) | Es **completa**. El Manual del prototipo tiene exactamente **12 tarjetas** (`m1,m2,m3,m5,m6,m9,m10,m11,m14,m16,m19,m23`); los §4 y §8 **no existen** en el prototipo. La numeración saltada es del Manual original, que no nos entregaron. |
| Falta el `IDEA_Fichas_HCE_v1.json` | Está **embebido** en el prototipo como `IDEA_FICHAS` (12 entradas, 18 KB). No hay que pedirlo. |
| Hay una matriz de **14 roles** que nos falta | En el prototipo **no está**. Solo existen los 4 perfiles de la tabla de permisos. Sigue siendo pregunta para IPPU. |
| Los grupos son `A..E` (`esquema-datos-v2.md` §2.1) | Son **por color**: Grupo Azul · Celeste · Naranja · Verde (+ `(asignar)`). La PK `id (A..E)` no representa el dominio real. |
| Tenemos 8 talleres y el documento dice 18 | El prototipo trae **14 talleres reales, con nombres completamente distintos a los 8 nuestros**. Los 8 de nuestra demo no vienen de ninguna fuente de IPPU. |
| Los cortes del baremo hay que confirmarlos | El prototipo usa **exactamente** los que asumimos (0–4 / 5–24 / 25–49 / 50–95 / 96–100) y agrega una implicancia por categoría. Confirma que IPPU usa esos cortes; **no** confirma el Decreto 72/025 — eso sigue pendiente. |
| El prototipo implementa puntuación independiente por evaluador | **No.** `punt:Array(12).fill(null)` es un único array de consenso. Kappa está especificado y no implementado, tal como declara. Modelarlo es **decisión nuestra** (D7), no algo que el prototipo traiga. |

---

## 2. Los 14 módulos (orden real de la ficha, `FICHA_TABS`)

`resumen` · `anamnesis` HCE-00 · `ci` HCE-CI · **`sev` HCE-SEV** · `idea` HCE-LB · `protA` HCE-PA ·
`protB` HCE-PB · `cierre` HCE-IC · `docs` HCE-DOC · **`inc` HCE-INC** · `org` HCE-ORG ·
**`pai` HCE-PAI** · `vf` HCE-VF · `log` HCE-LOG.

Nota: **HCE-PAI es pestaña propia**, no solo un acceso desde HCE-ORG como decía el changelog.
HCE-SEV va **entre CI e IDEA**.

---

## 3. IDEA

- **`IDEA_MANUAL_V` = `'Manual Unificado IDEA v1.0 (07/2026)'`** — el literal que hay que persistir con
  cada evaluación firmada.
- **`IDEA_DIMS`** (12): `{d, e, n, ref}` — número de dimensión, índice de escala 0–3, nombre, escala.
- **`IDEA_DESC`** (12): `{que, n8, n6, n4, n2, n0}` — **los 60 descriptores autoritativos**. Contra estos
  hay que diffear los nuestros; el prototipo declara haber corregido un corrimiento en **D3, D4, D6 y D12**.
- **`IDEA_EJ`** (12): `{e8, e6, e4, e2}` — ejemplo clínico por nivel (no hay `e0`).
- **`IDEA_FICHAS`** (12): `{cod, tit, esc, def, obj, ind, nc, err, pg, martos, evid}` — la ficha completa
  por dimensión: definición, objetivo, indicadores, qué **no** confundir, errores frecuentes, preguntas
  guía, claves de J. Martos / Equipo Deletrea, nota de evidencia. `cod` = `IDEA-D01`…`IDEA-D12`.
- **`IDEA_REGLAS`** (9): `{r, d, f}` — regla, descripción, fuente. Panel IDEA-REGLAS.
- **`ideaTotales(p)`** → `{esc[4], total, completo}`; suma solo valores numéricos, `NS`/`null` marcan
  incompleto.
- **`ideaInterpreta(t)`** → **6 bandas** `{perfil, ns, txt}`:

| Total | Perfil | Soporte DSM-5-TR |
|---|---|---|
| ≤15 | Muy leve | Nivel 1 |
| ≤30 | Leve | Nivel 1 |
| ≤55 | Leve a moderado | Nivel 1–2 |
| ≤75 | Moderado | Nivel 2 |
| ≤90 | Moderado a severo (alta necesidad de apoyo) | Nivel 2–3 |
| >90 | Severo a muy severo (necesidad de apoyo muy sustancial) | Nivel 3 |

  El `txt` de cada banda es una **sugerencia deliberadamente neutra** que alude solo a escalas y
  dimensiones del IDEA — es la "neutralidad metodológica" de las especificaciones, implementada.

---

## 4. Escala IPPU-TEA

- **`ESCALAS`** (4): Relación Social · Comunicación y Lenguaje · Anticipación y Flexibilidad · Simbolización.
- **`IPPU_ITEMS`** (24): `{e, i, t, r}` — escala 0–3, número de ítem, texto, **referencia bibliográfica**
  (`'DSM-5-TR A1a · CIF d710 · Pelphrey et al. (2005)'`). Estas son las citas **no verificadas**
  (`puntos-a-validar.md` §1.4); el prototipo corrigió la de Rivière, no estas.
- **`LIKERT_LBL`**: 1 Regresión significativa · 2 Sin cambio observable · 3 Progreso leve / Emergente ·
  4 Progreso moderado / Consistente · 5 Progreso notable / Generalizado.
  *(Difiere levemente del texto del Manual §10, que usa "Emergente / Consistente / Generalizado" a secas.)*
- **`deltaInterpreta(d)`** → `{t, a, c}` en 6 tramos: ≥13 · ≥7 · ≥1 · =0 · ≥−6 · resto. Cada uno con su
  acción sugerida. La alerta institucional sale de acá, no de un número suelto.

---

## 5. HCE-SEV · Severidad DSM-5-TR

Campos (`p.dsm5`): **`cs`, `crr`, `justif`, `fecha`, `prof`**.

- **`SEV_ETQ`**: `Grado 1 · Necesita ayuda` / `Grado 2 · Necesita ayuda notable` /
  `Grado 3 · Necesita ayuda muy notable`.
- **`SEV_CS`** y **`SEV_CRR`**: descriptor largo por grado, uno para comunicación social y otro para
  comportamientos restringidos y repetitivos. Son **independientes**.
- **`SEV_APOYO`**: tipo de apoyos que orienta cada grado (tabla de referencia).
- Módulo **sin firma**, siempre editable.

---

## 6. HCE-INC · Inclusión

Ficha (`p.inc`): `centro, tipoCentro, grado, modalidad, diasHoras, at, atNombre, refNombre, refRol,
refTel, estado, fEstado, obs, bitacora[]`.

Bitácora (`p.inc.bitacora[]`): `fecha, interlocutor, rol, medio, tema, contenido, acuerdos, sensible`.

> **Hallazgo de modelado:** `sensible` **no es un campo que el usuario marque** — se deriva:
> `sensible: tema === 'Clínica — sensible'`. Modelarlo como columna calculada o como derivación en el
> servicio, no como booleano suelto que pueda desincronizarse del tema.

Catálogos: **`INC_TIPOS`** (10 tipos de centro) · **`INC_ESTADOS`** (7, con clase de color y descripción:
plena / parcial / en adaptación / en espera de cupo / desvinculado / sin escolarizar / **sin registrar**) ·
**`INC_TEMAS`** (5, uno de ellos «Clínica — sensible») · **`INC_MEDIOS`** (7) · **`INC_ROLES`** (8).

No hay catálogo de centros educativos en el prototipo: `centro` es texto libre. El catálogo lo pide la
especificación **para el sistema definitivo** — o sea, lo tenemos que crear nosotros.

---

## 7. HCE-PAI · las 15 secciones

| # | Sección |
|---|---|
| I | Datos de identificación del NNA |
| II | Marco administrativo INAU |
| III | Adulto responsable, familia y referentes |
| IV | Situación de salud, tratamientos y prestaciones |
| V | Educación formal e informal |
| VI | Evaluación clínica: línea de base y seguimiento |
| VII | Análisis estratégico de la situación actual |
| VIII | Participación del NNA y de su familia |
| IX | Evaluación del PAI anterior (solo actualizaciones) |
| X | Objetivos del período |
| XI | Dispositivo de atención y actividades |
| XII | Área social |
| XIII | Coordinaciones previstas para el período |
| XIV | Seguimiento y evaluación de la propuesta |
| XV | Equipo que elabora la propuesta |

**Campos de cabecera** (`p.pai`): `tipo, anio, fecha, ingresoIppu, padronInau, disposicion, judicial,
expediente, derivadoPor, motivo, responsable, tel, nucleo, referentes, cobertura, controles, tratamientos,
medicacion, prest{}, prestObs, centroEd, modalidad, grado, apoyosEd, otrasEd, sintLB, deltaInterp, fort,
oport, debil, amen, interesesNNA, vozNNA, expectFamilia, acuerdo, fechaDevol, frecuencia, etapa,
talleres{}, otrasAct, dinamica, ingresos, vivienda, redes, pronostico, circuito{}, fRev, fAnual, criterios`.

**Tablas hijas:**
- `objetivos[]` → `{area, obj, estr, ind, resp, plazo}` — `area` de **`PAI_AREAS`** (9), `plazo` ∈
  Trimestral/Semestral/Anual.
- `prev[]` (evaluación del PAI anterior) → `{obj, logro, com, dec}`.
- `equipo[]` → `{n, rol, part}`.
- `coords[]` → `{a, s, f, c}` con **6 filas fijas** precargadas (Familia · Equipo médico tratante ·
  Docente · Equipo de clínica · INAU/supervisión · Otros).
- `talleres{}` — marcados **por nombre** contra `CAT_TALLERES`.
- `prest{}` — marcados contra **`PAI_PREST`** (6 prestaciones).
- `circuito{}` — marcados contra **`PAI_CIRCUITO`** (4 ítems de seguimiento).

**Carga única confirmada:** las secciones I, II, VI, XI y XV se renderizan con `ro()` (input readonly)
alimentado desde HCE-00/ORG/LB/PA/PB/SEV. No se almacenan de nuevo — modelarlas como referencias.

---

## 8. Catálogo de talleres — los 14 reales

Taller de cuentos y estimulación del lenguaje · Taller de música y expresión · Taller de expresión
plástica · Taller pedagógico / iniciación a la lógica · Taller de cocina · Taller de huerta · Taller de
higiene y AVD · Taller de habilidades sociales · Taller de TICs · Educación Física · Actividades lúdicas
y de juego · Actividades sensoriales · Salidas didácticas / paseos · Participación de familia /
referentes en actividades.

> **Ninguno coincide exactamente con los 8 que cargamos en M11.2c.** Los nuestros salieron de la demo,
> que los inventó. Hay que reemplazarlos, no complementarlos.

Funciones de gestión del catálogo en el prototipo: `tallerAdd`, `tallerToggle` (activo/inactivo),
`tallerGrupos` (a qué grupos se orienta), `tallerGestion`. La participación se guarda por nombre.

---

## 9. Ateneos y jornadas

`DB.ateneos[]` → `{id, tipo, fecha, titulo, nna, grupo, participantes, situacion, hipotesis, recursos,
acuerdos[], seguimiento, capacitador, modalidad, contenidos, materiales, evaluacion, docs[]}`.

- `id` con formato **`AT-2026-001`** (correlativo por año).
- `acuerdos[]` → `{a, r, p}` = acuerdo, responsable (rol), plazo.
- **`AT_TIPOS`** (4): Ateneo clínico (NNA) · Ateneo de grupo · Ateneo institucional · Jornada de capacitación.
- Los campos de jornada (`capacitador, modalidad, contenidos, materiales, evaluacion`) conviven en la
  misma entidad que los de ateneo — el prototipo usa **una tabla con campos según tipo**, no cuatro tablas.

---

## 10. HCE-VF

`p.vf` → `{estado, fecha, organismo, pct, vigencia, rnpcd, dominios{}, capacidades, barreras, apoyos,
obs, sintesisFuncional}`.

- **`VF_DOMINIOS`** (6, con código CIF): comunicación `d310–d360` · autocuidado `d510–d570` · movilidad
  `d450–d470` · aprendizaje `d110–d179` · interacciones `d710–d799` · comunidad `d610–d699 · d910–d999`.
- **`VF_NIVELES`**: (vacío) · Autónomo · Apoyo ocasional · Apoyo frecuente · Apoyo permanente.
- **`BUND_CATS`** (5): `{min, max, cat, rango, imp}` — la novedad es **`imp`**, la implicancia de cada
  categoría (ej. Moderado → "Habilita acceso a prestaciones y amparo en cuota laboral").
- **`PRESTACIONES`** (8): `{n, o, d}` — nombre, organismo, descripción. Contenido informativo estático.
- `genVFBorrador`, `descAfect`, `sugiereNivel`, `descDelta`, `deArea` — la autogeneración descriptiva.
  `sugiereNivel` solo opera en los tres dominios con correlato clínico (comunicación ← E2,
  interacciones ← E1, aprendizaje ← E4).

---

## 11. Modelo maestro del prototipo (`nuevoPaciente`)

```
id, nombre, hc, grupo, anio, fnac, ci, sexo, diag, cie11, nivel,
psicologa, maestra,                       ← ⚠ roles hardcodeados
anamnesis{motivo,antPerinatales,antMedicos,desarrollo,familia,escolaridad,medicacion,otros}
ci_firmado, ci_fecha, ci_firmante
dsm5{cs,crr,justif,fecha,prof}            ← HCE-SEV
docs[], fotos[], fotoConsent
vf{...}, inau{sipi,convenio,referente,ingreso,obs,envios[]}
inc{...}, pai{...}, bps{prestacion,tramite,estado,vencimiento,obs,gestiones[]}
idea{estado,fecha,sesiones,punt[12],obs[12],sintesis,objetivos}
protA / protB{estado,fecha,semanas,punt[24],obs[24],sintPsi,sintMtra,otros}
cierre{...}
```

**`GRUPOS_EQUIPO`** modela los "otros técnicos" por grupo: `{n, d, a}` = nombre, disciplina, alcance
("Aportes en campos de texto libre de PA, PB e IC"). Es la implementación del perfil "otros técnicos" de
la matriz de permisos.

---

## 12. Contradicciones internas del prototipo (para preguntar, no para resolver solos)

1. **Secuencia dura vs. guiada.** Manual §3: "ningún instrumento puede aplicarse sin que el anterior esté
   completo y firmado". Especificaciones §1: "flujo guiado, **no impuesto**", con habilitación excepcional.
   El código implementa lo segundo (`excepcionFlexible`, `habilitarExcepcional`, y CI sin excepción).
2. **Roles genéricos vs. `psicologa`/`maestra`.** Las especificaciones insisten en "Técnico/a responsable
   1 y 2 con etiqueta configurable"; el modelo del prototipo tiene los dos roles **hardcodeados como
   nombres de campo**. La portabilidad está declarada, no implementada.
3. **14 roles vs. 4 perfiles.** Los "pendientes que asume UTEC" mencionan una matriz de 14 roles; ni la
   tabla de permisos ni el código tienen más de 4.
4. **Kappa** es requisito no funcional y "base del único requisito metodológico invariante", pero el
   modelo guarda un solo array de consenso. No es contradicción del texto — es que está sin implementar.
5. **Grupos por color vs. `A..E`.** El prototipo usa Azul/Celeste/Naranja/Verde; nuestro esquema usa
   letras. Ninguno de los dos resuelve el problema del grupo por año (`puntos-a-validar.md` §2.6).
6. **`LIKERT_LBL`** difiere levemente entre el Manual y el código.

---

## 13. Qué sigue faltando (esto sí hay que pedirlo)

- **Anexo A del Manual** (verificación de totales antes de firmar) — citado, no incluido.
- **Manual completo** con las secciones que el prototipo no muestra (§4, §7, §8, §12, §13, §15, §17, §18,
  §20, §21, §22, §24, §25).
- **La matriz de 14 roles.**
- **El anexo del Decreto 72/025** — el prototipo repite los mismos cortes que asumimos, lo que confirma
  qué usa IPPU, no que sean los del decreto.
- **Verificación de las 24 citas bibliográficas** de la Escala IPPU-TEA.
- **Catálogo institucional de centros educativos** — la especificación lo pide, el prototipo no lo trae.
- **Qué pasa con las evaluaciones IDEA ya aplicadas** con los descriptores anteriores al Manual Unificado,
  si efectivamente hubo corrimiento de niveles en D3/D4/D6/D12.

---

## 14. Fuera de alcance, pero existe

`CLINICA_HTML_B64` (63 KB) y `TALLER_HTML_B64` (68 KB) son los prototipos de Clínica y Taller
Terapéutico, embebidos en base64 y montados en `<iframe>` (`montarModuloEmbebido`, `b64ToUtf8`,
`abrirModuloEnPestana`). **No se extraen** por decisión D3. Quedan disponibles si el alcance cambia.
