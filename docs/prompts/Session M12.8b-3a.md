# Session M12.8b-3a — write down the decisions, fix what R1 found, archive §6

Repository: IPPU × UTEC-LIDIA, branch `main`.
Backend at `implementacion/L1-hce-idea/backend/`.

M12.8b-1b + R1 closed at `12cee57`: the schema document now covers 51/51 tables
and R1 produced `docs/notas/relevamiento-M11.3-2026-09-10.md` with findings
R1-01…R1-10.

⚠️ SCOPE CHANGE: this is M12.8b-3**a**, not M12.8b-3. The vocabulary pass proper
(§5.75/§5.76 — the word "fase" and the line-numbering convention across ~17
files) IS DEFERRED until M12 closes. Reason, recorded deliberately: five
consecutive sessions have touched no code, and the vocabulary pass is the only
remaining item that unblocks nothing. What stays here is what unblocks work or
lowers the cost of every future session.

This session does NOT regenerate the catalogue seed, does NOT implement I1, does
NOT open `app/services/`, and TOUCHES NO CODE except the docstring/comment
corrections in Step 3.

## Ground rules

1. MEASURE BEFORE YOU WRITE. Every number comes from something you measured here.
2. `handoff.md` §5 is APPEND-ONLY.
   ⚠️ BOUNDED EXCEPTION: Step 1 writes THREE new §5 entries, dictated below in
   substance. Lucas decided them in answer to R1's BLOQUE 6.4. You transcribe;
   you do not decide. If any contradicts something already in §5, STOP and report.
3. REGISTERS ARE NEVER CORRECTED: `docs/bitacora.md`, `docs/notas/relevamiento-*`
   (R0 and R1 both), `docs/prompts/`,
   `docs/notas/respuestas-reunion-ippu-2026-08-21.md`,
   `docs/notas/consulta-a-ippu.md`, and the meeting agendas. Working notes
   (`puntos-a-validar.md`, `preguntas-ippu.md`) and `handoff.md` §6 ARE updated.
4. INTEGRITY CHECKS RUN LAST — after your final write to the file being checked.
5. Conventional commits, Spanish body, co-authorship trailer (§5.62).

## Step 0 — Starting point

Measure and report: current commit and clean tree, both remotes at the same hash,
Docker up, `pytest -q`, `verificar_estado.py --check`,
`generar_catalogos_backend.py --check`, table count from `Base.metadata`, Alembic
head, single file in `versions/`. Expected: `12cee57`, 51 tables, 432 passed /
0 skipped, head `559b1a79cb77`, both scripts exit 0. Also confirm in one line
that `docs/notas/consulta-a-ippu.md` is present in the working tree. If anything
differs, STOP and report.

## Step 1 — Three §5 entries (write these FIRST)

House rule §12.6. Measure the next free numbers — do not assume. Format:
`### 5.NN <título> (2026-09-11, Lucas)`, no `(L#)` label (§5.77). These answer
questions 3, 4 and 7 of R1's BLOQUE 6.4. Questions 1, 2, 5 and 6 are NOT decided
here and must not be written.

ENTRY A — The flow engine's default is a HARD 409.
Transcribe this substance: R1 (BLOQUE 2.1, R1-03) found the flow mechanism (the
`excepcion` JSONB) serves both a hard block and a recorded override, and that
only the default was missing. The default is **a hard 409**: the schema's rules
and their integrity are respected, and an out-of-sequence write is rejected
rather than recorded as an exception. This does not close pending question B4
with IPPU — R1 classified B4 as "does not block, but better answered before
fixing the behaviour". If IPPU's answer requires a recorded override, the
mechanism already exists and the default is softened then, in a new entry.
Record the cost being accepted: a 409 that turns out to be wrong makes a técnico
lose work mid-session.

ENTRY B — `tecnico_grupo` is split: the table is built, the assignment rules wait.
Transcribe this substance: §5.79 deferred `tecnico_grupo` to M11.3 and recorded
its sketch as a starting point; B5 and B6 remain unanswered. The work splits.
The **N:M table itself** is structural, its columns are not in dispute, and it is
built in M11.3. The **assignment service and its rules** — who may be assigned,
what a rol means, whether history is needed — depend on B5/B6 and wait.
⚠️ State explicitly that the "at most 2 simultaneous assignments without overlap"
invariant is NOT decided here and is NOT built: see Step 2(b), which records why
the invariant as currently worded cannot be expressed at all.

