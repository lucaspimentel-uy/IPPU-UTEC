# Session M12.8-cierre + I1 — close M12, then add idea.anio

Repository: IPPU × UTEC-LIDIA, branch `main`.
Backend at `implementacion/L1-hce-idea/backend/`.

M12.8b-3a-bis closed at `dad05ef`. This session has two parts and WRITES CODE.

  PART A — close M12.8, and with it the M12 round.
  PART B — I1: add `idea.anio`, per §5.91 (I1 lands before `app/services/` opens).

CHECKPOINT between them: Part A commits and pushes on its own. If Part A turns
out larger than measured, STOP THERE, report, and do not start Part B. M12
closing correctly matters more than both landing in one session.

Migration policy, decided by Lucas: **single regenerated migration**, per §5.19.
`versions/` keeps ONE file. Regenerate with the usual clean rebuild (drop schema →
`alembic upgrade head` → `python -m app.seed_catalogos`) at the end of EACH part.

## Ground rules

1. MEASURE BEFORE YOU WRITE.
2. `handoff.md` §5 is APPEND-ONLY, and THIS SESSION OPENS NO §5 ENTRY. If
   something needs deciding — Part B raises one deliberately — RECORD IT AS A
   QUESTION and stop there (§12.6).
3. REGISTERS ARE NEVER CORRECTED: `docs/bitacora.md`, `docs/notas/relevamiento-*`,
   `docs/prompts/`, `docs/pendientes-resueltos.md`, `docs/notas/consulta-a-ippu.md`,
   `docs/notas/respuestas-reunion-ippu-2026-08-21.md`, the meeting agendas, and
   `PLAN-M12` itself (it is a plan, amended by §5 entries, not rewritten here).
4. INTEGRITY CHECKS RUN LAST.
5. Conventional commits, Spanish body, co-authorship trailer (§5.62).
6. Closing the round is NOT a deadline. There is no production data.

## Step 0 — Starting point

Measure and report: commit and clean tree, both remotes at the same hash, Docker
up, `pytest -q`, `verificar_estado.py --check`,
`generar_catalogos_backend.py --check`, table count from `Base.metadata`, Alembic
head, single file in `versions/`. Expected: `dad05ef`, 51 tables, 432 passed /
0 skipped, head `559b1a79cb77`, both exit 0. Confirm the last §5 entry is §5.91.
If anything differs, STOP.

---

# PART A — Close M12.8

## Step A1 — Measure what M12.8 actually requires, BEFORE doing any of it

⚠️ A previous session concluded from `generar_catalogos_backend.py --check`
returning "al día" that M12.8 needed no catalogue work. THAT INFERENCE WAS WRONG:
`--check` verifies the generated JSON matches what the generator produces TODAY;
it says nothing about whether `DESDE_LA_DEMO` is empty. Do not repeat it.

Read `docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md` §M12.8 and produce
a checklist of ITS items with the measured state of each. At minimum:
- `DESDE_LA_DEMO` in `herramientas/generar_catalogos_backend.py` — print the list
  and its length. The repo states `categoria_documento` is still in it
  (`esquema-datos-v2.md:513`); verify and report everything else that is.
- `solo_al_crear` in `app/seed_catalogos.py` — which catalogues it covers today
  and which of M12.3–M12.7 it does not.
- FK index coverage: FKs without a backing index must be 0. Measure.
- `Numeric` columns annotated `Decimal`, not `float`. Measure.
- Tests: the 21 from M11.2 plus each module's. For each guard, whether the
  rejection case is tested TOGETHER WITH its passing case.
- The §12-A acceptance criterion in prose (D-6 / §5.65). ⚠️ Its EXECUTABLE form
  is M11.5, not here. Report whether the prose exists and where.
- The docs list (`esquema-datos-v2.md` at v3, `backend/README.md`, `CLAUDE.md`,
  `handoff.md` §6 + header, `docs/bitacora.md`, `docs/estructura-repositorio.md`).
- ⚠️ Items the plan assigns to M12.8 that later §5 entries MOVED — §5.72
  (`tecnico_grupo`) went to M11.3 by §5.79, and §5.64 says the "fase" vocabulary
  is NOT closed here. Name every such item so nobody builds work that was
  reassigned.

REPORT THE CHECKLIST BEFORE ACTING. If it is materially larger than the steps
below, say so and ask rather than improvising.

## Step A2 — Empty `DESDE_LA_DEMO`

For each section still in that list, move its source from the demo to the
Prototipo v4 (`docs/prototipo-v4/prototipo-v4-catalogos.json`) so the generator
produces it, then empty the list. `categoria_documento` is the one the repo names
explicitly; handle whatever else you measured.

