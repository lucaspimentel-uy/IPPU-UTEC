# Sesión pre-review — cerrar tres huecos y validar el harness empíricamente

> Prompt in English for token efficiency. **Everything written into the repo is in Spanish
> (rioplatense neutro)**, per `CLAUDE.md`. This session runs *before* the code review, so that the review
> sees a settled state and can be scoped to one question.

## Session start

`git pull` from both remotes. Read `CLAUDE.md`, `handoff.md` §5.5 (including §5.5.2), §5.13, §5.28,
§5.34, §6, §12.4, §12.6, the last three §13 entries, and `demo/verificacion/README.md`.

Standing rule: **the repo is the authority, not the `.md` files.** Measure; never infer. If a figure in
this prompt does not reproduce, say so plainly — that is a finding, not an error to smooth over.

**Files you may write on `main`:** `handoff.md`, `docs/`, `herramientas/`, `demo/verificacion/`.
**Nothing under `demo/js/`, `demo/css/` or `demo/index.html`** — the mutations in §4 live only in a
throwaway worktree that is deleted at the end.

---

## 1 — Close the two items that never appeared in the last report

The previous close report went from item 1 to item 6 without mentioning either of these, and they were
both in its prompt. This is the third consecutive session where the closing checklist items are missing
from the report.

1.1 The §13 back-fill for `6f31145` (the commit that added `docs/guias/notas-accesibilidad-ui.md` with no
bitácora entry, §12.4 step 6). **Check whether it exists.** If it does, say so and move on — do not write
a second one. If it doesn't, write it, dated to that session.

1.2 Run `python herramientas/verificar_estado.py --check` and **report its output verbatim**, including
whether Docker was up (without it the test count is reported as not measured, not estimated).

1.3 Confirm the §13 entry for the harness session itself exists and describes what actually landed. If
its numbers are the ones §2 below finds to be wrong, fix them there too.

---

## 2 — Settle the step count before it propagates into the docs

The close report used two numbers interchangeably: «42 pasos» and «0 errores» in §1, «43 comparaciones»
and «43/43 idénticos» in §2, «20/43» and «1/43» in §3, and «2 de 42 pasos» in the recommendation.

2.1 Determine the real numbers **from the code and a live run**, not from the report.

2.2 If «pasos» and «comparaciones» are genuinely different quantities, that is fine — but then define both
terms once in `demo/verificacion/README.md` and use them consistently everywhere. If they are the same
quantity, pick one number and one word.

2.3 Correct every place already written with the wrong figure — `demo/verificacion/README.md`, the §13
entry, anywhere else — and **report which places were wrong**. Five doc↔repo divergences in this round
started exactly like this.

---

## 3 — Get the `ui-core.js:257-268` finding out of the unsigned draft

Right now this finding exists only in a §5 entry that was printed and not committed, which means it does
not exist in the repo at all. If the entry sits unsigned for a week, the finding is lost.

3.1 **Verify it in code before writing it anywhere.** Read `ui-core.js:257-268` and `IDEA_BANDAS` in
`catalogos.js`. Confirm the live IDEA total is painted with cuts at 33 and 65 — the three-band model that
§5.13 / D4 derogated on 2026-08-14 — while `IDEA_BANDAS` declares six bands (0–15 / 16–30 / 31–55 /
56–75 / 76–90 / 91–96). Report the exact discrepancy, and specifically: **at which scores do the two
disagree about the band a user is shown?** That is the sentence that makes this a clinical problem rather
than a colour one.

3.2 Write it into `handoff.md` as a **§6 pendiente** and a **§13 finding**, with `file:line`, framed as
*a live view contradicting a ratified §5 decision*. Do not frame it as a colour or accessibility item.

3.3 In §6, group it with the two header duplications — `renderUsuario()` (`grupos-usuario.js:317`) and
the Ateneos detail (`ateneos.js:416`) — as the scope of the next demo session: three points where the
presentation layer drifted out of sync with what was decided.

3.4 **Do not fix any of the three now.** They belong in the session *after* the harness is validated, so
that they are the first change verified against a working baseline.

