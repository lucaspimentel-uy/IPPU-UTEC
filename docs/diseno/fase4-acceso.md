# Fase 4 — diseño del acceso (roles, matriz, registro de accesos, sesión y administración)

> **Qué es.** El diseño de la Fase 4 de la HCE terminada (`handoff.md` §5.162 b): con él se arman los prompts de **A1** (roles y
> matriz), **A2** (registro de accesos), **A3** (sesión y alcance) y **A4** (administración). Sesión **A0**, 2026-11-08, sobre `main`
> en `4aa89ee`; **sólo documentación**: no cambia código, migración, test ni demo. Las decisiones están numeradas **F4-1 a F4-19** y
> resumidas, con su costo de revertirlas, en `handoff.md` §5.164. La matriz por ruta, legible por máquina, es
> `docs/diseno/fase4-matriz-rutas.csv` (A1 la convierte en tests).
>
> **Reglas que aplica sin reabrir** (§5.162 d–j): cuatro roles —técnico · dirección/coordinación técnica-clínica · personal
> administrativo · dirección no técnica—; tratante y no tratante son la **relación** del técnico con cada expediente, derivada de los
> grupos; un rol por usuario, el de mayor alcance; el `admin` de hoy pasa a ser coordinación (supervisión con motivo más
> administración); dirección no técnica sólo ve agregados; el tratante queda registrado solo y sin motivo, el no tratante y la
> supervisión escriben el motivo antes de abrir (catálogo corto más texto libre); la firma es la credencial individual más la entrada
> del registro; la copia de la HC a la familia se registra acá (§5.103); los participantes del ateneo clínico ven el ateneo, no la HCE;
> B5 avisa sin revelar nombre ni grupo; B7: los valores completos se quedan y sólo los leen los roles que los necesitan.
>
> **Fuentes.** «Protocolo» = `docs/markdown/protocolo-acceso-confidencialidad-resguardo-hce.md`. Las filas de su matriz §5 se citan
> por orden: **fila 1** equipo tratante · **fila 2** otros técnicos no tratantes · **fila 3** dirección/coordinación técnica-clínica ·
> **fila 4** personal administrativo vinculado · **fila 5** dirección no técnica, administración, contabilidad, Consejo. Lo que no
> tiene fuente escrita dice «decisión de diseño» con su razón. Fuera de este diseño (§5.162 b): la reserva de datos del adolescente y
> el estado de revisión de los informes.

**Índice de decisiones** (cada una con su costo de revertirla en `handoff.md` §5.164): F4-1 claves de rol (a) · F4-2 relación
tratante (a) · F4-3 qué supervisa coordinación (a) · F4-4 el no tratante con motivo (b) · F4-5 coordinación (b) · F4-6 personal
administrativo (b) · F4-7 dirección no técnica y el panel (b) · F4-8 estados, búsqueda y listas (c) · F4-9 el registro y la ventana
(d) · F4-10 quién lee el registro y la auditoría (d) · F4-11 el catálogo de motivos (e) · F4-12 sesión (f) · F4-13 B6 (f) · F4-14 B5
(f) · F4-15 administración (g) · F4-16 cambios de datos (h) · F4-17 la demo mínima (i) · F4-18 orden y reparto de A1–A4 (j) · F4-19
catálogos de referencia para todo usuario con sesión (b).

## a. Roles y relación

**Los cuatro roles (F4-1).** `profesional.rol` toma una de cuatro claves; el `admin` de hoy desaparece (no queda como alias):

| Clave | Rótulo | Fila del Protocolo §5 | Qué es, en una línea |
|---|---|---|---|
| `tecnico` | Técnico/a | 1 y 2 (según la relación) | trata a los NNA de sus grupos; consulta los ajenos con motivo |
| `coordinacion` | Dirección/coordinación técnica-clínica | 3 | supervisa con motivo; administra usuarios, grupos y catálogos (§5.162 e) |
| `administrativo` | Personal administrativo | 4 | identificación y logística, nada clínico |
| `direccion_nt` | Dirección no técnica | 5, Nota general y §10 | sólo agregados |

`direccion_nt` y no `direccion`: el Protocolo §10 la llama «Dirección General NT», y «dirección» a secas se confunde con la
técnica-clínica. Las claves caben en `String(20)`.

**La relación tratante / no tratante (F4-2).** Se deriva en cada pedido, nunca se guarda:

> **tratante**(usuario, expediente) ⇔ el expediente tiene grupo (`hce_diurna.grupo_id`) **y** el usuario es `tecnico1_id` o
> `tecnico2_id` de **ese** grupo.

Es la condición de alcance de hoy (`services/auth.py`, `_es_tecnico_del_grupo`), con un cambio: vale para un usuario con rol
`tecnico` **o** `coordinacion`. Quien coordina y además trata a un grupo recibe el rol de mayor alcance (§5.162 f) y no pierde la
función tratante: el Protocolo §5 fila 1 define al tratante por la función («asignados al caso»), no por el cargo. Por eso **sólo
`tecnico` y `coordinacion` se pueden asignar** como técnico 1 o 2 de un grupo (`PATCH /grupos/{id}` con otro rol → 422 por campo).
«No tratante» es todo técnico (o coordinación) que no es tratante de ese expediente.

| Caso borde | Qué pasa | Por qué |
|---|---|---|
| Técnico en dos grupos | Tratante de los NNA de los dos (unión). | La condición es por grupo; no hay tope de grupos por técnico. |
| NNA sin grupo | Nadie es tratante. Los técnicos lo consultan con motivo; coordinación y administración lo gestionan (identificación, asignar grupo). | Hoy ningún técnico lo ve (`services/auth.py`, docstring); el alta de un técnico exige grupo propio (§5.118), así que un NNA sin grupo lo da de alta coordinación o administración y se le asigna grupo después. |
| Expediente inactivo (dado de baja) | La relación **no mira** `activo`: el tratante lo sigue abriendo (sale de la búsqueda salvo `incluir_inactivos`). | Hoy es así (§5.118: «se sigue leyendo por id») y el reingreso lo necesita. Decisión de diseño: no se agrega una regla que nadie pidió. |
| Grupo de otro año | La relación usa el **grupo actual del expediente**, sea del año que sea: los técnicos de «Escolares 2025» son tratantes de los NNA que siguen en esa fila. | Un filtro por año dejaría sin tratante a todo NNA el 1.º de enero: abrir el año (crear los grupos nuevos y mover los NNA) es administración (A4, §5.90) y todavía no existe. Pasar un NNA al grupo nuevo es `PATCH /hce/{id}/identificacion` (F4-5). |
| Pase de caso | Coordinación mueve el expediente de grupo (`grupo_id`); desde ese pedido los técnicos del grupo nuevo son tratantes y los del viejo, no. | Protocolo §5 fila 2 nombra el «pase de caso documentado»; queda documentado por la auditoría de campo de `grupo_id`. |
| Coordinación asignada a un grupo | Tratante de ese grupo (sin motivo); supervisión con motivo para el resto. | §5.162 f + fila 1. |
| Rol cambiado a mitad de sesión | El rol se lee de la base en cada pedido; las ventanas abiertas terminan (F4-12: `token_version`). | Protocolo §7: la revocación es inmediata. |