- `app/data/catalogos_iniciales.json` is NEVER hand-edited — it is generated.
- Respect `solo_al_crear`: baremo cut-offs, IDEA band cut-offs, disabled
  reminders, the workshop catalogue and the centre catalogue are institution
  fields — written on insert, never overwritten on re-seed. `grupo` additionally
  uses `solo_insertar`.
- If a section has NO source in the Prototipo v4, do NOT invent one. Report it
  and leave that section where it is — inventing catalogue content is exactly the
  failure §5.37 recorded.
- After: `generar_catalogos_backend.py --check` must exit 0, and the list must be
  empty. Report both.

⚠️ `categoria_documento` changes seed DATA, so a document currently using "Otro"
may map to a real category. Say what changed and whether any test asserts on the
old values.

## Step A3 — Extend `solo_al_crear` to the M12.3–M12.7 catalogues

The plan states this is what remains: the mechanism has existed in
`app/seed_catalogos.py` since 2026-08-07 and M12.1 extended it to bands, Δ and
groups. Extend it to the catalogues introduced by M12.3 through M12.7, per the
measurement in Step A1.

Prove it: a test that re-runs the seed and asserts an institution field modified
after insert is NOT overwritten. If such a test already exists, say so and extend
it rather than duplicating.

## Step A4 — The verifications the plan asks for

- FKs without a backing index: must be 0. If not, add the indices and say which.
- `Numeric` columns annotated `Decimal`. Fix any that are not; report.
- For each guard introduced by M12.1–M12.7, confirm the rejection case is tested
  alongside its passing case. Report gaps; fill the cheap ones and list the rest
  rather than silently leaving them.

## Step A5 — The §12-A acceptance criterion in prose (D-6 / §5.65)

If Step A1 found the prose already written, verify it still matches the round as
built (four modules, six bands, fourteen workshops) and fix only what the round
changed. If it does NOT exist, write it — in prose, in the document the repo's
conventions indicate, stating explicitly that its executable form is M11.5 and
that the numbers 58 · 60 · 79 · Δ +19 currently live in `demo/js/`.

Do not build a seed espejo. It is M11.5's (§5.91's sibling boundary), and
M12.8's seed is the catalogue seed, not the clinical mirror.

## Step A6 — Regenerate the migration and close M12

- Clean rebuild: drop schema → `alembic upgrade head` →
  `python -m app.seed_catalogos`. ONE file in `versions/`.
- `pytest -q` — report the new count against Step 0 and explain every delta.
  `test_la_migracion_coincide_con_los_modelos` must be green.
- Both `--check` exit 0.
- Update the docs the plan lists. `handoff.md` §6: mark M12.8 done and
  ⚠️ **state plainly whether M12 as a round is CLOSED**, with the one exception
  registered — M12.8b-3b, the deferred vocabulary pass. If anything else remains,
  M12 is not closed; say so rather than declaring it.
- COMMIT AND PUSH Part A before starting Part B.

---

# CHECKPOINT

Report Part A's result. If it ran long, or if Step A1's checklist turned out
larger than these steps, STOP HERE. Part B is a separate, well-bounded piece and
loses nothing by waiting.

---

# PART B — I1: `idea.anio`

§5.91: I1's backend half lands BEFORE `app/services/` opens. R1's BLOQUE 4
measured the cost as purely additive: `idea` has 23 columns and no `anio`,
0 UNIQUE over `hce_id`, 1 incoming FK per instance (0 to reconnect), 9 `Idea(`
constructions in tests, 0 broken with `anio` nullable. Re-measure before trusting.

## Step B1 — Add the column and its UNIQUE

