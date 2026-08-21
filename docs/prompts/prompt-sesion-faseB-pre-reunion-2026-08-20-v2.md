# Claude Code — Fase B (ejecución pre-reunión) · v2. Reunión con IPPU: **mañana 21/08**

> Prompt in English for token efficiency. **Everything written into the repo — docs, comments, commit
> messages — is in Spanish (rioplatense neutro)**, per `CLAUDE.md`.
>
> Continuation of the Fase A session (2026-08-20). **Do not re-measure anything Fase A measured.**
> Already established: `732fcb0` + `43211a3` on both remotes · `verificar_estado.py --check` green ·
> F1 head `5544e71`, merge-base `684c4f5`, single conflict in `handoff.md` §13 · A.1 verdict (M12.5
> gated by association; M12.6 too in schema, still blocked by missing IPPU material) · A.2 branch
> coverage · A.3 cross of the June questionnaire · A.4 graph check · A.5 landing-pad gap.
>
> **Q6 is resolved and it changed the session.** The version of `consulta-a-ippu.md` sent on 19/08 is
> **not** the repo version with §3.1 corrected — it is a different document, revised by the team, with
> **three questions removed** and everything after them renumbered. See **B.2**. The repo currently
> describes a questionnaire IPPU does not have.

---

## ANSWERS FROM LUCAS — fill in before running. Nothing marked TBD proceeds.

```
Q1/Q5/Q8  F1: [ MERGE tonight, then show merged main ] | [ NO merge, show main ] | [ NO merge, show F1 ]
Q2   Landing pad docs/notas/respuestas-reunion-ippu-2026-08-21.md: [ CREATE ] | [ NO ]
Q3   §5.8 gate amendment: [ WRITE NOW ] | [ AFTER the meeting ]
Q4   Agenda items June already answered: [ reframe per B.5 ] | [ other: ____ ]
Q7   Agenda §3 (dos técnicos): [ ask against the screen ] | [ ask without showing ]
Q9   Commit docs/prompts/prompt-sesion-pre-reunion-2026-08-20.md: [ YES ] | [ NO ]
Q10  pai_taller question (June Q14/Q15) promoted to the top of the agenda: [ YES ] | [ NO ]

— new, from the questionnaire swap —
Q11  The sent .docx original: [ KEEP as a named exception, amending §5.29's keep-list ] | [ DELETE,
     keep only the conversion ]
Q12  Is the authoritative artifact a Google Doc the team edits?  [ YES → link + snapshot date: ____ ]
     | [ NO, the .docx is the artifact ]
Q13  The superseded repo version: [ DELETE, rely on git history + tag (precedent §5.5/§5.29) ]
     | [ KEEP as docs/notas/consulta-a-ippu-2026-08-07-borrador-interno.md ]
```

⚠️ **Q11–Q13 only execute if Q1 = MERGE.** `docs/notas/consulta-a-ippu.md` and
`docs/notas/puntos-a-validar.md` are frozen by F1 (§12.3). If there is no merge, B.2 is **report-only**:
produce the sweep and the mapping table, write nothing, and list it as a sixth deferred item — but say
plainly in the report that five repo documents currently describe a questionnaire that is not the one
IPPU holds, and that Lucas is walking into the meeting with the wrong version in his head.

## Session start

`git pull`. Read `handoff.md` §5.27–§5.32 and §12, `CLAUDE.md`,
`docs/planes/agenda-reunion-ippu-2026-08.md`, PLAN-M12 §7.

Confirm the tree is clean and that the tag `pre-limpieza-2026-08-20` still resolves — it is tonight's
rollback point.

**Time-boxed session.** The meeting is tomorrow. If any step does not go cleanly, **stop, revert that
step, and report** — do not improvise a fix at midnight. A demo that works and covers less beats a demo
that covers more and is broken.

---

# B.1 — F1 merge (only if Q1 = MERGE). Order matters; each step is its own commit.

Lucas set three conditions before merging (regresión de talleres · harness roto sin baseline · 663
líneas contra el no-goal textual de §5.27). All three are discharged here, **in this order**, because
§12.6 says a written decision is amended in writing before the fact, not legitimised after it.