ENTRY C — The access log with a stated reason (§2.17) is explicitly Fase 4.
Transcribe this substance: §2.17 requires recording who accessed a clinical
record and why. It is a LEGAL requirement, not a nicety. It depends on the user
and authentication model, which is Fase 4, so it is not designed in M11.3. It is
made explicit rather than left implicit precisely so it does not evaporate: it is
registered in §6 as a named pending with **Lucas** as owner, and any Fase 4
design that omits it is incomplete.

Report the three numbers. Nothing else goes into §5.

## Step 2 — Register two findings where they cannot be lost

### (a) R1-01 — the half-reformulated Δ rule

`esquema-datos-v2.md` §4 row 4 (~:725) still states the Δ rule as "Δ sólo B−A",
which §5.36 derogated in favour of "Δ sólo dentro del mismo instrumento" — the old
wording BLOCKS a year-over-year IDEA comparison IPPU explicitly asked for. The
SAME DOCUMENT already uses the new wording at §2.2:788, so it contradicts itself.
`backend/README.md:131` carries the old wording too.

DO NOT FIX IT HERE. Lucas decided it travels with I1, which touches exactly this
ground. Register it in `handoff.md` §6 as a NAMED PREREQUISITE OF I1, citing
R1-01, both file:line locations and §5.36, so whoever opens I1 cannot miss it.
Verify both line numbers yourself.

### (b) The `tecnico_grupo` invariant cannot be expressed as worded — MEASURE and RECORD

§5.79 states that the invariant "a lo sumo dos asignaciones vigentes por grupo,
sin solaparse" cannot be expressed in DDL "without an EXCLUDE constraint with
btree_gist". R1 repeats this in BLOQUE 3.2, 6.1, 6.3 and question 5. **The claim
appears to be wrong and nobody has verified it.** An EXCLUDE constraint is
evaluated PAIRWISE: `EXCLUDE (grupo_id WITH =, periodo WITH &&)` expresses "at
most ONE current assignment", not two. There is no EXCLUDE formulation that
expresses "at most 2". A slot discriminator would give exactly two
(`EXCLUDE (grupo_id WITH =, slot WITH =, periodo WITH &&)`), but §5.79's sketch
has `rol text, SIN CHECK` — a free configurable label, so three rows with three
different labels would satisfy it.

Verify this against the sketch in §5.79 and against the model, then RECORD (do
not fix, do not decide):
- Confirm the sketch's `rol` column is free text with no CHECK and no slot
  semantics.
- Confirm `grupo.tecnico1_id` / `tecnico2_id` still exist and are the source of
  truth — if so, note that the "at most 2" is already structurally guaranteed by
  `grupo` having exactly two columns, and that `tecnico_grupo` is the HISTORY,
  which must be able to record A in March, B in June and A leaving.
- Report where the claim propagated: §5.79, R1's BLOQUE 3.2 / 6.1 / 6.3 /
  question 5, and anywhere else it appears.
§5 and R1 are registers and are NOT corrected. Record the finding in §6 as a
named open point for M11.3 and in this session's bitácora entry, citing §5.83 —
this is the pattern's sixth instance and the first that is a TECHNICAL claim
never verified, rather than a derogated wording that survived.

### (c) The retroactive §5.83 sweep — MEASURE ONLY

§5.83 requires drag-lists to come from grep; it was never applied retroactively.
Grep the whole repo for the derogated formulations of the three decisions that
have them — §5.36 (Δ "B−A"), §5.61 (the four colour group names), §5.79
(`tecnico_grupo` "es M12.8a" / "M12.8a la crea") — and report every surviving
occurrence by file and line. Report the commands you ran, per §5.83. Fix nothing;
record the result in §6 as a costed pending.

## Step 3 — The documentary findings that ARE fixed here

a) R1-04 — `app/models/modulos.py:211`: the `Idea` docstring still OPENS with
   "el IDEA como línea base única". M12.8b-2 added the §5.36 warning at :213-221
   but left the first line, so the docstring contradicts its own warning.
   Rewrite the opening line to state what §5.36 decided (the IDEA is annual) and
   keep the marker and the I1 pointer intact. This is also R0's D-12.