§5.36 already specified both, and it is not reopened here: `anio` +
`UniqueConstraint("hce_id", "anio")`. IPPU's answer behind it, recorded in §5.36:
the IDEA is done ONCE A YEAR, ALWAYS, and each year's is compared against the
previous year's — confirmed twice, at the 2026-08-26 meeting and in writing by
Fernando Sierra on 15/06 (questionnaire P10 "Anual", P12 "las evaluaciones
aparecen por año").

- `anio` on `idea`, typed as `grupo.anio` is typed — CHECK IT and follow; do not
  invent a different type.
- `UniqueConstraint("hce_id", "anio")`. §5.36 notes this is the pattern the schema
  already uses three times: `uq_informe_cierre_hce_anio`,
  `uq_protocolo_hce_tipo_anio`, `uq_grupo_nombre_anio`. MEASURE those three and
  follow their naming and declaration style exactly — the new one should be
  indistinguishable in form.

⚠️ NULLABILITY — resolve this explicitly, do not let it slide. R1 measured that
`anio` NULLABLE breaks none of the 9 existing `Idea(` constructions in tests. But
with the UNIQUE in place, nullable is a half-constraint: Postgres does not treat
two NULLs as equal, so the same `hce_id` could hold any number of rows with
`anio IS NULL` — the constraint would fail to protect precisely the rows that
were loaded without a year. Measure and report before choosing:
  (a) how many of the 9 `Idea(` constructions would need an `anio` argument if the
      column were NOT NULL, and whether the seed creates any `idea` row;
  (b) whether the repo's three existing `*_anio` patterns declare their `anio`
      NOT NULL — follow the house answer if there is one, and say what it is.
If NOT NULL costs only adding `anio=` to a handful of test constructions and the
house pattern is NOT NULL, do that — it is the form §5.36's rule actually
describes ("una vez al año, siempre"). If the measurement says otherwise, keep it
nullable, SAY SO, and record the gap as a named pending rather than leaving the
constraint quietly toothless.

Report what you chose and the measurement behind it.

## Step B2 — What I1 does NOT do (§5.91, explicitly)

- ⚠️ Do NOT rewrite the rule "la vigente es la de mayor `fecha_consenso`"
  (`app/models/modulos.py` ~:229). §5.36 assigned its reformulation to M11.3 and
  it depends on B2(b)/B10. KEEP the marker M12.8b-2 left at ~:213-221 and update
  it only to say the column now exists.
- Do NOT touch the demo. Its half is 17 direct uses plus 1 indirect across 6
  modules (R1) and belongs to the demo round.
- Do NOT open `app/services/`, write a router, or implement the "qué IDEA rige"
  guard. The column is the prerequisite for that guard; it is not the guard.

## Step B3 — The Δ rule (R1-01), registered in §6 as I1's named prerequisite

`esquema-datos-v2.md` §4 row 4 still states "Δ sólo B−A"; §5.36 derogated it in
favour of "Δ sólo dentro del mismo instrumento" — the old wording BLOCKS a
year-over-year IDEA comparison IPPU explicitly asked for, which is precisely what
`anio` enables. The same document already uses the new wording (M12.8b-3a-bis
measured it at `esquema-datos-v2.md:790`, not :788). `backend/README.md:131`
carries the old wording too.

Fix both. VERIFY the line numbers yourself. Keep whatever §4's row format
requires; do not restructure the table.

## Step B4 — Tests and migration

- Tests for `anio`: at minimum that an `Idea` without `anio` is still valid
  (nothing existing breaks), and that one with `anio` round-trips. If the repo's
  test conventions ask for more for a new column, follow them.
- Regenerate the single migration: drop schema → `alembic upgrade head` →
  `python -m app.seed_catalogos`. ONE file in `versions/`.
- `pytest -q` — report the count and explain every delta.
  `test_la_migracion_coincide_con_los_modelos` green. Both `--check` exit 0.

---

# Step Z — Close

- Report final `pytest`, both `--check`, table count, Alembic head, single file
  in `versions/`.
- `docs/bitacora.md`: one entry covering both parts, newest-first, in the
  established format — measured start, Step A1's checklist with its measured
  state, what Part A changed, the checkpoint result, what Part B changed, the
  `UNIQUE(hce_id, anio)` question, close verification, commit hashes.
  ⚠️ Record that this session's Step A1 exists because a previous conclusion
  ("--check verde ⇒ M12.8 needs no catalogue work") over-generalised a true
  verification. Same shape as the §6 bullet M12.8b-3a-bis corrected.
- Per §5.82, update the `handoff.md` header: date, session name, measured figures,
  whether M12 is closed, and what comes next (M11.3, with M12.8b-3b deferred and
  the demo round pending).
- §6: mark M12.8 and I1 done; close I1's entry under "DECIDIDO, SIN IMPLEMENTAR"
  — it should be the last one there, so say whether that section is now empty.
- Save this prompt verbatim to `docs/prompts/` under the session name.
- AFTER your last write to `docs/bitacora.md`, verify its integrity: entry count,
  every entry keeps its header line, pre-existing entries unchanged against
  `dad05ef`.
- Push to `gitlab` and `origin`; verify both at the same hash and the tree clean.
- Final report: what changed, what you measured, what you verified as already
  correct, what you found and did NOT fix with file and line, every question that
  needs Lucas, and anything in this prompt that did not survive contact with the
  repository — including any figure I carried over from a plan or a previous
  report without verifying it myself.