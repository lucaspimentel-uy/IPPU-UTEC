# Session M12.9 — the Prototipo v4 stops being a normative source

Repository: IPPU × UTEC-LIDIA, branch `main`.
Backend at `implementacion/L1-hce-idea/backend/`.

M12.8-cierre + I1 closed at `339a726` and M12 is CERRADO. It left one thing
open, flagged in three places: the decision that the Prototipo v4 is no longer
normative was taken mid-session by Lucas and never written to §5. Meanwhile the
precedence paragraph near the top of both `handoff.md` and `CLAUDE.md` still
names the Prototipo v4 as precedence-1.

⚠️ THAT IS WHY THIS SESSION IS URGENT AND SHORT. M11.3 starts next, and
`CLAUDE.md` is read at the start of every session: as things stand, the largest
round of the project would begin by reading a rule Lucas has reversed.

It TOUCHES NO CODE. `pytest` and both `--check` must be identical at close.

## Ground rules

1. MEASURE BEFORE YOU WRITE.
2. `handoff.md` §5 is APPEND-ONLY.
   ⚠️ BOUNDED EXCEPTION: Step 1 writes ONE new §5 entry, dictated below in
   substance. Lucas decided it; you transcribe, you do not decide. If it
   contradicts something already in §5, STOP and report.
3. REGISTERS ARE NEVER CORRECTED: `docs/bitacora.md`, `docs/notas/relevamiento-*`,
   `docs/prompts/`, `docs/pendientes-resueltos.md`, `docs/notas/consulta-a-ippu.md`,
   `docs/notas/respuestas-reunion-ippu-2026-08-21.md`, the meeting agendas, and
   `PLAN-M12` (a plan, amended by §5 entries, never rewritten).
4. INTEGRITY CHECKS RUN LAST.
5. Conventional commits, Spanish body, co-authorship trailer (§5.62).

## Step 0 — Starting point

Measure and report: commit and clean tree, both remotes at the same hash, Docker
up, `pytest -q`, `verificar_estado.py --check`,
`generar_catalogos_backend.py --check`, table count from `Base.metadata`, Alembic
head, single file in `versions/`. Expected: `339a726`, 51 tables, 435 passed /
0 skipped, head `b99294aec85c`, both exit 0. Confirm the last §5 entry number and
report the one you will use. If anything differs, STOP.

## Step 1 — The §5 entry

Format: `### 5.NN <título> (2026-09-16, Lucas)`, no `(L#)` label (§5.77).

ENTRY — The Prototipo v4 and the demo v4.1 stop being normative sources.

Transcribe this substance:

§5.10 placed the Prototipo v4 at precedence level 1, above the Documento
Técnico, and the whole M12 round conformed to it. Two later facts remove that
footing. **§5.37** found generated filler inside the prototype itself, read as
source — the four colour group names. And in September it was confirmed that
**Fernando Sierra generates these artefacts with AI**: both the Prototipo v4 and
the "Catálogo de puertas" of línea L3. Prototype and demo are therefore two
artefacts by the same author and the same method, not a source and its improved
version.

**Decision.** The Prototipo v4 and the demo v4.1 go from **specification** to
**input**: they are consulted, useful information is extracted from them, and
**nothing is modelled or seeded merely because it appears there**. Normative is
what IPPU said about itself — the record of the 2026-08-26 meeting, the
questionnaire answered in writing on 15/06, the Protocolo de acceso y resguardo,
the institutional Manual and the Documento Técnico. Development proceeds from
what we know and have documented about how IPPU works and what it wants.

**Validation method.** Validation is against IPPU, not against artefacts. When
something works, it is sent to them to try, and their feedback comes back. The
feedback is source; the prototype is not.