**Qué supervisa coordinación (F4-3).** El Protocolo §5 fila 3 dice «los casos bajo su responsabilidad técnica». **Se construye: toda
la institución** (todos los expedientes de Atención Diurna, el único servicio en alcance). Razones: no hay ningún dato que ate a una
coordinadora con un subconjunto de casos; el `admin` de hoy ya ve todo (§5.101) y §5.162 e lo convierte en coordinación; y para un
servicio con una coordinación, «los casos bajo su responsabilidad» son todos. **Si IPPU contesta §1.21 (o la nueva §1.27) con varias
coordinaciones, cada una con grupos a cargo:** se agrega `grupo.coordinacion_id` (FK nullable a `profesional`) y la supervisión con
motivo se limita a los expedientes de esos grupos; fuera de ellos, coordinación es «no tratante» con las reglas del técnico (motivo
de interconsulta o pase). Es una columna y una condición en una función (`relacion()`); la matriz no cambia de forma.

## b. La matriz

**Los sujetos** (columnas del CSV): `tratante` · `nt_sin_motivo` (técnico no tratante sin ventana vigente) · `nt_con_motivo` (con
ventana) · `coord_sin_motivo` · `coord_con_motivo` · `administrativo` · `direccion_nt`. En una ruta que no es de un expediente
(listas, catálogos, alta) las tres columnas del técnico dicen lo mismo; en las de un grupo (`/grupos/{id}/fotos`) «tratante» es
«técnico de ese grupo» y «no tratante», técnico de otro; en las de ateneos, «tratante» es tratante del expediente referido (para los
ateneos no clínicos, cualquier técnico).

**Valores de celda:** `permitir` · `permitir@<condición>` · `403:reason_required` (el expediente existe y se abre registrando el
motivo) · `403:forbidden` (el rol o la relación no lo permiten, ni con motivo) · `404` (igual que inexistente). Una celda con dos
casos los separa con `|` (`permitir@no_clinico|404@clinico`). Condiciones: `grupo_propio` (el alta sólo en un grupo suyo, 403 si no,
como hoy) · `identificacion` (sólo los campos identificatorios y logísticos, ver abajo) · `mis_grupos` · `institucion` · `agregado`
(institución, con la supresión de F4-7) · `alcance_ateneos` (no clínicos más los clínicos de expedientes que puede leer) ·
`clinico_si_tratante` (un clínico sólo de un expediente del que es tratante; si no, el 422 de un inexistente, §5.158 c) ·
`tecnico_del_grupo` · `asignables` (F4-13) · `no_clinico` / `clinico`.

**Orden de los chequeos** (decisión de diseño, en el mismo lugar que hoy: dependencias del router): (1) token (401) → (2) el rol
(`403:forbidden` **exista o no** el expediente: a administración y a dirección NT un 403 no les dice nada, y a dirección NT no se le
revela ni la existencia) → (3) existencia (404) → (4) relación y ventana (`403:reason_required`) → (5) escritura permitida
(`403:forbidden`) → (6) lo de siempre (422, 409 por firma…). Un 403 no lleva datos del expediente: sólo `code` y un mensaje fijo.

**Catálogos de referencia (F4-19).** Las seis listas fijas (niveles de severidad, opciones de ORG, INC y ateneos, categorías de
documento, recordatorios) no tienen datos personales: las lee todo usuario con sesión, como hoy. Recortarlas por rol no protege nada
y obliga a cada pantalla a saber qué catálogo puede pedir.

**Cómo se lee cada módulo** (las 89 rutas están en el CSV; acá las reglas que lo generan, por módulo):

| Módulo (rutas) | tratante | nt sin / con motivo | coord sin / con motivo | administrativo | dirección NT | Fuente |
|---|---|---|---|---|---|---|
| Auth (2) | permitir | permitir | permitir | permitir | permitir | Protocolo §7 |
| Alta `POST /hce` | grupo propio | grupo propio | identificación | identificación | 403 | §5.118; fila 4; F4-5, F4-6 |
| Búsqueda `GET /hce` | sus grupos | sus grupos | institución | institución | 403 | §5.101; filas 3–5; F4-8 |
| HCE-00 `GET /hce/{id}` | permitir | 403 motivo / permitir | 403 motivo / permitir | 403 (usa `/identificacion`) | 403 | filas 1–5; §6.1 |
| HCE-00 `PATCH /hce/{id}` | permitir | 403 / 403 | 403 / 403 (usa `/identificacion`) | 403 | 403 | fila 1; F4-4, F4-5 |
| Lecturas clínicas: flujo, CI, IDEA, PA/PB, IC (y su documento), VF, SEV, INC, DOC, autorización de imagen (19) | permitir | 403 motivo / permitir | 403 motivo / permitir | 403 | 403 | filas 1–5; §6.1; §5.162 g |
| Escrituras clínicas de esos módulos, firmas, addendas, recibí y la subida de una foto (27) | permitir | 403 / 403 | 403 / 403 | 403 | 403 | fila 1; §3; F4-4, F4-5 |
| LOG `GET /hce/{id}/auditoria` | permitir | 403 / 403 | 403 motivo / permitir | 403 | 403 | §5.162 j; §5.142; F4-10 |
| Fotos del expediente, lecturas (3) | permitir | 403 / 403 | 403 motivo / permitir | 403 | 403 | Protocolo §4, §6.1; F4-4 |
| ORG, lecturas (2) | permitir | 403 motivo / permitir | 403 motivo / permitir | **permitir** | 403 | fila 4, §3; F4-6 |
| ORG, escrituras (5) | permitir | 403 / 403 | 403 / 403 | **permitir** | 403 | fila 4; F4-6 |
| `GET /inclusion` (lista) | sus grupos | sus grupos | institución | 403 | 403 | §5.154; fila 3; F4-8 |
| Fotos del grupo (4) | técnico del grupo | 404 / 404 | permitir | 403 | 403 | §5.155 e; F4-8 |
| Ateneos: lectura de uno y sus documentos (4) | permitir | no clínico; clínico 404 / permitir | permitir | 403 | 403 | §5.158 a; §5.70; §6.1 |
| Ateneos: escrituras (4) y alta | permitir | no clínico; clínico 404 / no clínico; clínico 403 | permitir | 403 | 403 | §5.158 a; F4-4 |
| `GET /ateneos` (lista) | alcance | alcance | institución | 403 | 403 | §5.158 a |
| `GET /ateneos/indicador` | permitir | permitir | permitir | 403 | agregado | §5.158 g; §6.6; F4-7 |
| `GET /panel` | sus grupos | sus grupos | institución | 403 | agregado | §5.159 a; §6.6, §10; F4-7 |
| `GET /grupos` | sus grupos | sus grupos | permitir | permitir | 403 | B6; F4-13 |
| `PATCH /grupos/{id}` | 403 | 403 | permitir | 403 | 403 | §5.120; §5.162 e |
| `GET /profesionales` | asignables | asignables | permitir | 403 | 403 | B6; F4-13 |
| Catálogos: `/severidad-niveles`, `/organismos/opciones`, `/inclusion/opciones`, `/documentos/categorias`, `/ateneos/opciones`, `/recordatorios` (6) | permitir | permitir | permitir | permitir | permitir | F4-19 |