**1. Amendment to §5.27, first.** New §5 entry (next free number, dated 2026-08-20, author Lucas).
§5.27 says textually: «**No** se agregan módulos nuevos (HCE-SEV, HCE-INC, HCE-PAI, **Ateneos**)». F1
added `js/inclusion.js` (175) and `js/ateneos.js` (488). The entry must:
- state what was added and that it exceeded the scope §5.27 fixed — **not** frame it as always having
  been allowed;
- state the reason it is accepted rather than reverted, honestly: those 663 lines are the only thing
  that can put **M12.5 and M12.7 in front of IPPU tomorrow**, and both sub-modules are blocked. The
  scope breach and the meeting value are the same fact;
- record what `inclusion.js` actually is (per A.2: the **institutional dashboard**, 7 KPIs by estado —
  **not** the per-NNA HCE-INC ficha/bitácora, and no `sensible` derivation), so nobody later reads the
  demo as covering M12.5;
- keep §5.27's other prohibitions standing unchanged (§5.2, the 60 Rivière descriptors).

**2. The merge.** `git merge --no-ff gitlab/demo/F1-navegacion`. One conflict, `handoff.md` §13.
**Deterministic resolution:** F1's entries (16 → 19) first, then the 20/08 ones, which is the chronology
§13 already uses. Nothing is dropped from either side. Do not restructure the file while resolving.

**3. Taller regression (§5.14 / D5) — repair it now that the file is on `main`.** `g.talleres` is still
seeded on all 4 groups (`grupos-usuario.js:34/40/46/52`); `main` drew the per-taller tags at `:56` and
F1 dropped that row, leaving only the aggregate KPI at `:93`. Restore the row **in F1's markup and
styling**, not by reverting F1's restyle. Then fix `index.html:401`, which still promises «técnicos
**encargados** … y **talleres asignados**»: F1 renamed the first and removed the second, so both halves
read as bugs at a non-technical walkthrough.

**4. Harness debt.** F1's §6 item (c) («re-baseline del fingerprint») is impossible as the harness is
designed: `verificacion/.gitignore` excludes `*.json`, so no baseline exists, and `fingerprint.js:82`
walks a nav array whose `usuarios` entry B2 relocated. Discharge it the cheap way: **write the
two-worktree comparison procedure into `demo/verificacion/README.md`** as a procedure, not as the loose
line 44 mention — and note in one line why no versioned baseline exists and what it would take to have
one. §5.5 sold this harness as the safety net for every demo refactor; it has to stop being a net that
catches nothing. If a committed baseline is preferred instead, say so in the report — do not do both.

**5. Verify, and report the real numbers.** `node --check` over every module in `demo/js/` ·
`python herramientas/generar_catalogos_backend.py --check` → OK · `pytest -q` → **240 passed, 0
skipped** · `verificar_estado.py --check` → green. If the table/test counts moved, that is a finding,
not a number to overwrite.

**6. Push both remotes.** ⚠️ Fase A found `origin` never had the F1 branch. Per §12.2 the mirror gets
the merged `main`; also push the branch ref so the history has a name, or record explicitly that it
only ever existed on `gitlab`.

---

# B.2 — The questionnaire swap (NEW). The repo does not hold what IPPU holds.

Lucas has the version actually sent on 19/08 (a `.docx` / possible Google Doc, converted to markdown).
It is **not** `docs/notas/consulta-a-ippu.md` with §3.1 corrected. Established by comparison, do not
re-derive:

- **§3.1 is fine.** The sent text says «Lo que todavía no construimos es la pantalla para hacer esos
  cambios». **No overpromise. Nothing to walk back tomorrow.** Q6 closed.
- **Three questions were removed in the team's revision and never asked:**

| Removed | Where it still lives as an open item |
|---|---|
| §2.7 Los porcentajes de la valoración funcional (baremo) | `puntos-a-validar.md` §1.2 · `handoff.md` §7 · agenda §5 |
| §2.8 El porcentaje lo define el organismo oficial | idem |
| **§3.2 Las citas bibliográficas de la Escala IPPU-TEA ⚠️** | `puntos-a-validar.md` §1.4 |

  Verified by search in the sent document: **0** occurrences of «baremo», «BUND», «72/025»; **0** of any
  bibliographic-citation question. They are gone, not relocated.
- ⚠️ **The sent document contradicts itself, and IPPU has it in hand.** Its intro still names «**3.2**
  (las citas de la escala)» among the three most blocking questions — but in that document §3.2 is
  *Acceso al sistema actual* and the citations question does not exist. Also §2.1 lost its ⚠️ in the
  heading while the intro still flags it.