**Scope of 2026-11-26.** The first line (HCE) is due 26/11 as a **working,
presentable prototype WITHOUT real data** — not production-ready. Consequences
to record: §2.17 (access log with stated reason) is a requirement for production
with real clinical records, not a blocker for 26/11; hosting is a demonstration
deployment and is not decided here; and Fase 4 (users, login, roles) is out of
the critical path, replaced by a minimal demonstration login.

**What this does NOT reopen.** Nothing already built. The M12 catalogues and
modules were cross-checked against other sources at the time, and §5.50 fixed
how a source that is simultaneously specification and demo is read. This governs
from here on.

**What it does change, concretely:**
- The closing criterion for `DESDE_LA_DEMO` is amended from "the list is empty"
  to **"every section has a named source, and nothing is re-sourced without a
  verified-empty diff"**. With the prototype demoted, re-sourcing is a lateral
  move and is done only when demonstrably lossless. `idea_nivel` (a paraphrase,
  not Rivière's official text — M12.1) and `servicio` (prose mentions only) stay
  **by decision, not as debt**. M12.8-cierre already applied this.
- The real verification of IPPU's own catalogues — `ippu_item` and
  `baremo_categoria` above all — can only come from IPPU. It goes to
  `preguntas-ippu.md` if not already covered.
- `PLAN-M12` §M12.8 is amended in its justification ("the authoritative source
  changed" no longer applies).
- ⚠️ **It supersedes §5.10's precedence order.** §5.10 is append-only and is not
  edited; this entry states plainly that the Prototipo v4 drops out of level 1
  and that the normative sources are the ones listed above.

## Step 2 — The precedence paragraph in the two documents that are read first

This is the operative half of the session. Locate by content, not by line.

a) `CLAUDE.md` — the "fuente normativa vigente" / precedence paragraph near the
   top. Rewrite it so the normative sources are the meeting record, the 15/06
   questionnaire, the Protocolo, the Manual and the Documento Técnico, and so
   the Prototipo v4 and the demo v4.1 appear as **inputs to consult with care**,
   citing the new entry and §5.37. ⚠️ Keep whatever else that paragraph carries
   — it is the session's orientation, not only a ranking.
b) `handoff.md` — the same paragraph. Same rewrite.
c) Grep the repo for other places that STATE the Prototipo v4 as authoritative
   or as precedence-1 — instructions, not citations, and not registers. Report
   every one by file and line; fix the instructions, leave citations and
   registers alone.

## Step 3 — The three pending markers left by M12.8-cierre

That session flagged this decision as pending in three places (header,
`CLAUDE.md`, `handoff.md` §6). Find all three, verify them, and close them
citing the new entry. Report if there were more or fewer than three.

## Step 4 — Close

- Re-run `pytest -q` and both `--check`. Report against Step 0 — must be
  identical.
- `docs/bitacora.md`: entry in the established format — the §5 number, what the
  precedence paragraphs said before and say now, the grep results from Step 2(c),
  and the marker count from Step 3.
- Per §5.82, update the `handoff.md` header: date, session name, measured
  figures, and what comes next — **M11.3**, with M12.8b-3b as the one named
  exception of the closed round.
- §6: ⚠️ record two scope decisions Lucas took for 26/11, as NAMED decisions and
  not as pendings that will nag in November: **M12.8b-3b (the vocabulary pass) is
  CANCELLED**, not deferred — it unblocks nothing and there is no margin for work
  that does not; and **the administration sub-module (§2.8 / §2.9 / §2.11,
  §5.90) is out of the 26/11 scope** — the five seeded groups suffice for a
  presentable prototype.
- Save this prompt verbatim to `docs/prompts/` under the session name.
- AFTER your last write to `docs/bitacora.md`, verify its integrity: entry count,
  every entry keeps its header line, pre-existing entries unchanged against
  `339a726`.
- Push to `gitlab` and `origin`; verify both at the same hash and the tree clean.
- Final report: what changed, what you measured, what you found and did NOT fix
  with file and line, and anything in this prompt that did not survive contact
  with the repository.