3.5 Preserve the unsigned §5 draft so it survives outside a chat transcript: save it as
`docs/notas/borrador-color-y-significado-clinico.md`, register it in `docs/estructura-repositorio.md`,
and link it from the §6 pendiente. It **must** open with a banner, in Spanish, saying: this is an
unsigned draft, it is not a team rule, the rule only exists once Lucas signs it into `handoff.md` §5, and
this file is deleted when that happens. Verify the next free §5 number against the repo before naming it
anywhere — do not assume 5.36 just because the draft says so.

---

## 4 — Mutation test: prove the harness catches things

The retro-test on `d94b102` → `c452aa8` is real evidence, but it is one regression of one kind: text
disappearing from a view. Before anyone relies on this harness as the safety net §5.5 promised, break
three different things on purpose and confirm it notices.

**Hard rules:** all mutations live in a throwaway `git worktree`. Never commit a mutation, never push the
branch, delete the worktree at the end, and **show `git worktree list` and a clean `git status` on `main`
in the report**.

Capture a baseline on current `main`, then for each mutation: apply → run → diff → revert.

4.1 **Clinical guard.** Make `validarIntegridad` accept a signature with a 1/5 item that has no
observation (§4.3). This is the class of bug that matters most and the one a visual diff is least likely
to surface.

4.2 **CSS-only.** Change a colour or a spacing value in `css/estilos.css` without touching any markup.
Whether the harness sees this at all determines what a future visual round can safely lean on it for.

4.3 **Silent early `ReferenceError`.** Introduce one that aborts the seed without any visible breakage —
the exact case §5.5.2 documents as caught by the fingerprint and *not* by looking at the screen.

Report per mutation: caught / not caught, **which step** flagged it, and how legible the diff is to a
human. If one is not caught, that is the more valuable result: characterize the blind class in one
sentence and add it to §6. Do not smooth it over.

Budget: if this exceeds ~30 minutes of wall clock, stop and report what you got.

---

## 5 — Cross-verify `verificar_contraste_ui.js`

Its numbers are already published in `docs/guias/notas-accesibilidad-ui.md`, so an error there is already
loose in the repo.

5.1 Pick **three pairs** — one clear pass, one clear fail, one near the 4,5:1 boundary — and check them
against an independent implementation of the WCAG relative-luminance formula **written from the spec**,
not a second call into the same code path. Report agreement to two decimals. If they disagree, the
published table is wrong and fixing it comes before anything else in this session.

5.2 **Alpha compositing.** State explicitly how `rgba()` foregrounds are composited and over which
background, since the focus-ring figures (1,61:1 and 1,34:1) depend entirely on that choice. If the
script assumes white, say so in the doc — the demo's cards may not be white.

5.3 Confirm that the doc states, as a limitation of the run and not as a footnote, what was **not**
measured: the 5 focus rings out of ~10, and Protocolo / Informe / modales absent from the 59-pair sweep.
A reader must not be able to mistake it for exhaustive.

---

## 6 — What this session must NOT do

- No edits to `demo/js/`, `demo/css/` or `demo/index.html` **on `main`**.
- Do not commit anything into `handoff.md` §5.
- Do not adopt one of the three baseline options — that decision is Lucas's and goes to §5.
- Do not open a frontend round (§5.28). Do not copy anything from the v4 prototype's presentation layer
  (PLAN-M12 §2).

## Close

New §13 entry. `verificar_estado.py --check` before committing. Separate commits by purpose. Push to both
remotes.

**Report, in this order:**

1. The two close-out items from §1, with the verbatim `--check` output.
2. The real step/comparison numbers and every place that had them wrong.
3. The verified `ui-core.js` discrepancy — including the scores at which the two band models disagree —
   as written into §6 and §13.
4. The mutation table: three rows, caught / not caught / which step, plus the clean-worktree proof.
5. The contrast cross-check: agreement to two decimals, and the compositing assumption.
6. Anything declined because it needs Lucas — one line each.