b) R1-05 — `app/models/pai.py:146` and `:568`: both point at
   `puntos-a-validar.md` §2.15 as an "open tension". §2.15 was RESOLVED by §5.57
   (salida 2). Correct both pointers to cite the resolution.
c) R1-10 — `backend/README.md:131`: lists only 4 hard rules and states the Δ with
   the derogated wording. ⚠️ Do NOT rewrite the Δ wording — that belongs to I1
   per Step 2(a). Fix the COUNT: measure how many hard rules §4 of
   `esquema-datos-v2.md` carries now (M12.8b-1b added two PAI rows) and correct
   the README, leaving the Δ row flagged with a pointer to R1-01.

HARD LIMITS for (a) and (b): DOCSTRINGS AND COMMENTS ONLY. No column, no
constraint, no default, no import, no name. `pytest` and both `--check` must be
identical to Step 0 and `test_la_migracion_coincide_con_los_modelos` stays green.

## Step 4 — Archive the resolved tail of §6

R1's PARTE C measured Lucas's condition: **no external file cites a resolved §6
bullet by position → archiving causes zero rework.** RE-MEASURE before acting; if
any external citation now exists, STOP and report rather than moving that bullet.

- Move the `[x]` resolved bullets (~40 bullets, ~173 lines, ~39 % of §6) to
  `docs/pendientes-resueltos.md`, or to a clearly-named section of an existing
  document if the repo's conventions suggest better; say what you chose and why.
- Use the stub technique proved in M12.8b-4: §6 keeps a short redirect naming
  where the tail went, the date and the deciding context, so "§6" citations still
  resolve.
- The move is VERBATIM. Resolved bullets carry stale figures; they stay stale.
  Verify byte-for-byte with a checksum AFTER your last write to both files
  (rule 4).
- Report §6's before/after line count.

Note in your report whether you think this needs its own §5 entry; if you do, say
so and do not write it.

## Step 5 — Two small measurements (no action)

a) Grep for statements asserting **Heroku** as THE deployment host rather than one
   possibility. Lucas's position: Heroku is a possible host, not a fact. Report
   every place that states it as settled, by file and line. Fix nothing.
b) Report, measured rather than copied, what remains of M12: the close of M12.8
   (regenerate `app/data/catalogos_iniciales.json` from
   `docs/prototipo-v4/prototipo-v4-catalogos.json` via
   `generar_catalogos_backend.py`, plus tests — per PLAN-M12 §M12.8, NOT the
   M11.5 clinical mirror seed), and the deferred vocabulary pass. State what
   `--check` says today about whether the catalogue file is already in sync,
   since that determines how much work closing M12.8 actually is.

## Step 6 — Close

- Re-run `pytest -q` and both `--check`. Report against Step 0. `pytest` must be
  identical.
- Write this session's entry in `docs/bitacora.md`, newest-first, matching the
  established native format. Include: the three §5 numbers, the R1-01
  registration, the invariant finding from Step 2(b), the retroactive sweep
  results, and the §6 before/after.
- Per §5.82, update the `handoff.md` header: date, session name, measured figures,
  and what remains of M12 (close of M12.8 → then I1 → then M11.3, vocabulary pass
  deferred).
- §6: mark M12.8b-3a done; register the deferred vocabulary pass as M12.8b-3b
  with the reason; register Entry C's §2.17 pending with Lucas as owner; register
  the invariant finding and the retroactive sweep as named pendings.
- AFTER your last write to `docs/bitacora.md`, verify its integrity: entry count,
  every entry still has its header line, pre-existing entries unchanged against
  `12cee57`.
- Save this prompt verbatim to `docs/prompts/` under the session name, per the
  convention now being adopted. Do not edit it — it is a register from birth.
- Commit split suggested: (1) the three §5 entries, (2) the Step 3 code-comment
  fixes, (3) the §6 archive, (4) the closing register. Your call; say what you did.
- Push to `gitlab` and `origin`; verify both at the same hash and the tree clean.
- Final report: what changed, what you measured, what you verified as already
  correct, what you found and did NOT fix with file and line, and anything in this
  prompt that did not survive contact with the repository — including any figure I
  carried over from R1's report without verifying it myself.