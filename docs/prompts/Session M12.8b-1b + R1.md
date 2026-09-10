# Session M12.8b-1b + R1 — the HCE-PAI schema section, then the M11.3 reconnaissance

Repository: IPPU × UTEC-LIDIA, branch `main`.
Backend at `implementacion/L1-hce-idea/backend/`.

M12.8b-4 closed at `bdca401`: the bitácora now lives in `docs/bitacora.md` and
`handoff.md` is 3.139 lines. This session has two halves that share nothing but
a starting measurement:

  PART A (M12.8b-1b) — write the HCE-PAI section of `esquema-datos-v2.md`, the
  last documentary hole of M12.8b. It WRITES a document.
  PART B (R1) — the reconnaissance that precedes M11.3, owned by Lucas (§5.67).
  It is READ-ONLY and ends in a report. It designs nothing and builds nothing.

NEITHER PART TOUCHES CODE. `pytest` and both `--check` must be identical at close.

It does NOT do the vocabulary pass (M12.8b-3), does NOT regenerate the catalogue
seed (the rest of M12.8), does NOT move §5, and does NOT archive anything in §6 —
it only MEASURES the archive (Part C).

## Ground rules

1. MEASURE BEFORE YOU WRITE. Every number comes from something you measured
   here. In Part B this is not a style rule, it is the deliverable: an R1 that
   reports what documents claim rather than what code does is worthless.
2. `handoff.md` §5 is APPEND-ONLY, and THIS SESSION OPENS NO §5 ENTRY. If Part B
   surfaces something that needs deciding — it probably will — RECORD IT AS A
   FINDING and stop there. §12.6: the decision is written before the change, and
   it is Lucas's to write, not yours. An R1 that decides is an R1 nobody can
   trust.
3. REGISTERS ARE NEVER CORRECTED: `docs/bitacora.md`,
   `docs/notas/respuestas-reunion-ippu-2026-08-21.md`,
   `docs/notas/consulta-a-ippu.md`, `docs/notas/relevamiento-*`, `docs/prompts/`.
   Working notes (`puntos-a-validar.md`, `preguntas-ippu.md`) and `handoff.md`
   §6 ARE updated.
4. INTEGRITY CHECKS RUN LAST. M12.8b-4 verified a byte-identical move in its
   step 2, then lost a line writing its own entry in step 7 and only caught it
   because it re-ran the check on its own initiative. Any verification you do,
   do it AFTER your final write to that file.
5. Conventional commits, Spanish body, co-authorship trailer (§5.62).
6. If context runs short, STOP CLEANLY AT THE END OF PART A: commit it, write
   the register entry, push, and report that Part B did not run. A truncated
   reconnaissance is worse than no reconnaissance. Do not compress Part B to
   make it fit.

## Step 0 — Starting point

Measure and report: current commit and clean tree, both remotes at the same
hash, Docker up, `pytest -q`, `verificar_estado.py --check`,
`generar_catalogos_backend.py --check`, table count from `Base.metadata`,
Alembic head, single file in `versions/`. Expected: `bdca401`, 51 tables, 432
passed / 0 skipped, head `559b1a79cb77`, both scripts exit 0. If anything
differs, STOP and report.

---

# PART A — M12.8b-1b: the HCE-PAI section of `esquema-datos-v2.md`

M12.6 built HCE-PAI in SCHEMA-ONLY mode (§5.54) and the schema document still
carries only a placeholder where its section should be. M12.8b-1 reported the
shape as 8 tables / 81 columns — VERIFY THAT, do not inherit it.

## Step A1 — Measure the module before describing it

From the MODELS and the migration, not from any .md:
- Which tables belong to HCE-PAI, their exact names, and the column count of
  each. Report the totals and say whether they match the reported 8 / 81.
- Every FK, unique constraint, CHECK, index, default, nullability and enum-like
  domain. Where a domain is documentation-only (no CHECK), say so explicitly —
  M12.8b-2 had to correct exactly that mistake for `grupos_orientados`.
- Which tables carry `creado_en` / `actualizado_en` (measured at 3 of 51 as of
  M12.8b-2: `hce_diurna`, `inclusion`, `pai` — re-verify).