**Las cuatro decisiones explícitas que pide la matriz:**

- **El no tratante con motivo lee todo el expediente salvo la auditoría y las fotos, y no escribe nunca (F4-4).** El Protocolo §6.1
  limita el acceso «a la información pertinente a esa consulta puntual», pero qué es pertinente para una interconsulta lo juzga el
  profesional, no el sistema: ningún módulo se puede declarar de antemano impertinente para cualquier interconsulta. El sistema hace lo
  que sí puede: registra quién, cuándo, qué expediente y por qué (§8), y deja afuera lo que nunca es pertinente para una consulta
  clínica: el **rastro de cambios** (quién editó qué; §5.162 j lo reserva a quien lo necesita) y las **fotos** (imágenes del NNA;
  minimización, Protocolo §4). No escribe porque la HC registra lo que hace el equipo tratante (§3) y la fila 1 le da el acceso
  completo al tratante «en el marco estricto de su intervención»; un pase de caso lo convierte en tratante moviendo el expediente de
  grupo. *Rechazado:* una máscara de módulos por motivo (el catálogo diría qué módulos abre cada motivo): exige que IPPU defina la
  pertinencia de cada motivo (nueva §1.25) y se puede agregar sin cambiar la forma de la matriz (una tabla motivo × módulo).
- **Coordinación con motivo lee todo (auditoría y fotos incluidas) y no escribe los módulos clínicos (F4-5).** La fila 3 es
  «supervisión clínica»: leer. Lo que coordinación sí escribe no es clínico: la identificación y la logística del expediente (datos de
  la persona, grupo, baja y reingreso) por `GET|PATCH /hce/{id}/identificacion`, **sin motivo** (no es supervisión clínica, pero
  queda registrado como acceso de gestión, F4-9), el alta con datos identificatorios, los ateneos (es quien los organiza; §5.70 la pone
  en el guard del clínico) y la administración (A4). Si coordinación también trata un grupo, es tratante de ese grupo (F4-2).
  *Rechazado:* coordinación con motivo lee y escribe todo, como el `admin` de hoy: es lo más barato (conserva los chequeos de
  `conectada.js` que hoy cargan datos clínicos como admin), pero pone en la HC intervenciones de alguien que no trata, contra §3.
- **«Datos identificatorios y logísticos» del personal administrativo (F4-6).** La fila 4 da «turnos, asistencia, facturación», y la
  HCE no tiene esos módulos. De lo que existe cuentan: (1) la **identificación** de HCE-00: los datos de la persona (nombre, apellido,
  C.I., fecha de nacimiento, sexo, localidad, referente, teléfono), el N.º de HC, el grupo y el estado (activo, fecha de baja), por la
  búsqueda institucional y por `GET|PATCH /hce/{id}/identificacion`; (2) el **estado del flujo** que trae cada fila de la búsqueda
  (qué módulo del año está pendiente): es la «gestión de agenda» de la definición del Protocolo §3; (3) **ORG** (vínculos con INAU y
  BPS, AYEX y el registro de envíos y gestiones), que es lo más cercano a «facturación»: son los convenios por los que la institución
  cobra y las prestaciones que tramita; (4) `GET /grupos`, para asignar el grupo en el alta. **No** cuentan los campos clínicos de
  HCE-00 (diagnóstico, CIE-11, fecha del diagnóstico, derivación, medicación, alerta, anamnesis), el CI, ni ningún otro módulo. El
  caso de la fila 4 «contenido clínico sólo … puntual (p. ej. envío de un informe ya autorizado)» **no se construye en la Fase 4**: es
  el envío de un informe, y llega con el guard de divulgación (bloque M); administrativo no tiene ventana con motivo (nueva §1.26).
- **Qué ve dirección no técnica del `/panel` (F4-7).** La institución, con todas sus secciones de cuentas (`n_activos`,
  `cobertura_lb`, `bandas`, `alertas`, `ciclos_completos`, `pendientes_flujo`) y la sección `protocolo` **con las medias suprimidas
  cuando `n_ciclo_ab` < 5** (`medias: null`, `suprimido: true`; la constante `UMBRAL_CELDA_CHICA = 5` en `core/constantes.py`). El
  Protocolo §6.6 exige que el informe a dirección haga «imposible identificar a un usuario en particular»: una media de un solo NNA
  es su puntaje (la demo de hoy: «Valores del único NNA», §5.159). Las cuentas no llevan el valor clínico de nadie y, sin desagregar
  por grupo, no identifican. Además ve `GET /ateneos/indicador` (cuántos ateneos, por grupo) y los catálogos; nada más. *Rechazado:*
  suprimir toda cuenta < 5 («< 5» en la celda): con ~120 NNA casi toda banda quedaría suprimida y el panel perdería su uso; se
  revisa con la respuesta de la nueva §1.29.

**Rutas nuevas** que estas reglas necesitan (no están en el CSV de hoy; cada sesión agrega sus filas al CSV al construirlas):

| Sesión | Ruta | Quién | Para qué |
|---|---|---|---|
| A1 | `GET /hce/{id}/identificacion` · `PATCH /hce/{id}/identificacion` | tratante, coordinación (sin motivo), administrativo | los campos identificatorios y logísticos (F4-6); la respuesta no trae ningún campo clínico |
| A1 | `POST /hce/consulta` `{ci}` | técnico, coordinación, administrativo | la coincidencia **exacta** de una C.I. (canónica, §5.110): `{id, hc_historico, nombre, apellido, grupo, relacion}` o 404; por cuerpo y no por URL (B8) |
| A1 | `POST /hce/{id}/accesos` `{motivo_codigo, motivo_texto?}` | no tratante y coordinación (y el tratante, para la copia a la familia) | abre la ventana (F4-9) |
| A1 | `GET /accesos/motivos` | todo usuario con sesión | el catálogo de motivos, con qué rol puede usar cada uno (F4-11) |
| A2 | `GET /hce/{id}/accesos` | coordinación | el registro de accesos de un expediente |
| A2 | `GET /accesos?desde=&hasta=&usuario_id=&hce_id=&relacion=&motivo=&limit=&offset=` | coordinación | el registro institucional, paginado (`X-Total-Count`): la auditoría semestral |
| A3 | `POST /auth/logout` · `POST /auth/password` | todo usuario con sesión | cerrar la sesión en el servidor; cambiar la propia contraseña |
| A4 | `/usuarios`, `POST /grupos`, `/talleres`, `/centros-educativos`, `GET /auditoria` | coordinación | administración (sección g) |

