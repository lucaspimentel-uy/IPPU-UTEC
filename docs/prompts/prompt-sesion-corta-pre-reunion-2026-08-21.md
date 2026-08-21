# Claude Code — Sesión corta pre-reunión (2026-08-21). **Time-box duro.**

> Prompt in English for token efficiency. Everything written into the repo is in Spanish
> (rioplatense neutro), per `CLAUDE.md`.
>
> Fase B closed at `591acfe`, both remotes, all green. **Do not re-verify it.** The meeting with IPPU is
> **today**. This session does three things and stops. If any of them does not go cleanly, revert that
> step and report — a demo that works beats a demo that covers more and is broken.

## C.1 — Confirm three deliverables exist. Report only, first.

The Fase B report did not mention these. Before touching anything, state for each: exists / does not
exist / exists but incomplete, with path and a one-line description of its current content.

1. `docs/notas/respuestas-reunion-ippu-2026-08-21.md` — the landing pad (B.4). Sections per agenda item,
   June answers quoted underneath, the three never-asked questions (baremo ×2, citas de la escala) at
   the top, and the one-line «qué decisión dispara cada respuesta».
2. **The §5.8 gate amendment** (B.3 / Q3) and the **PLAN-M12 §7 third bullet** replacement. `§5.33` and
   `§5.34` are accounted for (the §5.27 amendment and the questionnaire divergence); this one is not.
   If PLAN-M12 §7 still says «antes de M12.5» while §5 says otherwise, that is the anti-contradiction
   rule failing inside the same round that wrote it.
3. `docs/planes/agenda-reunion-ippu-2026-08.md` — updated per B.5: §3 with the **exact sentence** to say
   about dos técnicos, talleres reordered so the `pai_taller` question comes first, the three unasked
   questions as an opening item, and every consulta citation renumbered to the sent version.

**If any is missing, write it now** — these are the deliverables the meeting consumes. If all three
exist, say so and move on.

## C.2 — The duplication defect, and whether it is a class

Reported: in the group detail, crumbs and title render twice — the static ones in `index.html` plus the
ones F1's module injects. Found by reading, not by running.

- Fix it: remove one side, keep F1's markup and styling. Say which side you removed and why.
- **Then check whether it is a class, not an instance.** F1 restyled every view; wherever a module now
  injects a header, crumb trail or title that `index.html` also holds statically, the same duplication
  exists. Sweep **every** view: for each `#view-*` in `index.html`, list what is static markup and what
  its module renders, and flag every overlap. Report the list even if you fix only the group one.
- Re-run `node --check` over `demo/js/` and confirm nothing else moved.

## C.3 — Stop

Commit by purpose, push to both remotes. **Do not** touch the harness
(`fingerprint.js:82`, `.navitem[data-view="usuarios"]` — B2 relocated the entry point to
`index.html:43`'s `.userchip`). It is real debt and its fix is known, but it is not on today's critical
path and it is not worth a regression hours before the walkthrough. It goes at the top of the
post-meeting session.

**Report:** the three confirmations from C.1 · what was removed for the duplication and the full
overlap list from C.2 · anything you declined to touch.