- **§2.6** gained «(Sin estar en el HCE)». §1.1–§1.6 and §2.1–§2.6 otherwise unchanged.

## B.2.1 Renumbering map — use this, do not re-derive it

| Repo (superseded) | Sent | Repo (superseded) | Sent |
|---|---|---|---|
| 2.7 baremo | **removed** | 3.6 quién ve qué | **3.5** |
| 2.8 organismo oficial | **removed** | 3.7 falta un técnico | **3.6** |
| 2.9 períodos | **2.7** | 3.8 cambia de grupo | **3.7** |
| 2.10 fotos | **2.8** | **3.9 puntuación independiente ⚠️** | **3.8** |
| 3.1 talleres | **3.1** (text changed) | 3.10 informe a la familia | **3.9** |
| 3.2 citas de la escala ⚠️ | **removed** | 3.11 severidad DSM | **3.10** |
| 3.3 acceso al sistema ⚠️ | **3.2** | 3.12 nombre del PAI | **3.11** |
| 3.4 expedientes existentes | **3.3** | 3.13 ateneos de grupo ⚠️ | **3.12** |
| 3.5 número de historia | **3.4** | 3.14 número de ateneo | **3.13** |
| | | 3.15 algo que no preguntamos | **3.14** |

## B.2.2 Execution (only if Q1 = MERGE)

1. **Replace `docs/notas/consulta-a-ippu.md` with the sent version** — content untouched, **markup
   normalised to repo convention**. The conversion carries docx artifacts that must not land raw:
   numbered-list prefixes fused to headings (`1. # **Consulta…`), escaped `\=`, bold on everything, and
   the `> _Respuesta:_` blockquote convention lost. Normalise the marking so the diff is readable and
   greps keep working; **change not one word of the questions**.
2. **Status header** at the top: sent 2026-08-19 · revised by the team · no answer yet · what it blocks
   (name the sub-modules) · and, per Q12, whether this file is a **snapshot of a Google Doc** with its
   link and snapshot date. If it is a snapshot, say so — otherwise it diverges again in two weeks.
3. **Per Q13**, the superseded version: delete relying on git history and the tag (precedent §5.5,
   re-used in §5.29), or keep it under a name that states a **fact rather than an age** —
   `consulta-a-ippu-2026-08-07-borrador-interno.md`. Do **not** call it `-viejo`: two files with the
   same base name and different semantics in one folder is what §5.30 just finished removing.
4. **Carry the three removed questions into `puntos-a-validar.md`**, §1.2 and §1.4, marked explicitly
   **«no se preguntó — se sacó en la revisión del equipo del 19/08»**, with their original wording
   preserved there. This is the reason the superseded file does not need to survive as a sibling.
5. **Reference sweep, the same discipline as the Fase 2 purge.** Every `consulta-a-ippu.md §N.N`
   citation elsewhere in the repo now points at a different question. Sweep the whole tree and fix using
   B.2.1; report every hit with file and line. Known damage to check first:
   - `handoff.md` §6 — describes «Parte 3 **11** dudas puntuales» (it is 14 in the sent version) and
     names «**3.2** (citas bibliográficas de la escala)» among the four ⚠️ that unblock the most. That
     question **no longer exists**. Fix both claims.
   - `handoff.md` §7 (baremo BUND / Decreto 72/025) — reclassify from «preguntado» to «nunca se
     preguntó», if it says otherwise.
   - `puntos-a-validar.md` §1.x cross-references · `PLAN-M12` · `docs/planes/agenda-reunion-ippu-2026-08.md`
     · `docs/estructura-repositorio.md` · `README.md`.
   - References inside §13/bitácora describe **past state** — do not rewrite history; only fix
     statements false about the present.
6. **Per Q11**, the sent original. §5.29 kept `Cuestionario IPPU UTEC, respuestas.docx` as **primary
   proof of what IPPU answered in writing**; by the same criterion the sent file is primary proof of
   **what we asked**, and it is a document in a third party's hands — a stronger case than the
   questionnaire had. If KEEP, add it to §5.29's keep-list as a **named exception** to the conversion
   rule `CLAUDE.md` rewrote in Fase 2 (original gets deleted after conversion), and add its path to
   `.graphifyignore` under the §5.7 criterion. If DELETE, record what is accepted as lost.

