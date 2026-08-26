# Borrador — Color y significado clínico

> ⚠️ **Esto NO es una regla del equipo.** Es un borrador de entrada de `handoff.md` §5, escrito por una
> sesión de Claude e impreso en el chat, no commiteado — §12.6 exige que las decisiones se cambien **por
> escrito y en §5**, con fecha y autor, nunca de hecho. Mientras este archivo exista, la regla **no rige**:
> es material de trabajo para que Lucas la firme. **Cuando Lucas la firme en `handoff.md` §5 (como §5.36,
> a verificar el número contra el repo en ese momento), este archivo se borra** — su contenido pasa a
> vivir en §5, con `docs/guias/notas-accesibilidad-ui.md` §3 como anexo técnico (mediciones, no la regla
> en sí). Citar este archivo mientras exista es citar un borrador, no una decisión.

---

### 5.36 (borrador) Color y significado clínico: severidad ≠ urgencia, la rampa del IDEA bajo su inversión, y los dos vocabularios de estado (Lucas)

Consolida en §5 lo que `notas-accesibilidad-ui.md` §3.1–§3.2 dejó como hallazgo de sesión, para que sea
regla del equipo y no quede sólo en un documento técnico.

**Severidad no es urgencia.** El rojo se reserva para bloqueos **accionables** — un CI sin firmar, una
foto sin autorización de uso de imagen (§8.4), una acción irreversible. Nunca la lectura de una banda del
IDEA ni de un nivel de soporte DSM: son clasificaciones clínicas, no alarmas operativas. Hoy el código lo
hace al revés: `catalogos.js:16-23` (las 6 `IDEA_BANDAS` mapean a `--ok`/`--warn`/`--bad`) y
`ui-core.js:192,204` (`badgeClass`, misma tríada por puntaje de ítem).

⚠️ **Hallazgo verificado en la sesión de pre-review (2026-08-21), no estaba en la nota original:**
`ui-core.js:257-268` (el total del IDEA pintado en vivo) no sólo usa la tríada equivocada — usa los
**cortes** equivocados. Pinta `--bad` desde 65 y `--warn` desde 33, que es el modelo de **3 tramos** que
**§5.13/D4 declaró derogado** (2026-08-14) en favor de 6 bandas (0–15/16–30/31–55/56–75/76–90/91–96).
Nadie actualizó ese punto vivo cuando D4 landeó. **Medido: los dos modelos disienten en 13 de los 97
totales posibles (0–96)** — en 31 y 32 el indicador subestima (dice "leve" cuando la banda ratificada dice
"leve a moderado"); en 65 a 75 sobreestima (dice "severo" cuando la banda ratificada dice "moderado", no
llega a banda 5 hasta 76). Va a `handoff.md` §6 como pendiente de la próxima sesión de demo, no como
tarea de esta entrada — es el mismo bug de fondo (colores/cortes fijos donde hace falta la escala vigente),
con un síntoma más concreto que el resto de este documento.

**La rampa reemplaza la tríada.** Una escala secuencial de un solo matiz, banda 1 más clara / banda 6 más
oscura — el IDEA va de 0 (sin trastorno) a 96 (afectación severa), así que la rampa lee de menor a mayor
**puntaje**, no de "malo a bueno": no hace falta invertir nada, sólo no arrancar de ningún verde por
costumbre heredada de `--ok`.

⚠️ **Caveat de autoridad, para que nadie lea esto como más confirmado de lo que está.** Las 6 bandas del
IDEA (§5.13) están tomadas del **Prototipo v4** (§5.10), **no** de un decreto. Es un instrumento distinto
del baremo BUND (`categoriaBaremo`/`BUND_CATS`, `hce-doc-org-vf.js:244-249` — 0-4/5-24/25-49/50-95/
96-100), que sí se atribuye al **Decreto 72/025** — pero esa atribución es también una asunción sin
confirmar (`puntos-a-validar.md` §1.2) que el equipo sacó del cuestionario el 19/08 y **nunca le preguntó
a IPPU** (§5.34). Ninguna de las dos escalas está oficialmente confirmada, y son **dos preguntas
distintas**: no se resuelven la una a la otra.

**Los dos vocabularios de estado, tal como existen hoy en el código** (no como deberían ser): ciclo de
vida del módulo — el dominio pide vacío/en curso/firmado-bloqueado/addenda/excepción (cinco estados);
`estadoModulo()` (`flujo.js:67-70`) sólo modela tres (firmado/borrador/bloqueado, derivados, sin drift —
conservar eso), addenda es dato sin marca visual (`lb.addendas`, `flujo.js:276`/`:309`) y excepción no
tiene color propio (`fstep.exc`, `flujo.js:322-324`). Y NS vs. `null`: `flujo.lb.dim` es `0-8 | 'NS' |
null` (`catalogos.js:27`), tipado correcto, pero NS se pinta con el mismo estilo que un número
(`ui-core.js:237`) — sin token visual propio.

**Nota para HCE-SEV.** `severidad_dsm`/`severidad_nivel` (M12.4) no tiene pantalla todavía en ninguna rama
de la demo. Cuando se construya, los niveles 1-3 de apoyo por dominio necesitan la misma rampa neutra que
el IDEA — nunca `--ok`/`--warn`/`--bad`. Se escribe acá para que quien abra esa ronda no tenga que
redescubrirlo.

---

**El edit que se aplicaría a `notas-accesibilidad-ui.md` una vez firmado esto:** su §3 (hoy "reglas de
dominio, no son estética") pasa a abrir con una línea que diga *"regla del equipo: `handoff.md` §5.36"*,
y el contenido actual de §3.1/§3.2 queda como **anexo técnico** (las citas archivo:línea, para
re-verificar) en vez de como la fuente de la regla — la fuente pasa a ser §5.
