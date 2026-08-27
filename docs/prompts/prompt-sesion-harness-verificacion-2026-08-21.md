Prompt para la próxima sesión 08-21-26

Prompt in English for token efficiency. Everything written into the repo is in Spanish (rioplatense neutro), per CLAUDE.md.

Session start

git pull from both remotes. Read CLAUDE.md, handoff.md §5.5, §5.27, §5.28, §5.32, §5.35, §12.3, §12.4, §12.6 and the last three §13 entries, plus demo/verificacion/README.md and PLAN-M12 §2.

Standing rule: the repo is the authority, not the .md files. Measure; never infer. If a figure in this prompt does not reproduce, say so plainly — that is a finding, not an error to smooth over.

Scope of files you may write: demo/verificacion/, handoff.md, docs/, herramientas/. Nothing under demo/css/, demo/js/ or demo/index.html — see §5.

0 — Two carry-overs from 6f31145

0.1 That commit added docs/guias/notas-accesibilidad-ui.md and edited docs/estructura-repositorio.md with no §13 entry (§12.4 step 6). Write it now, dated to that session, and state in it that §2.6's two ratios are hand-computed and pending tool verification.
0.2 Run python herramientas/verificar_estado.py --check and report the result. It should have run at that close and didn't.

1 — Fix the harness. This is the session.

§5.5 sold demo/verificacion/ as the safety net for every demo refactor; today it dies at fingerprint.js:82, which clicks .navitem[data-view="usuarios"] — a node B2 removed.

1.1 Verify Playwright actually runs in this clone (npx playwright --version, browsers installed). If it doesn't, report exactly what's missing and stop. Do not report a green harness you did not run.
1.2 Read fingerprint.js in full before editing. Report which views it walks and how it reaches each one.
1.3 Fix the navigation — but do not hardcode .userchip as a second special case, that reproduces the failure. Declare the entry point per view in one place (view → selector map), assert at the start of the run that every declared entry point resolves in the DOM, and fail loudly naming the view if one doesn't. The harness was useless for a week because it died silently on a DOM assumption instead of failing with a message; the fix is that behaviour, not this one selector.
1.4 The usuarios entry point is index.html:43 — a .userchip with onclick="go('usuarios'); renderUsuario()". Check whether clicking it is sufficient or whether the harness also needs renderUsuario(), and verify the captured view is populated, not an empty shell. A fingerprint of an empty view is worse than a crash: it records "fine".
1.5 Re-run. Report step count, per-step result, and console errors.

2 — Baseline: measure, hand Lucas the options, do not decide

verificacion/.gitignore excludes *.json, so there is no versioned baseline. The two-worktree procedure is already in demo/verificacion/README.md. The open question is only whether to version a reference fingerprint.

2.1 Determinism: run the fingerprint twice on the same commit and diff. Report every field that differs.
2.2 Calendar dependence — the decisive one. Grep the demo for anything derived from the current date (new Date(), Date.now()): the 90/30-day recordatorio alerts, vigencias, ages. Report which fingerprint fields would change tomorrow with no code change. If several would, a versioned baseline rots by calendar and that changes the recommendation.
2.3 Size of the output and number of comparisons.
2.4 Write the options into demo/verificacion/README.md — versioned baseline · two-worktree only · versioned baseline with volatile fields normalized — each with its cost and what it does not catch, given 2.1–2.3. Recommend one; do not adopt it. The choice is Lucas's and goes to §5.

3 — Retro-test: does the fixed harness catch a real regression?

Budget ~20 minutes wall clock; if it exceeds that, stop and report where you got to.

Compare current main against the pre-F1 state using the two-worktree procedure. The tag pre-limpieza-2026-08-20 is documented as marking main without F1 merged — verify that before trusting it.

3.1 Report whether the diff surfaces the talleres regression (bitácora 2026-08-20, hallazgo 1: g.talleres defined at js/grupos-usuario.js:34,40,46,52 and rendered nowhere; pre-F1 it was drawn as tags at :56).
3.2 Independently of the harness, grep and report whether that regression is still open on main today, and whether index.html:401 still promises «días/horarios y talleres asignados».
3.3 If the harness does not surface it, say so plainly and characterize what class of change it is blind to. That is the more valuable finding, and it belongs in §13.

4 — Only if 1–3 are done and verified: the contrast measurement the previous session did not produce

It reported two hand-computed ratios and no colour inventory and no pair table. Script it.

4.1 Extract every colour declared under implementacion/L1-hce-idea/demo/ — custom properties first, then literals — with file:line and role (background, text, border, focus, state).
4.2 For every foreground/background pair that actually occurs in the rendered markup, compute the WCAG ratio by script. Report ratio, criterion, pass/fail.
4.3 Correct docs/guias/notas-accesibilidad-ui.md: replace §2.6's hand figures with computed ones, add the pair table, and state the method so it can be re-run. If a hand figure was off, say by how much.
4.4 Commit the script under herramientas/ and register it in docs/estructura-repositorio.md.

5 — What this session must NOT do
No edits to demo/css/, demo/js/ or demo/index.html. The two remaining header duplications — renderUsuario() (grupos-usuario.js:317) and the Ateneos detail (ateneos.js:416) — are the next session on purpose: they should be the first change verified against a working harness, not made in the same session that builds it.
Do not adopt or propose a palette. Do not open a frontend round (§5.28).
Do not copy anything from the v4 prototype's presentation layer (PLAN-M12 §2).
Do not commit anything into handoff.md §5.
Close

New §13 entry for this session, separate from the 0.1 back-fill. verificar_estado.py --check before committing. Separate commits by purpose. Push to both remotes.

Report, in this order:

Harness: what was broken, what changed, the actual run output.
Baseline: determinism, calendar dependence, size, recommended option and its cost.
Retro-test: caught or not caught, and whether the talleres regression is still open on main.
§4 if reached: the delta between the hand figures and the computed ones.
Draft §5 entry, printed and uncommitted. Verify the next free number against the repo — do not assume 5.36. Author Lucas, undated. Content: the domain rules the previous session wrote into docs/guias/notas-accesibilidad-ui.md §3.1–§3.2 instead of into §5 — severity is not urgency (red reserved for actionable blockers: CI sin firmar, imagen sin autorización §8.4, acción irreversible; never an IDEA band or a DSM support level) · the IDEA ramp under its inversion, cross-checked against §5.13's 6 bands and the baremo cuts, with the caveat that those cuts are confirmed by the v4 prototype and not as Decreto 72/025, and IPPU was never asked · the two status vocabularies as they exist in code · the forward note for HCE-SEV, which has no screen yet. Also print the edit that would be applied to the doc once signed: its §3 becomes a consequence of the entry, and the measurements stay as its technical annex.
Anything declined because it needs Lucas — one line each.