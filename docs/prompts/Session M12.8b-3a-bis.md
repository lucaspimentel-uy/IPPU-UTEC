# Session M12.8b-3a-bis — transcribe the three missing decisions

Repository: IPPU × UTEC-LIDIA, branch `main`.
Backend at `implementacion/L1-hce-idea/backend/`.

M12.8b-3a closed at `8f3a8aa` and wrote §5.86–§5.88. Three further decisions
Lucas took in the same round never reached the repository — they exist only in a
chat transcript, which is exactly the failure mode §5.83 was written about. This
session transcribes them and corrects one §6 bullet that the measurements of
R1 and M12.8b-3a made false.

IT TOUCHES NO CODE AT ALL. `pytest` and both `--check` must be identical at close.
It does not implement I1, does not open `app/services/`, does not touch `demo/`,
and does not do the deferred vocabulary pass (M12.8b-3b).

## Ground rules

1. MEASURE BEFORE YOU WRITE.
2. `handoff.md` §5 is APPEND-ONLY.
   ⚠️ BOUNDED EXCEPTION: Step 1 writes THREE new §5 entries, dictated below in
   substance. Lucas decided them; you transcribe, you do not decide. If any
   contradicts something already in §5, STOP and report.
3. REGISTERS ARE NEVER CORRECTED: `docs/bitacora.md`, `docs/notas/relevamiento-*`
   (R0 and R1), `docs/prompts/`, `docs/pendientes-resueltos.md`,
   `docs/notas/consulta-a-ippu.md`,
   `docs/notas/respuestas-reunion-ippu-2026-08-21.md`, the meeting agendas.
   Working notes and `handoff.md` §6 ARE updated.
4. INTEGRITY CHECKS RUN LAST.
5. Conventional commits, Spanish body, co-authorship trailer (§5.62).

## Step 0 — Starting point

Measure and report: commit and clean tree, both remotes at the same hash, Docker
up, `pytest -q`, `verificar_estado.py --check`,
`generar_catalogos_backend.py --check`, table count from `Base.metadata`, Alembic
head, single file in `versions/`. Expected: `8f3a8aa`, 51 tables, 432 passed /
0 skipped, head `559b1a79cb77`, both scripts exit 0. If anything differs, STOP.

Confirm the last §5 entry is §5.88 and report the numbers you will use.

## Step 1 — Three §5 entries

Format: `### 5.NN <título> (2026-09-11, Lucas)`, no `(L#)` label (§5.77).

ENTRY D — `btree_gist` does not enter; the `tecnico_grupo` invariant waits for
B5/B6.
Transcribe this substance: §5.79 stated that the invariant "a lo sumo dos
asignaciones vigentes por grupo, sin solaparse" required an `EXCLUDE` constraint
with `btree_gist` — the repo's first Postgres extension — and left it as a
decision for M11.3. R1 carried the claim forward (BLOQUE 3.2, 6.1, 6.3,
question 5). The decision is that **`btree_gist` does NOT enter, now or as a
pending for M11.3**, and the reason is not cost: the invariant as worded cannot
be expressed by the mechanism proposed for it. An `EXCLUDE` constraint is
evaluated PAIRWISE, so `EXCLUDE (grupo_id WITH =, periodo WITH &&)` expresses
"at most ONE current assignment", not two, and no `EXCLUDE` formulation
expresses "at most 2". A slot discriminator would give exactly two, but §5.79's
own sketch defines `rol` as free text with no CHECK, so three rows with three
different labels satisfy it. Moreover `grupo.tecnico1_id` / `tecnico2_id` remain
the source of truth (§5.79), so "at most 2" is already structurally guaranteed by
`grupo` carrying exactly two columns; `tecnico_grupo` is the HISTORY, and a
history must be able to record A in March, B in June and A leaving — precisely
what a no-overlap constraint would forbid. The invariant is therefore LEFT
UNDEFINED until **B5** (roles: closed list or free label?) and **B6** (is
assignment history needed at all?) are answered, since those determine whether
the table has named slots or a flat N:M and therefore what invariant it has. If
the answers produce named slots,
`EXCLUDE (grupo_id WITH =, slot WITH =, periodo WITH &&)` with `btree_gist`
becomes the correct tool and enters then, correctly stated. Registered as a named
pending for the session that processes B5/B6.
⚠️ This does NOT correct §5.79 or R1 — both are registers. It supersedes §5.79's
framing going forward. M12.8b-3a already recorded where the unverified claim
propagated.