## c. Semántica de los estados

**Hoy** un expediente fuera del alcance es un 404 idéntico al de uno inexistente (`services/auth.py`). Con motivo, el no tratante
tiene que **llegar** al expediente para pedir el acceso, y la respuesta tiene que decirle que puede pedirlo.

**Cómo lo encuentra (F4-8).** El técnico **no** busca en toda la institución: `GET /hce` le sigue devolviendo sólo sus grupos (por
nombre, C.I. parcial, N.º de HC o grupo). Para una interconsulta o un pase, usa `POST /hce/consulta {ci}` con la **C.I. completa**
del NNA (la que trae la interconsulta): si existe, la respuesta es una fila mínima —id, N.º de HC, nombre, apellido, grupo y su
relación (`tratante` | `no_tratante`)—, sin fecha de nacimiento, flujo ni nada clínico; si no, 404. Por **cuerpo** y no por URL,
para no sumar C.I. al log de accesos del servidor (B8, §5.163). Razones: pertenecer a IPPU ya revela un diagnóstico (TEA), así que la
nómina institucional es dato sensible y no se ofrece a cada técnico; quien tiene la C.I. completa ya la recibió con la interconsulta.
*Rechazado:* la búsqueda por subcadena en toda la institución (revela la nómina) y la búsqueda exacta por N.º de HC (los números son
correlativos desde 1001: recorrerlos daría la nómina entera). **Riesgo aceptado:** una C.I. válida se puede adivinar con muchos
pedidos; A3 puede sumar un tope por usuario a `POST /hce/consulta` con la misma tabla de intentos si la auditoría de cierre lo pide.

**Qué responde `GET /hce/{id}` sin motivo válido.** **403 `reason_required`** si el expediente existe y el usuario puede abrirlo con
motivo (técnico no tratante, coordinación); **404** si no existe. El cuerpo del 403 es fijo: `{"code": "reason_required", "detail":
[{"campo": null, "mensaje": "Este expediente no es de tus grupos: para abrirlo, registrá el motivo."}]}` (para coordinación, «Para
supervisar este expediente, registrá el motivo.»), sin nombre ni N.º de HC. Lo mismo en **todas** las rutas de lectura de ese
expediente, también las que van por el id de un módulo (`/idea/{id}`, `/protocolo/{id}`, `/informe-cierre/{id}`): la dependencia ya
resuelve el `hce_id` (`routers/dependencias.py`, `_visible_por`). El código va en inglés, como los demás (`not_found`,
`signed_module`, `too_large`).

**El costo de revelar que existe, y por qué se acepta.** El 403 dice que el id N existe. Los ids son internos y correlativos: que
exista el N dice cuántos expedientes hubo, no de quién son. Lo sensible es el vínculo persona ↔ expediente, y ése sólo lo da la
consulta por C.I. completa, que ya lo supone. A cambio, la pantalla puede ofrecer el diálogo del motivo en lugar de un «no
encontrado» que no deja seguir. **Lo que sigue siendo 404 como inexistente:** el ateneo clínico de un expediente que el técnico no
puede leer (el ateneo no es la HCE y su título es contenido, §5.158 a), el grupo ajeno en las fotos grupales (la ventana es por
expediente, no por grupo) y todo id fuera de `int4` (§5.163 a). *Rechazado:* el mismo 404 también para el no tratante, con la
consulta por C.I. como única puerta: la consulta ya reveló la existencia, así que el 404 no protege nada y obliga a la pantalla a
adivinar si ofrece el motivo.

## d. El registro de accesos

**Modelo (F4-9): una tabla nueva, `acceso_hce`, y no `auditoria` con `tipo='acceso'`.** Razones medidas en el código: (1)
`auditoria.hce_id` es `ON DELETE CASCADE` (`models/transversales.py`): el registro de accesos tiene que sobrevivir al expediente, así
que su FK es `RESTRICT`; (2) la ventana se busca en cada pedido por `(usuario, expediente, vencimiento)`: en una tabla propia es un
índice chico, en `auditoria` un índice parcial sobre la tabla más grande; (3) `GET /hce/{id}/auditoria` (C1) y el chequeo
`c1-solo-lectura` («abrir la pestaña no agrega filas al LOG») dejarían de valer o tendrían que filtrar; (4) los lectores son otros
(F4-10). *Rechazado:* cinco columnas nullable nuevas en `auditoria`. El `tipo='acceso'` del CHECK de `auditoria` queda sin uso y no
se toca (sacarlo es DDL sin beneficio).

| Columna | Tipo | Qué es |
|---|---|---|
| `id` | PK | — |
| `hce_id` | FK `hce_diurna` **RESTRICT**, índice | la HC consultada (Protocolo §8, Anexo III) |
| `usuario_id` | FK `profesional` RESTRICT, índice | la persona que accede; con la credencial individual es la **firma** (§5.162 g) |
| `rol` | `String(20)` | el rol al momento del acceso (el rol cambia) |
| `relacion` | `String(20)`, CHECK | `tratante` · `no_tratante` · `supervision` · `gestion` (coordinación o administrativo en la identificación u ORG) · `titular` (copia a la familia) |
| `motivo_codigo` | `String(30)` nullable, CHECK generado de `MOTIVOS_ACCESO` | el motivo (§8); NULL sólo en `tratante` y `gestion` (CHECK) |
| `motivo_texto` | `Text` nullable | el texto libre (F4-11) |
| `ateneo_id` | FK `ateneo` nullable | si el acceso fue por un ateneo clínico |
| `inicio` | `timestamptz` default `now()` | la fecha (§8) |
| `vence` | `timestamptz`, CHECK `vence >= inicio` | fin de la ventana; igual a `inicio` en `titular` |
| `token_version` | `integer` | la versión del token con que se abrió (F4-12) |

Índice compuesto `(usuario_id, hce_id, vence)`. Sólo inserción, como `auditoria` (sin UPDATE ni DELETE; `REVOKE` recomendado en
despliegue).

**Qué es un acceso: una fila por ventana, no por GET.** Una **ventana** es el permiso de un usuario sobre un expediente durante
**120 minutos** (`VENTANA_ACCESO_MINUTOS`), del pedido que la abre en adelante. Es **vigente** si `ahora < vence` y su
`token_version` es la del usuario: **termina** al vencer, al cerrar sesión, al cambiar la contraseña o el rol y al desactivar al
usuario (todos suben `token_version`, F4-12), sin escribir nada. Es por usuario y expediente: dos expedientes son dos ventanas.
Pedir otro motivo con una ventana vigente abre otra (cada motivo es su acceso). 120 minutos: una interconsulta cabe y la ventana no
queda abierta todo el turno de 8 h del token (decisión de diseño, constante).