- Any XOR or polymorphic pattern (§5.25 modelled one for attachments).

## Step A2 — Write the section

Follow the structure the document already uses for HCE-INC, HCE-SEV and the
other modules: same heading depth, same table layout, same column order, same
way of stating rationale. READ AN EXISTING MODULE SECTION FIRST and match it.
Do not invent a new format for this one.

The section must carry, besides the tables:
- The decisions that shaped the module, cited as §5.NN — at minimum §5.22,
  §5.26, §5.50 and §5.54, but MEASURE which ones actually apply rather than
  copying this list.
- ⚠️ The explicit statement that HCE-PAI has NO GUARDS: the sequence, the
  signature-blocks rule and the review gate are M11.3 (§5.71). A reader must not
  conclude from this section that the module enforces anything.
- The two Manual sections still unidentified — §4 and §8 — with a pointer to
  `puntos-a-validar.md` §1.16. State it as a known hole, not as an omission.
- Whatever the surrounding sections carry that I have not listed; the model is
  the document itself.

## Step A3 — Versioning and cross-references

- The document is at v3 and the FILENAME does not change (§5.81). Check how the
  document records its own version and revision history and follow ITS
  convention — do not invent a v3.1 unless the document already works that way.
  Report what you found.
- Update the document's index / table of contents / table inventory if it has
  one, so the counts still match after the section lands.
- Grep the repo for anything that says the HCE-PAI section is pending or is a
  placeholder, and correct those statements. `handoff.md` §6 has at least one.

---

# PART B — R1: reconnaissance for M11.3 (READ-ONLY)

Scope agreed with Lucas: **read-only, ending in a report; implementation starts
FROM the report, not inside it.** Write no model, no service, no router, no
schema, no test, no migration. If you find yourself about to design a solution,
that is the boundary — record the problem and move on.

Precedent to follow: R0 (`docs/notas/relevamiento-estado-2026-08-26.md`),
organised in BLOQUES with numbered findings. Match its format.

## Step B1 — What exists today

Measure, with commands, not impressions:
- `app/routers/`, `app/schemas/`, `app/services/` — what exists, what is empty,
  what endpoints are actually registered on the app. R0 measured 0 routers,
  0 schemas, 0 services and a single `/health`. Re-measure; it may have moved.
- Where any business rule currently lives: in a model, in a CHECK, in a test, in
  a docstring, or only in prose. For each rule in Step B2, name the FILE and
  LINE or state that it exists nowhere but prose.

## Step B2 — The §4 rules of the schema, one by one

For each: what the schema says, what the code does today, and what the gap is.
- Sequence between instruments.
- Signature blocks editing (firma = bloqueo).
- **Δ only within the same instrument** — reformulated by §5.36, which recorded
  that the earlier "Δ sólo B−A" formulation BLOCKED a comparison IPPU explicitly
  asked for. Report what the reformulated rule requires that the code lacks.
- Baremo derived only from `pct`.
- Photos / §8.4.
- The "revisado por dirección → entregado" gate for DIVULGACIÓN (§5.71, §2.13).

## Step B3 — What the §5.8 gate assumed, and what the L series changed

- §5.8 opened the backend on a set of assumptions. State which ones the code
  still rests on and which the subsequent decisions invalidated.
- Walk the decisions that land on M11.3 and say, for each, whether it is
  implementable today or blocked: at minimum §5.36 (annual IDEA), §5.41
  (users, roles, assignment), §5.67, §5.71, §5.72 (role vocabulary and
  permission matrix), §5.79 (`tecnico_grupo` and its assignment service).
  MEASURE the list — do not trust mine.

## Step B4 — I1 (`idea.anio`), re-measured

I1 is the only live entry under "DECIDIDO, SIN IMPLEMENTAR" and §5.35 puts its
gate BEFORE M11.3. Its cost was measured twice (§5.31 and R0) as purely additive
in the backend and expensive in the demo. Re-measure both sides now:
- Backend: FKs affected, tests affected, whether `anio` nullable still breaks
  nothing.