ENTRY E — Administration (§2.8 / §2.9 / §2.11) is its own sub-module, after
M11.3's core.
Transcribe this substance: R0 marked `puntos-a-validar.md` §2.8 ("no way to open
a new year of groups") as "⚠️ AHORA BLOQUEA". R1-07 re-measured and the label
does not hold: §2.8's own fine print (`puntos-a-validar.md:735`) already said it
blocks nothing today, the five real groups are seeded with `anio=2026`, and the
4→5 rename was done by M12.8a-1 (§5.61). What remains of §2.8 is creating and
renaming groups FROM THE APPLICATION, which R1 places on the same screen as §2.9
(workshop and centre catalogues) and §2.11 (users). The decision: **that screen
is its own sub-module, built AFTER M11.3's core.** It is administration, not
clinical work, and it depends on the user and role model, which is Fase 4. R1's
BLOQUE 5.1 measured that none of the twelve block-B questions blocks M11.3's core
(sequence, firma=bloqueo, §4.3 validations, baremo from `pct`, photos §8.4,
immutable history, field audit, the D7 consensus guard), so the core starts
without this. Record what the sub-module must carry when built: group creation
and renaming, técnico assignment, catalogue administration (§2.9), users (§2.11),
and HCE-LOG entries with `hce_id NULL` for actions not tied to one NNA. Its
number and its placement relative to M11.4 are not decided here.
⚠️ R0 is a register and is not corrected; this supersedes its label going forward.

ENTRY F — I1 (`idea.anio`) lands BEFORE `app/services/` opens.
Transcribe this substance: §5.35 placed I1's gate before M11.3 and §5.36
established the IDEA is annual, but I1 has remained the only live entry under
"DECIDIDO, SIN IMPLEMENTAR". R1's BLOQUE 4 re-measured the cost against
`Base.metadata` and the tests: `idea` has 23 columns and no `anio`, 0 UNIQUE over
`hce_id`, 1 incoming FK per instance (0 to reconnect), 9 `Idea(` constructions in
tests and 0 broken with `anio` nullable — purely additive. It also confirmed that
the guard "qué IDEA rige a la fecha" CANNOT BE WRITTEN without the column, and
that §5.8 overestimated the cost (`idea` was already 1:N without a UNIQUE on
`hce_id`). Decision: **I1's backend half lands as its own work, BEFORE
`app/services/` is opened**, carrying with it the correction of the Δ rule in
`esquema-datos-v2.md` §4 row 4 and `backend/README.md:131`, already registered in
§6 as its named prerequisite (R1-01).
Two things are explicitly NOT part of I1, so they cannot be absorbed by mistake:
(a) the demo half — 17 direct uses plus 1 indirect across 6 modules, measured by
R1 — goes to the demo round; (b) the reformulation of "la vigente es la de mayor
`fecha_consenso`" that §5.36 assigned to M11.3 stays assigned there, because it
depends on B2(b) and B10, which IPPU has not answered. I1 adds the column and
keeps the marker in `app/models/modulos.py`; it does not rewrite the rule.

Report the three numbers.

## Step 2 — Correct the §6 bullet on creating groups from the application

The bullet titled "Crear grupos desde la aplicación — pasó de hueco anotado a
BLOQUEANTE" (§5.37 / I2 · `puntos-a-validar.md` §2.8) is false in three ways.
Locate it by content and verify each claim before rewriting:

a) "Los cuatro nombres por color están mal … Corregir los nombres es exactamente
   la operación que no se puede hacer." The rename WAS done by M12.8a-1 (§5.61,
   marked `[x]` in §6) and R1 verified the database holds the five real names
   with `anio=2026`. RE-MEASURE IT YOURSELF (`SELECT nombre, anio FROM grupo`)
   and write what you measure.
b) The `taller.grupos_orientados` domain note — corrected by M12.8b-2. Verify
   against the model and the schema document before restating it.
c) The "BLOQUEANTE" label — superseded by ENTRY E. Rewrite the bullet to state
   what actually remains: creating and renaming groups from the application, as
   part of the administration sub-module, after M11.3's core.

⚠️ PRESERVE what this bullet is the only record of, including the fact that the
seed is insert-only over `grupo`. If preserving is easier by splitting the bullet
in two, do that rather than compressing and losing something.

Also record, in your report, the observation behind this correction: the bullet's
claim that correcting the names "is the operation that cannot be done" was true of
the DATABASE and was over-generalised to everything — which is a plausible reason
three sweeps skipped `demo/`, where the names are hardcoded and editable. That
observation goes in the report and the bitácora, not into §5.

## Step 3 — Register the demo occurrence in §6, with an owner

M12.8b-3a's retroactive sweep found `demo/js/grupos-usuario.js:14-16` asserting
the four colour names derogated by §5.61, and reported it without registering it.
This is the one surviving occurrence that IPPU CAN SEE — it is in the demo, not
in a comment.

Register it in §6 as a named pending: file and lines (VERIFY THEM), what it
asserts, that §5.61 derogated it, that it belongs to the DEMO ROUND alongside the
three presentation desynchronisations already listed there, and **Lucas as owner**.

DO NOT FIX IT. Those names may be lookup keys rather than display labels, and
changing them without visual verification in a browser risks breaking the screen.
Note that reasoning in the pending so the demo round does not treat it as a
trivial rename.

## Step 4 — Close

- Re-run `pytest -q` and both `--check`. Report against Step 0 — must be
  identical; this session touches no code.
- Write the entry in `docs/bitacora.md`, newest-first, in the established native
  format: the three §5 numbers, the §6 bullet correction with what you measured,
  the demo registration, and the over-generalisation observation from Step 2.
  ⚠️ Record plainly why this session exists: three decisions taken in the M12.8b-3a
  round never reached the repository because the prompt that ran predated them.
  That is the §5.83 pattern applied to the working method itself, and it is worth
  naming.
- Per §5.82, update the `handoff.md` header: date, session name, and what remains
  of M12 — the close of M12.8 (which `--check` showed needs no catalogue
  regeneration, only tests and docs) and M12.8b-3b (deferred vocabulary pass).
- Save this prompt verbatim to `docs/prompts/` under the session name.
- AFTER your last write to `docs/bitacora.md`, verify its integrity: entry count,
  every entry still has its header line, pre-existing entries unchanged against
  `8f3a8aa`.
- Push to `gitlab` and `origin`; verify both at the same hash and the tree clean.
- Final report: what changed, what you measured, what you verified as already
  correct, what you found and did NOT fix with file and line, and anything in this
  prompt that did not survive contact with the repository.