**Cómo se abre.** `POST /hce/{id}/accesos {motivo_codigo, motivo_texto?}` → 201 `{data: {id, hce_id, relacion, motivo_codigo,
motivo_label, motivo_texto, inicio, vence}, warnings: []}`. 404 si no existe; 403 `forbidden` para administrativo y dirección NT; 422
por campo si el motivo no está en el catálogo, no es de ese rol o falta el texto obligatorio. El tratante puede usarlo (el único
motivo útil es la copia a la familia); para él no abre nada que no tenga.

**El tratante, automáticamente (Protocolo §7: «registro automático de accesos»).** En el **primer pedido** de un usuario tratante
(o de coordinación o administrativo en lo de gestión) a una ruta de un expediente sin ventana vigente, el servidor inserta una fila
(`relacion` `tratante` o `gestion`, sin motivo, 120 minutos). Los pedidos siguientes de esa ventana no escriben. Detalles que A2
tiene que resolver así: (1) **en su propia transacción**: las lecturas usan `sesion_lectura`, que nunca commitea (§5.115 d), y un
acceso que ocurrió se registra aunque el GET falle después; (2) **con candado**: la demo pide `GET /hce/{id}` y `GET
/hce/{id}/flujo` en paralelo, así que el chequeo-e-inserción va bajo `pg_advisory_xact_lock(<constante>, hash(usuario, expediente))`,
como el correlativo de ateneos (§5.158 b): dos pedidos simultáneos dejan una fila; (3) las **listas** (`GET /hce`, `GET /inclusion`,
`GET /ateneos`, `/panel`) no registran accesos: no abren ninguna HC (F4-8).

**El ateneo clínico.** Abrir un ateneo clínico sin ser tratante del expediente referido (coordinación; los participantes cuando
exista el bloque M) registra solo una fila `motivo_codigo='ateneo'`, `ateneo_id`, sin diálogo: el ateneo **es** el canal documentado
(Protocolo §6.1, §5.70 condición 3). No abre ventana sobre la HCE (§5.162 h): la fila se deduplica por usuario y ateneo dentro de 120
minutos.

**La copia de la HC a la familia (§5.103).** Es un acceso **del titular**: `POST /hce/{id}/accesos {motivo_codigo: "copia_familia",
motivo_texto: "<a quién se entregó y qué partes>"}` por el tratante o coordinación, que deja una fila `relacion='titular'`, `vence =
inicio` (no abre ventana) y con quien la entregó como `usuario_id`. No va a `divulgacion` (§5.103).

**Quién lee el registro (F4-10, decisión 9).** El registro de accesos: **sólo coordinación** (`GET /hce/{id}/accesos`, `GET
/accesos`), sin motivo (las filas no tienen contenido clínico: quién, cuándo, por qué). La auditoría de cambios (`GET
/hce/{id}/auditoria`, que lleva los valores completos, §5.162 j): el **tratante** (es su registro de trabajo; C1 se construyó para
él) y **coordinación con motivo**. Nadie más: ni el no tratante (minimización), ni administrativo, ni dirección NT (fila 5: sin
contenido individual).

**La auditoría interna semestral (Protocolo §8).** **Ahora (A2):** `GET /accesos` con filtros por período, usuario, expediente,
relación y motivo, paginado, para que coordinación revise cada semestre. **Después** (no es parte de la HCE terminada): exportar el
período (CSV) y marcar una revisión hecha; quién revisa y cada cuánto lo pregunta D5 (`puntos-a-validar.md` §1.23).

## e. El catálogo de motivos

**Constante, no tabla (F4-11)**, con el criterio de §5.56: tabla si la institución lo mueve sin desplegar; constante si cambiarlo es
un cambio de código con revisión. Un motivo de acceso es parte del régimen legal del Protocolo y lo valida IPPU una vez (D4): cambiarlo
tiene que pasar por revisión. `MOTIVOS_ACCESO` en `core/constantes.py`, con el CHECK de `acceso_hce.motivo_codigo` generado de ella
(como `ATENEO_TIPOS`). Borrador del equipo, a ajustar con D4:

| Código | Rótulo | Quién lo usa | Texto | Fuente |
|---|---|---|---|---|
| `interconsulta` | Interconsulta | técnico no tratante, coordinación | opcional | Protocolo §5 fila 2, §6.1 |
| `pase_de_caso` | Pase de caso | técnico no tratante, coordinación | opcional | Protocolo §5 fila 2 |
| `ateneo` | Ateneo clínico | técnico no tratante, coordinación (y el registro automático) | opcional | Protocolo §6.1; §5.70 |
| `supervision` | Supervisión clínica | coordinación | opcional | Protocolo §5 fila 3 |
| `copia_familia` | Copia de la HC entregada a la familia | tratante, coordinación | **obligatorio** | §5.103; Ley 18.335 art. 18 lit. A |
| `otro` | Otro motivo | técnico no tratante, coordinación | **obligatorio** | decisión de diseño: el catálogo corto no cubre todo |

**Reglas del texto libre:** como cualquier texto opcional, `''` o blanco → NULL (`services/texto.py`); hasta 500 caracteres (422 por
campo); sin NUL (§5.163 a); se quitan los caracteres Cf y Cc **salvo** salto de línea, retorno y tabulación, con el aviso de §5.163 b
(1). La pantalla dice al lado del campo: «Escribí el motivo, no datos clínicos del NNA.» El texto queda en el registro y lo lee
coordinación.

## f. Sesión (A3)

- **Límite de intentos (F4-12, B4).** Por **email**: 5 fallidos en 15 minutos → `429 too_many_attempts` durante 15 minutos; por
  **dirección**: 20 fallidos en 15 minutos → lo mismo. Las cuentas viven en **Postgres** (`intento_login`: `ts`, `email_hash`
  —SHA-256 del email normalizado, para no guardar lo que alguien tipeó mal—, `ip`, `exito`), no en memoria: sobreviven a un reinicio
  y valen con más de un proceso (Postgres-only, §5.2). La clave es el **texto del email**, exista o no la cuenta, y el 429 es igual
  para las dos: no revela qué emails existen (como el login de tiempo parejo, §5.119). El 429 se decide **antes** del bcrypt y lleva
  `Retry-After`. Un login correcto deja de contar los fallidos anteriores de ese email. El intento se escribe en **su propia
  transacción** (el login falla con 401 y el request se deshace). Las filas de más de 24 h se borran en el mismo login (es la única
  tabla con DELETE: no es registro, es un contador). La dirección es `request.client.host`; detrás de un proxy es del despliegue.