**Acceptance for B.2:** re-run the sweep → zero citations pointing at a renumbered or removed section.

---

# B.3 — §5 entries

## The questionnaire divergence (always, even if Q1 = NO MERGE — this one goes in §5 either way)

New entry, dated 2026-08-20, author Lucas. It must record, without softening:

- the repo held a questionnaire that **is not** the one IPPU received, from 19/08 until tonight — the
  **fifth** docs↔reality divergence of this round, and the first where the other side of the divergence
  is **outside** the repo;
- the three questions the team's revision removed, and that two of them (baremo) plus one ⚠️ (citas de
  la escala) are therefore **still unasked**, not «sent and awaiting answer»;
- that the sent document's own intro points at a question it does not contain;
- ⚠️ **that `verificar_estado.py` cannot catch this class of drift.** It measures tables, tests and the
  migration; it does not compare prose claims — §6's «11 dudas puntuales» is exactly the kind of
  statement that went stale silently. Record it as a known limit with a candidate fix (compare the
  section count of the notes files against what `handoff.md` §6 claims), and **leave the fix for after
  the meeting** — tonight is not the night to extend a verification tool.

## The §5.8 gate, if Q3 = WRITE NOW

Next free number, dated 2026-08-20, author Lucas. Carry A.1's measurement verbatim — spec lines,
`ix_idea_hce_id unique=False` (`9246e659d2c9:392`), the resolution rule at `app/models/modulos.py:218`
and its test at `tests/test_esquema_v2.py:54`. Three things it must get right or it will be misread:

1. **It does not ratify §5.8.** §5.8 remains «a ratificar por el equipo». What changes is **where the
   gate sits**: not «antes de M12.5» but before **M11.3**, where the «la vigente es la de mayor
   `fecha_consenso`» resolution lives and where the change stops being additive. Say it in those words.
2. **It amends §5.28, written the same day.** §5.28's table says M12.5's «única puerta» is the
   ratification of §5.8; A.1 measured that false. §5 is append-only, so this is a new entry naming
   §5.28 and correcting that row — not an edit.
3. **M12.6 is not unblocked by this.** Its schema is free of `idea`, but §5.28's second, independent
   blocker stands: the Manual's Anexo A and the 13 sections the prototype does not show. Do not let
   «desacoplado de §5.8» read as «destrabado».

Also record A.1's two spillovers with their addressee: the `inclusion.estado` / `fecha_estado`
annualisation question (a **different** question from §5.8 — do not merge them), and the M11.3
requirement that a 2024 PAI must not silently render today's IDEA under the `fecha_consenso` rule →
`esquema-datos-v2.md` §4, not a table.

## PLAN-M12 §7

Replace the third bullet with the amendment Fase A drafted. The plan text must stop saying «antes de
M12.5» once §5 says otherwise.

---

# B.4 — Landing pad (Q2)

Create `docs/notas/respuestas-reunion-ippu-2026-08-21.md`, **pre-structured so tomorrow it is filled in,
not written**. One section per agenda item, in walkthrough order, each with:

- the question as it will be asked, in the reframed wording from B.5, **numbered per the sent version**
  (B.2.1) — Lucas and IPPU will have that document in front of them, not the repo's;
- the **June answer quoted underneath** wherever A.3 found one, so a contradiction is visible on the
  spot without looking anything up;
- a blank for the answer;
- ⚠️ **one line naming which §5 entry or sub-module each possible answer triggers** — e.g. «si dicen que
  no quieren registro de talleres → `pai_taller` sale del alcance de M12.6». This is what makes the
  post-meeting session mechanical instead of interpretive.

Open it with the **three never-asked questions** from B.2 — baremo (×2) and citations of the IPPU-TEA
scale — since those have no written channel at all and the meeting is now their only one.

Close with a section for anything IPPU raises that we did not ask. Head the file as **temporary by
design**, with its retirement condition: it folds into `puntos-a-validar.md` §1 and `consulta-a-ippu.md`
**after** the meeting, not tonight.

---

# B.5 — Agenda update

`docs/planes/agenda-reunion-ippu-2026-08.md` is ours. Rewrite it against A.2, A.3 and B.2.