- The "which IDEA is in force" rule — §5.36 assigned its reformulation to M11.3.
  Say where that rule lives today (`app/models/modulos.py` ~:219 carries a
  marker M12.8b-2 left) and what reformulating it would touch.
- Demo: count the actual usages, by file. The figure in circulation is ~18 uses
  across 6 modules; verify it.
Report whether I1 should land before or inside M11.3. RECOMMEND, do not decide.

## Step B5 — What blocks M11.3 from outside

- Block B of `docs/notas/preguntas-ippu.md` is defined as "bloquea M11.3".
  Go through it and say, for each, what exactly it blocks and whether M11.3 can
  start without it.
- `puntos-a-validar.md` §2.8 (no way to open a new year of groups) — R0 called
  it a blocking hole. Re-measure whether it still is.
- Manual §4 and §8, still unidentified (`puntos-a-validar.md` §1.16).

## Step B6 — Write the report

`docs/notas/relevamiento-M11.3-2026-09-09.md` (match R0's actual naming
convention — check it and follow it). Structured in BLOQUES, findings numbered
so they can be cited from §5 and §6 later. It must end with:
- What M11.3 can start on TODAY, in order.
- What is blocked and by what.
- Every question that needs a decision from Lucas before code is written,
  phrased as a question, not as a proposal.

This file is a `relevamiento-*` and therefore a register from birth (rule 3): it
is never corrected afterwards. Say so in its header.

---

# PART C — Measure the §6 archive (measure only, no move)

Lucas approved archiving the resolved tail of §6, **on the condition that it
causes no rework** — nothing moves if something else points at it. So: measure
the citation exposure, move nothing.

- Count `[ ]` open vs `[x]` resolved bullets in §6 and the lines each group
  occupies (40 / 40 and ~40 % of lines at last measurement — re-measure).
- For the resolved bullets: **which of them are referenced from outside §6** —
  from `docs/`, `app/`, `tests/`, `demo/`, `CLAUDE.md`, `docs/bitacora.md`.
  Report the count and the specific bullets that ARE cited, since those are the
  ones that would cause rework.
- Say whether the `## 13.` stub technique proved in M12.8b-4 would cover them.
- Record the figures in §6 itself, alongside the "Partir `handoff.md`" pending.

RECOMMEND NOTHING. Lucas decides whether the archive is one session or three.

---

# Step Z — Close

- Re-run `pytest -q` and both `--check`. Report against Step 0. All must be
  IDENTICAL — this session touches no code. If `verificar_estado.py` changes
  state, explain why before committing.
- Write this session's entry in `docs/bitacora.md` (newest-first, matching the
  native entry M12.8b-4 established): measured start, per-part record, close
  verification, commit hashes.
- Per §5.82, update the `handoff.md` header: date, session name, measured
  figures.
- §6: mark M12.8b-1b done. State plainly what remains of M12 — M12.8b-3 (the
  vocabulary pass) and the close of M12.8, which per M12.8b-4's reading of
  PLAN-M12 §M12.8 is regenerating `app/data/catalogos_iniciales.json` from
  `docs/prototipo-v4/prototipo-v4-catalogos.json` plus tests, and is NOT the
  M11.5 clinical mirror seed. Register R1's report by path. Do not mark M12.8b
  as a whole done until M12.8b-3 lands.
- AFTER your last write to `docs/bitacora.md`, and only then, verify the file's
  integrity: entry count, that every entry still has its header line, and that
  the pre-existing entries are unchanged against `bdca401`. Rule 4 exists
  because this is where the last session broke.
- Commit split suggested: (1) Part A, (2) Part B's report, (3) the closing
  register and §6 updates. Your call; say what you did.
- Push to `gitlab` and `origin`; verify both at the same hash and the tree clean.
- Final report: what changed, what you measured, what you verified as already
  correct, what you found and did NOT fix with file and line, every question
  Part B raised that needs Lucas, and anything in this prompt that did not
  survive contact with the repository — including any figure I carried over from
  a previous report without verifying it myself. That section has been the most
  useful output of the last five sessions.