- **Revocación (B4, Protocolo §7: «de inmediato»).** `profesional.token_version` (entero, 0; la columna la crea A1) y el token lleva `ver`; `leer_token`
  exige `ver` como exige `exp` y `sub` (§5.163), y `usuario_de_token` lo compara con la base. Sube al **desactivar**, al **cambiar la
  contraseña** (propia o reseteada), al **cambiar el rol** y en **`POST /auth/logout`** (204). Desactivar ya corta hoy (`activo`), pero
  cambiar la contraseña no. Cerrar sesión cierra **todas** las sesiones del usuario: *rechazado* un `jti` por token con lista de
  revocados (otra tabla y su limpieza, para una institución de pocos usuarios). Las ventanas de acceso terminan con él (F4-9).
- **Logout en el servidor:** `POST /auth/logout` (arriba). La demo sigue descartando el token en el navegador (no cambia, sección i);
  React llama a la ruta (R6).
- **`POST /auth/password {actual, nueva}`:** cualquier usuario; 422 por campo (la actual no coincide, la nueva < 8 caracteres o > 72
  bytes); sube `token_version`. La contraseña mínima **sigue en 8** (`crear_usuario.PASSWORD_MIN`): subirla podría dejar afuera las
  claves con que el equipo carga la presentación (`IPPU_PASSWORD`, `IPPU_DEMO_PASSWORD`), y la política la puede fijar IPPU después.
- **B6 (F4-13).** `GET /grupos`: el técnico recibe **sus** grupos del año (técnico 1 o 2); coordinación y administrativo, todos;
  dirección NT, 403. `GET /profesionales`: el técnico recibe los **activos con rol `tecnico` o `coordinacion`** (los que puede elegir
  como evaluador o firmante, o tener de colega), sin el filtro `activo=false`; coordinación, todos; administrativo y dirección NT, 403
  (el administrativo ve los técnicos de cada grupo en `GET /grupos`). La demo ya filtra los grupos del técnico en el navegador
  (§5.153 c): no cambia.
- **B5 (F4-14), en A1.** El alta (o el cambio) con una C.I. que ya existe sigue siendo **409**: `persona.ci` es `UNIQUE`, dejar
  guardar crearía la misma persona dos veces (esto cierra la pregunta de §5.162 «si el aviso bloquea o deja guardar»). El
  **técnico** recibe «Ya hay un NNA registrado con esa C.I. Consultá con coordinación.» con `campo: null` (§5.162 i; reemplaza el
  genérico de §5.119 d). **Coordinación** y **administrativo** reciben el específico con `campo` (ven la nómina: no hay nada que
  ocultarles). Se construye en **A1** y no en A3 porque cambia el chequeo `3b-b` y A1 ya corre la verificación completa de la demo.

## g. Administración (A4)

Todo lo hace **coordinación** (§5.162 e); los demás roles reciben 403. Cada escritura deja auditoría de campo con `hce_id` NULL y su
`modulo` (`USUARIO`, `GRUPO` —ya existe—, `TALLER`, `CENTRO`), §5.90.

- **Usuarios** (`/usuarios`): `GET` paginado con filtros `rol`, `activo`, `q`; `POST {email, nombre, especialidad, rol,
  password_inicial}` (las reglas de `crear_usuario`: email único sin mayúsculas, 8 caracteres a 72 bytes); `PATCH /usuarios/{id}
  {nombre, especialidad, rol, activo}`; `POST /usuarios/{id}/password` (reseteo). **Nunca se borra** (405): se desactiva. 409 al
  desactivarse a sí mismo o al dejar la institución sin ninguna coordinación activa. Desactivar, cambiar el rol o resetear sube
  `token_version`. La contraseña nunca va a la auditoría: la fila dice `password` con «(cambiada)». Un rol por usuario (§5.162 f).
- **Grupos:** `POST /grupos {nombre, anio, franja, dias, horario, obs, tecnico1_*, tecnico2_*}` (422 si `(nombre, anio)` ya existe);
  `PATCH /grupos/{id}` suma `nombre`, `franja`, `dias`, `horario`, `obs` y `archivado` a los técnicos; **archivar** =
  `grupo.archivado_en` (fecha): no se ofrece para altas ni en `GET /grupos` salvo `incluir_archivados=true`, y no cambia la relación
  de sus NNA. Sin DELETE. Asignables: técnico o coordinación (F4-2). Abrir un año es crear sus grupos y mover los NNA (`PATCH
  /hce/{id}/identificacion`); un «copiar los grupos de 2026 a 2027» de un pedido queda opcional.
- **Talleres** (`/talleres`, 14 filas sembradas): `GET`, `POST {nombre, orden, grupos_orientados}`, `PATCH` (lo mismo y retirar =
  `retirado_en`, que ya existe). **Centros educativos** (`/centros-educativos`, 0 filas): `GET`, `POST {nombre, tipo, zona,
  contacto}`, `PATCH` y retirar = `retirado_en` (**columna nueva**, como en `taller`). Sin DELETE.
- **La auditoría de lo que no cuelga de un NNA:** `GET /auditoria?modulo=&desde=&hasta=&usuario_id=&limit=&offset=` (sólo filas con
  `hce_id` NULL, paginado), coordinación.
- **Recordatorios** (`PATCH /recordatorios/{id}` de texto, período y `activo`): opcional de A4, sólo si sobra tiempo (§5.159 c).

## h. Cambios de datos

El repo mantiene **una** migración regenerada para coincidir con los modelos: cada sesión con DDL la regenera y **el head cambia**
(hoy `dcc838486407`). **No hay migración de datos**: toda base se recrea (los datos son simulados, §5.104), también la de trabajo
del `.env` después de A1; la de la presentación (`ippu_presentacion`) es de `main` y no se toca hasta que `hce-post26` llegue a
`main` después del 26/11.

| Sesión | DDL |
|---|---|
| A1 | `profesional.rol`: CHECK `rol IN ('tecnico','coordinacion','administrativo','direccion_nt')` (el CHECK de hoy acepta `admin`) · `profesional.token_version integer NOT NULL DEFAULT 0` (en A1 para que `acceso_hce.token_version` tenga contra qué compararse; queda en 0 hasta que A3 lo haga subir) · tabla **`acceso_hce`** completa (sección d; A2 no la vuelve a tocar) con el CHECK de `motivo_codigo` generado de `MOTIVOS_ACCESO` |
| A2 | ninguno |
| A3 | tabla **`intento_login`** (`id`, `ts`, `email_hash char(64)`, `ip varchar(45)`, `exito`; índices `(email_hash, ts)` e `(ip, ts)`) |
| A4 | `grupo.archivado_en date` · `catalogo_centro_educativo.retirado_en date` |