**§3 — dos técnicos (Q7).** A.2's most serious finding: the IDEA screen shows **firma doble sobre un
puntaje único de consenso** (`flujo.js:195`; `lb.dim` a flat array of 12, `evaluaciones.js:54-64`) — the
*opposite* of §5.16/D7. Shown as a probe without framing, a «sí, así trabajamos» confirms the model we
did **not** build. Per Q7, either move it to «se pregunta, no se muestra», or ask against the screen in
explicit contrast — **write the exact sentence into the agenda** so it is not improvised in the room.
Keep §5.16 flagged as our own addition and the most expensive «no» available. Cross-reference the sent
**§3.8** (was §3.9), which asks the same thing in writing.

**§2 — talleres (Q10).** A.3 reorders this. The agenda currently asks who administers the 14 talleres;
that is second-order. In June IPPU answered **«No»** to recording taller attendance (Q14) and **«No»**
to per-taller indicators (Q15), and M12.6 is about to build `pai_taller`. The first question is whether
we are modelling a practice that does not exist — write it directly, with its consequence attached.

**New opening item — the three unasked questions.** Baremo percentages (×2) and the IPPU-TEA citations.
Add one plain line for IPPU: the sent questionnaire's intro points at a citations question that was
removed in revision, so if they went looking for it, it was not there. Thirty seconds, said out loud,
no drama.

**Reframe, do not repeat (Q4).** For each item A.3 marked «ya respondida», replace the question with the
one still open. At minimum: acceso a la HCE → **«¿quién redacta y quién firma el documento de
confidencialidad, y cuándo?»** (June Q3/Q45 already answered the «sí»); fotos → only **«¿el sistema
puede bloquear la foto si falta la autorización, o eso les traba el día a día?»** (Q43 answered the
rest); Q31 → not «¿existe el área?» but **«¿nos pasan la planilla del Drive?»**, which is what
`catalogo_centro_educativo` and the 7 `INC_ESTADOS` need.

**Coverage.** If B.1 merged, the per-branch annotations collapse to one demo — remove the columns and
state what the single demo covers and what it does not (HCE-SEV: neither branch, per A.2). If not
merged, keep them and mark clearly which items cannot be shown on the branch Lucas chose.

**Renumber every citation** of the consulta in the agenda per B.2.1, whether or not the swap executes:
the agenda is read in the room against the document IPPU holds.

---

# B.6 — Close

New §13 entry: what merged (or did not), what was repaired, the questionnaire swap, the decisions
written, the agenda changes. **Separate commits by purpose.** Push to both remotes. Commit the Fase A
prompt to `docs/prompts/` per Q9.

**Report:**
- the five verification outcomes from B.1.5, with real numbers;
- whether the merge conflict resolved as predicted, and anything that did not automerge as Fase A's
  dry-run said it would;
- **B.2's sweep result — every citation fixed, and zero remaining**, plus what was decided on Q11–Q13;
- the §5 entries as written;
- ⚠️ **the reconciliation A.4 owes**: the corpus went 72 → 77 files while the purge removed 3 and the
  backend v1 retirement removed ~24, implying ~32 entered. Show the arithmetic or say it cannot be
  reconciled — the number feeds the LLM cost estimate at round close, so a plausible story is not
  enough;
- anything declined because it needed Lucas, one line per question.

**Deferred, restate so they are not lost.** If F1 merged, several of these stop being «cuando aterrice
F1» and become owed *by name*: the `handoff.md` split · status header on `puntos-a-validar.md` · the
`puntos-a-validar.md` §2.1 update (§5.31) · the F1 prompt file move to `docs/prompts/` · the folding of
`respuestas-reunion-ippu-2026-08-21.md`. New ones from tonight: the harness baseline (if B.1.4
documented the procedure instead) · the `grupo` reconciliation — F1's
`responsable1`/`responsable2`/`tecnicosAutorizados` is **shown and not modelled** (§13 hallazgo 3), and
merging it does not model it · the prose-claim check for `verificar_estado.py` (B.3).

---

## NOT for this session — Lucas, tonight, before the meeting

1. **Open the demo in a browser and walk the agenda end to end.** Every verification in Fase 2 and Fase
   A was read-only, on purpose. Nobody has looked at this demo with eyes, and tomorrow it opens in front
   of IPPU. This is the one risk no session can close.
2. **Re-read the sent questionnaire end to end.** It is not the document you have been working from: it
   has three fewer questions and different numbering from §2.7 and §3.2 onward. IPPU will have that one
   in hand.