- **Los `admin` de hoy:** pasan a `coordinacion` al recrear la base (el seed y la CLI los crean así); con el CHECK nuevo una fila
  `admin` no entra. `ROL_ADMIN` sale de `core/constantes.py` y entran `ROL_COORDINACION`, `ROL_ADMINISTRATIVO`, `ROL_DIRECCION_NT`
  (con `ROL_TECNICO` y `ROLES`, con su rótulo); `auth.es_admin` pasa a `es_coordinacion` y cada uno de sus usos (`routers/hce.py`,
  `routers/referencias.py`, `services/ateneos.py`, `services/panel.py`, `services/hce.py`, `services/inclusion.py`, `services/fotos.py`)
  pasa por una función de la matriz, no por una comparación de rol suelta.
- **`crear_usuario`:** `--rol` con las cuatro claves; `admin` se rechaza con «El rol admin ya no existe: usá coordinacion.». Sigue
  siendo el modo de crear la **primera** coordinación (no hay alta por la API sin un usuario que la haga).
- **Seed de la demo** (`seed_demo.preparar_usuarios`): la coordinación de `IPPU_EMAIL` (como hoy, «Coordinación (demo)», rol
  `coordinacion`), el Dr. González y la Mtra. Torres (`tecnico`, sin cambios) y **dos nuevos** con `IPPU_DEMO_PASSWORD`:
  `administrativo@demo.ippu.test` («Administración (demo)», `administrativo`) y `direccion@demo.ippu.test` («Dirección (demo)»,
  `direccion_nt`). El seed sigue cargando lo clínico como González y asignando técnicos como coordinación; su comprobación previa
  (`cis_cargadas`, `GET /hce?ci=`) sigue valiendo (búsqueda institucional sin motivo).
- **Presentación:** `herramientas/preparar_presentacion.ps1` crea la coordinación con `--rol coordinacion` (hoy `--rol admin`) y su
  texto dice «coordinación»; `verificar_presentacion.js` entra como técnico y no cambia. `CLAUDE.md` («Cómo correr», paso 4) cambia
  `--rol admin` por `--rol coordinacion`.

## i. La adaptación mínima de la demo HTML

Sólo lo que mantiene `conectada.js` en verde con la API nueva (A1); la demo se descarta con React (decidido el 2026-11-08). **Nada
más**: ni pantallas para administrativo y dirección NT (con esos roles la demo muestra el error de la API; React, R6), ni la consulta
por C.I., ni el logout en el servidor, ni la administración.

- **Nombres de rol:** `ROL_TXT` de `ui-core.js` con las cuatro claves y sus rótulos de la sección a.
- **`"admin"` → `"coordinacion"`** en las comparaciones de rol de `grupos-usuario.js`, `inclusion.js`, `pendientes.js` y `wizard-nna.js`.
- **El diálogo del motivo**, en `expediente.js`, en `abrirExpediente(id, opts)` —la única puerta al expediente desde el listado,
  Pendientes, Grupos, Inclusión y la tarjeta de ateneos—: si `GET /hce/{id}` responde `403 reason_required`, se abre un diálogo
  modal (el patrón de diálogo de `notas-accesibilidad-ui.md` §2.6: foco al abrir, Escape cierra, foco de vuelta al disparador)
  con el mensaje de la API, un `<select>` con los motivos de `GET /accesos/motivos` para el rol del usuario y un `<textarea>` con su
  `<label>` y la indicación de la sección e; «Abrir con este motivo» hace `POST /hce/{id}/accesos` y vuelve a llamar a
  `abrirExpediente`; los 422 van junto a su campo; «Cancelar» vuelve al listado. Sin colores nuevos: los tokens de los diálogos
  existentes (contraste: todo par nuevo ≥ 4,5:1). Una pestaña que reciba `403 reason_required` porque la ventana venció muestra el
  mensaje de la API en su estado de error, con «Reintentar» (que vuelve a pasar por el diálogo).

**Chequeos de `conectada.js` que cambian** (ninguno se borra):

| Chequeo | Qué cambia |
|---|---|
| `3b-b` | el mensaje del técnico es el de B5 (sigue sin nombrar el campo) |
| `c1-solo-lectura` y el conteo previo de C1 | la coordinación abre la ventana (`POST /hce/{id}/accesos`, `supervision`) antes de leer el LOG de Martín; el LOG no cambia (el acceso va a otra tabla) |
| `c1-ajeno`, `c2-ajeno`, `c3-ajeno`, `c4-ajeno`, `c5-ajeno` | **preparación:** el expediente ajeno lo crea **González en su grupo** y carga él los datos (severidad, INAU y registro, ficha y gestión, documento); después coordinación le quita el grupo (`PATCH /hce/{id}/identificacion {grupo_id: null}`) —un pase de caso—; **lo afirmado:** el técnico recibe 403 en lugar de `404 not_found`: `reason_required` en las lecturas, `forbidden` en las escrituras, el LOG (C1) y las fotos (C5); coordinación sin ventana, `403 reason_required`, y con ventana, 200 (en lugar del 200 directo del admin); la pantalla muestra el **diálogo del motivo** y ningún dato del NNA (en lugar de «no encontrado») |
| `c6-clinico-ajeno` | **no cambia**: coordinación da de alta en Inicial con datos identificatorios y crea el clínico (lo permite F4-5); el clínico ajeno sigue 404 para González |
| `3c-j11`, `f2-grupos-admin`, `f2-asignar`, `c5-grupo`, `c7-alcance` | **no cambian** (`ADMIN_*` sigue siendo la coordinación del seed; `f2-asignar` simula su propio 403) |
| **nuevos** `a1-motivo-dialogo`, `a1-motivo-abre`, `a1-motivo-cancelar` | González abre un expediente ajeno: el diálogo con foco, rótulos y los motivos de su rol; un motivo abre el expediente y deja una fila en `GET /hce/{id}/accesos` (coordinación); Cancelar vuelve al listado sin pedido |

`fingerprint.js` y `capturas.js` no cambian (la vista del diálogo se suma al contraste: `verificar_contraste_ui.js` lo abre como
González sobre un expediente sin grupo).

## j. Las sesiones A1–A4

En el orden del plan; **cambia el reparto, no el orden**: la ventana (tabla y `POST /hce/{id}/accesos`) pasa de A2 a **A1** porque
las columnas «con motivo» de la matriz no se pueden probar sin ella, y **B5** pasa de A3 a **A1** porque sólo cambia un chequeo de la
demo que A1 ya verifica. Las cuatro salen de `hce-post26` desde el 2026-11-13 (§5.162 a). **Ninguna** toca la base de la presentación.

- **A1 — roles, relación, matriz y ventana (Opus 5.5).** Construye las cuatro claves (CHECK, constantes, `crear_usuario`, seed con
  los cuatro roles, `preparar_presentacion.ps1`); `relacion(usuario, hce)` y **una** función de la matriz que todas las dependencias
  usan (`hce_visible`, `_visible_por`, `exigir_grupo_visible`, la visibilidad de ateneos, el alcance de listas y panel), con el orden
  de chequeos de la sección b; `403 reason_required`; `acceso_hce` y `POST /hce/{id}/accesos`; `GET /accesos/motivos`; `GET|PATCH
  /hce/{id}/identificacion`; `POST /hce/consulta`; las restricciones por campo del alta y de la identificación; la supresión del panel
  para dirección NT; B5. **Prueba:** un test parametrizado que lee `fase4-matriz-rutas.csv` y, por cada fila y sujeto, arma el
  escenario (un expediente de cada relación, con y sin ventana) y afirma el estado y el `code` (con sus pares que pasan); más las filas
  de las rutas nuevas, que A1 agrega al CSV. **Demo:** la sección i completa. **Aceptación:** pytest todo verde, 0 salteados;
  migración regenerada (head nuevo); `conectada.js` dos veces en verde sobre bases nuevas; contraste sin fallas; el chequeo de la
  presentación sobre `ippu_presentacion_ver`; `herramientas/*.py --check`.
- **A2 — el registro de accesos completo (Opus 5.5).** El registro automático del tratante y de gestión (transacción propia, candado,
  una fila por ventana, sin filas por las listas), el del ateneo clínico, la copia a la familia, `GET /hce/{id}/accesos` y `GET
  /accesos` (filtros, paginado), la lectura de `GET /hce/{id}/auditoria` restringida a tratante y coordinación con motivo (decisión
  9), y el corte de la ventana por `token_version` (la columna es de A1; hasta A3 no sube, así que la ventana termina por
  vencimiento). **Prueba:** N GET paralelos → una fila;
  la ventana vence y el pedido siguiente vuelve a registrar; los clínicos de ateneo; quién lee. **Demo:** ninguna (sin cambios de
  respuesta para lo que la demo ya hace). **Aceptación:** pytest; sin DDL (head de A1); `verificar_estado.py --check`.
- **A3 — sesión y alcance (Sonnet 5.5).** `intento_login` y el 429; `token_version` en el token y en `usuario_de_token`;
  `POST /auth/logout` y `POST /auth/password`; B6 en `GET /grupos` y `GET /profesionales`. **Prueba:** el sexto intento es 429 igual
  con un email inexistente; el 429 llega antes del bcrypt; un token viejo después de logout, cambio de contraseña o de rol es 401;
  B6 por rol. **Demo:** ninguna; se corre `conectada.js` una vez para confirmar que B6 no la rompe (el filtro del navegador ya
  coincide; `3a-b` hace un solo intento fallido). **Aceptación:** pytest; migración regenerada; `conectada.js` en verde.
- **A4 — administración (Sonnet 5.5).** Usuarios, grupos (crear, renombrar, archivar), talleres y centros, `GET /auditoria`
  institucional; opcional, recordatorios. **Prueba:** cada ruta por rol (filas nuevas del CSV), las 409 de la última coordinación y
  de desactivarse, la auditoría con `hce_id` NULL y sin contraseñas, `token_version` al desactivar. **Demo:** ninguna (las
  pantallas son de R6). **Aceptación:** pytest; migración regenerada; `verificar_estado.py --check`.

**Lo que R6 (React) necesita de este diseño:** el diálogo del motivo (sección i, con `GET /accesos/motivos` y el 403
`reason_required` como disparador); la consulta por C.I. del no tratante; las pantallas por rol (navegación de administrativo:
búsqueda, identificación y ORG; de dirección NT: el Panel y el indicador); el visor del registro de accesos (por expediente y el
institucional con filtros); la administración (usuarios, grupos, talleres, centros, auditoría institucional); cambiar la contraseña;
el logout que llama a la API; el mensaje del 429.

## k. Preguntas nuevas para IPPU

No están en `puntos-a-validar.md` §1.19–§1.23; ninguna bloquea. Se agregan como §1.24–§1.29 y D6–D11 de `preguntas-ippu.md`.

| | Pregunta | Mientras, se construye |
|---|---|---|
| §1.24 · D6 | Cuando la coordinación supervisa una historia, ¿sólo la lee, o también corrige o completa módulos clínicos? | sólo lee; edita identificación y logística (F4-5) |
| §1.25 · D7 | Un técnico que consulta la historia de un NNA de otro grupo (interconsulta, pase), ¿necesita verla entera o sólo algunas partes? ¿Cuáles? | toda menos el historial de cambios y las fotos, sin escribir (F4-4) |
| §1.26 · D8 | El personal administrativo, ¿maneja los trámites con INAU y BPS (convenios, AYEX, envíos)? ¿Necesita ver o enviar informes? | lee y escribe ORG; no ve informes ni nada clínico (F4-6) |
| §1.27 · D9 | ¿Hay una coordinación para todo Atención Diurna o varias, cada una con grupos a cargo? | una, para toda la institución (F4-3) |
| §1.28 · D10 | Cuando se entrega a la familia una copia de la historia, ¿quién la entrega y qué tiene que quedar anotado? | la registra el tratante o coordinación, con texto obligatorio (F4-9) |
| §1.29 · D11 | ¿Qué información necesita la dirección no técnica? ¿Les sirve que las medias de menos de 5 NNA no se muestren? | el Panel institucional con esa supresión y el indicador de ateneos (F4-7) |

## Apéndice — cómo se generó y se verifica el CSV

Las rutas salen de la aplicación, sin tocar la base (el comando A2 de `docs/inventario-hce.md`). Desde
`implementacion/L1-hce-idea/backend`, con el intérprete del `.venv`:

```
DATABASE_URL=postgresql+psycopg://x:x@localhost:1/x SECRET_KEY=<64 caracteres> .venv/Scripts/python.exe - <<'EOF'
import csv
from collections import Counter
from app.main import app
rutas = [(m, r.path) for r in app.routes if hasattr(r, "methods") and r.path and r.endpoint.__module__.startswith("app.routers.")
         for m in sorted(r.methods - {"HEAD", "OPTIONS"})]
filas = list(csv.DictReader(open("../../../docs/diseno/fase4-matriz-rutas.csv", encoding="utf-8")))
csv_rutas = [(f["metodo"], f["ruta"]) for f in filas]
print("app:", len(rutas), "csv:", len(csv_rutas))
print("repetidas en el csv:", [k for k, n in Counter(csv_rutas).items() if n > 1])
print("faltan en el csv:", sorted(set(rutas) - set(csv_rutas)), "sobran:", sorted(set(csv_rutas) - set(rutas)))
print("filas sin fuente:", sum(not f["fuente"].strip() for f in filas))
EOF
```

El CSV se escribió con un script de un solo uso que aplica las reglas de la tabla de la sección b a la lista de rutas de la app y
falla si alguna ruta queda sin regla o alguna regla sin ruta; no queda en el repo: **la fuente es el CSV**, y A1 lo edita a mano
(agregando las filas de las rutas nuevas).
