SESSION D1 · RECORD THE 2026-08-21 IPPU MEETING — DOCUMENTATION ONLY

Context. On 2026-08-21 there was a meeting with IPPU. It answered most of the open questions
and it overturns several assumptions the repository currently treats as settled. None of it
is written down: docs/notas/respuestas-reunion-ippu-2026-08-21.md exists but is empty, all 26
**Respuesta:** blocks blank. The R0 survey (docs/notas/relevamiento-estado-2026-08-26.md)
confirmed this and flagged it NO VERIFICABLE.

Your job is to bring the meeting into the repository so the next session works from it
instead of from stale assumptions. The content below is the record, not a starting point for
interpretation.

THIS SESSION WRITES DOCUMENTATION ONLY.

FORBIDDEN
- Any change under app/, tests/, alembic/. No models, no migrations, no tests, no seed.
- alembic revision | upgrade | downgrade | stamp.
- python -m app.seed_catalogos.
- Any write to the database.
- git commit, push, merge, checkout, rebase, branch -d. Leave changes in the working tree.
- Do not "fix" the 12 divergences found by R0. Several stop existing once the model changes;
  repairing docs against a model that is about to change creates a second round of edits.
  Only what TASK 4 lists gets touched.

FILES YOU MAY EDIT
- docs/notas/respuestas-reunion-ippu-2026-08-21.md
- handoff.md (§5, §6, bitácora, header)
- docs/notas/puntos-a-validar.md
- docs/notas/consulta-a-ippu.md  (READ THE CONSTRAINT BELOW BEFORE TOUCHING IT)
- docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md (two amendments only)
No other file.

=== THREE THINGS TO GET RIGHT BEFORE YOU WRITE ANYTHING ===

(1) SECTION NUMBERING AND LETTER SERIES
The pre-meeting round of 2026-08-20 already used letters H1, H2, H3 (§5.33–§5.35).
This round is series I, starting at §5.36. READ the file and confirm the last existing
section before you number anything — do not trust this instruction over the file.
§5 is append-only (§12.6): where the meeting corrects an earlier decision, write a NEW entry
that supersedes it. Never edit the old one.

(2) consulta-a-ippu.md IS A SNAPSHOT WITH A PRESCRIBED PROCEDURE
Per §5.34 the file is a word-for-word snapshot of the questionnaire sent on 2026-08-19, and
the authoritative artifact is a team Google Doc, not this repo. But §6 already prescribes
exactly this session's procedure: answers go under their `> _Respuesta:_` blocks in
consulta-a-ippu.md AND in the Google Doc. Follow it — filling the blocks is allowed; changing
question text, numbering or structure is NOT. The Google Doc is outside this repo: leave a
§6 item saying it still has to be updated by a person, and do NOT delete the meeting file
even if its own retirement condition looks met. Report whether that condition is met.

(3) THE QUESTIONNAIRE WAS RENUMBERED — USE THE "ENVIADO" COLUMN
§5.34 maps draft numbering to sent numbering and declares the sent column canonical. Any
citation below written in draft numbering must be translated before it lands in a file.
Verify every one against the actual file rather than trusting this table.

  1.1–1.6 unchanged · 2.1–2.6 unchanged
  2.9 períodos → 2.7 · 2.10 fotos → 2.8
  3.3 acceso al sistema → 3.2 · 3.4 expedientes existentes → 3.3
  3.5 número de historia → 3.4 · 3.6 quién ve qué → 3.5
  3.7 falta un técnico → 3.6 · 3.8 cambia de grupo → 3.7
  3.9 puntuación independiente → 3.8 · 3.10 informe a la familia → 3.9
  3.11 severidad DSM → 3.10 · 3.12 nombre del PAI → 3.11
  3.13 ateneos de grupo → 3.12 · 3.14 número de ateneo → 3.13
  3.15 algo que no preguntamos → 3.14

  ⚠️ REMOVED before sending, never asked: draft 2.7 and 2.8 (baremo) and draft 3.2 (the
  IPPU-TEA citations). The meeting answered all three anyway. They close ONLY in
  puntos-a-validar.md §1.2 and §1.4. Do not look for them in consulta-a-ippu.md — they are
  not there.

WRITING RULES
- Spanish, in the house style of handoff.md §5: what was decided, why, what it closes, what
  it costs, what it breaks. No filler.
- Every entry states its source: "reunión IPPU 2026-08-21". Where the meeting corrects
  something the repo asserts, say what the repo said and that it was wrong — never overwrite
  silently.
- Do not invent detail beyond what is given. Incomplete stays incomplete and gets marked.

---

TASK 1 — Fill docs/notas/respuestas-reunion-ippu-2026-08-21.md
Write the meeting record question by question against the structure already in the file. At
the end, list which of the 26 blocks remain WITHOUT an answer — that list is as valuable as
the answers.
Record these two as note-taking errors the meeting itself corrected, so nobody relitigates:
- "no es lineal" (about the A→B order) was a transcription error. Discard it. The A-before-B
  order is firm; the periods are not.
- "posible cambio de puntaje del IDEA" was also a transcription error — it referred to the
  IPPU-TEA scale — and is DISCARDED either way. No scale changes. The project adapts to how
  IPPU works today, plus the features they asked for.

TASK 2 — Add the decisions to handoff.md §5, series I, from §5.36

I1 · IDEA becomes ANNUAL.
  IPPU: the IDEA is done once a year, always, and each year's is compared against the previous
  one. Closes puntos-a-validar §1.1 / consulta §2.1 — the most important open question of the
  round — and agrees with Fernando Sierra's written answer of 15/06 (P10/P12). The Documento
  Técnico's "línea base única" does not survive.
  §5.8: its gate had one question behind it and IPPU answered it. Note that §5.35 already
  relocated that gate to before M11.3, not before M12.5 — so what remains is applying the
  change, not deciding where the door is.
  Cost, already measured by §5.31 and re-confirmed by R0: purely additive. `idea` is already
  1:N, no UNIQUE on hce_id, one inbound FK (puntuacion_idea, CASCADE), 9 Idea( constructions
  across 3 test files, no `anio` column yet. Add `anio` + UNIQUE(hce_id, anio) — the pattern
  the schema already uses three times.
  ⚠️ §5.35 also recorded that the rule for which IDEA is in force lives in prose, not in the
  schema: "la vigente es la de mayor fecha_consenso" (app/models/modulos.py:219). Once the
  IDEA is annual that rule has to be revisited — with one per year, "most recent" and "this
  year's" are not the same question.
  NOT IMPLEMENTED IN THIS SESSION. Write the decision only.
  Comparison rule: comparisons only ever happen within the same instrument — this year's IDEA
  against last year's, B against A, never across instruments. Record that the M11.3 rule
  currently phrased "Δ only B−A" must be restated as "Δ only within the same instrument", or
  it blocks a comparison IPPU explicitly asked for.

I2 · The colour group names were a fabrication that entered the repo as source.
  Real names: Inicial · Escolares · Preadolescentes · Adolescentes · Taller de Adolescentes.
  "Grupo Azul / Celeste / Naranja / Verde" were invented by an AI and seeded in M12.3 as
  though they came from Prototype v4. Write this plainly — the process failure matters more
  than the wrong strings, because the same mechanism can repeat.
  D9 (§5.18) structure is untouched and correct: own id + UNIQUE(nombre, anio).
  ADMIN creates new groups when needed. This turns puntos-a-validar §2.8 from a noted gap into
  a blocking one: R0 confirmed there is still no endpoint or screen that creates a group.

I3 · Consent does NOT block the flow. ⚠️ This reverses an earlier reading, and it is the one
  item in this round that is second-hand.
  IPPU asked that consent not hold up the NNA's evaluation process. Resolution: the expediente
  proceeds with a visible "CI pendiente" state and a notification, instead of a hard gate.
  The consent record itself stays minimal and unchanged: name of the family referent, date,
  sign button.
  What it contradicts, stated openly: consulta §1.3 — already sent to IPPU — asserts consent
  is the one step that can never be skipped. That assertion is now wrong and IPPU has the
  document in hand.
  ⚠️ R0 finding, which makes this cheap: the rule lives ONLY in demo/js/flujo.js:54-64. No
  CHECK, no service, no test — grep -rci "consentimiento" tests/*.py returns 0 across all 7
  files. Making it non-blocking costs 1 file and 0 tests. Conversely, what IPPU saw in the
  demo is not backed by the backend at all, and M11.3 has to implement the notification.
  ⚠️ SOURCE QUALITY: reported by teammates, not heard directly at the meeting. The raw 21/08
  note does say "que no tranque los procedimientos de evaluación", so two sources agree — but
  write this entry as CONFIRMABLE, not closed, and put it at the top of the list for the next
  contact with IPPU.

I4 · Storing needs no authorization; SHARING does. Current code is backwards.
  Photos: storing a photo in the HCE does not require consent. Sharing it does.
  R0 confirmed image authorization blocks SAVING, and that no notion of sharing or exporting
  exists anywhere in app/ — the only hit is a comment at modulos.py:429.
  Record the wider finding, because it is not about photos: the model represents storage and
  does not represent disclosure. Four separate things IPPU said land on the same missing
  concept — photos, the confidentiality rule (I10), management review of reports (I5), and
  sending institutions a summary rather than the file. Flag it as something to settle before
  M11.3/M11.4 build on top, and note this is the cheap moment for the same reason the IDEA
  change is.

I5 · Reports.
  Reports are generated on request, with no fixed date, for families and institutions.
  BPS: always at year end, complete. INAU: on request, possibly for one specific child.
  What IPPU asked for is a configurable report-generation area, not a fixed catalogue of
  report types — record the types as an implementation idea, not as settled model.
  The annual closing report stays one per year: informe_cierre and its UNIQUE are correct and
  do not change.
  NEW RULE: every report is reviewed by ADMIN — in practice IPPU's directors — before it is
  handed over. That is a flow state (draft → reviewed by management → delivered), not a print
  permission. Record the earlier reading ("printing goes through ADMIN") as the narrower
  misreading it was. R0 confirmed no review or approval state exists in the model today.

I6 · Users, roles, and technician↔group assignment.
  Each technician has their own user. Technicians see only their assigned groups. ADMIN sees
  everything, assigns groups, and can create further ADMINs.
  This amends the M12 plan's no-goal ("no se toca autenticación; la segmentación se modela
  como dato, no como permiso") — see TASK 4.
  Today grupo carries two fixed technician columns; what IPPU describes is usuario + rol + a
  many-to-many assignment. R0 confirmed none of those tables exist.
  Sequencing: AFTER M12.5 and M12.6, which do not depend on it.
  §6 already carries this as "grupo — mostrado y no modelado": F1 introduced responsable1,
  responsable2 and tecnicosAutorizados in the presentation layer with no §5 decision behind
  them, and that entry predicted that an IPPU "yes" would open backend work rather than
  confirm an assumption. It did. This entry is the written decision that was missing.

I7 · PAI.
  Official name: «Proyecto de Atención Integral» (INAU), not «Propuesta de Atención
  Individual». It goes printed on what is handed to INAU. Closes puntos-a-validar §1.11 /
  consulta §3.11.
  Section VII (Análisis estratégico) is REMOVED at IPPU's request.
  More than one PAI per year is allowed — confirms consequence 1 of §5.22: no
  UNIQUE(hce_id, anio) on pai.
  It is a frequently used working tool, which confirms the dynamic-document reading of §5.22
  that had been based on INAU research rather than on IPPU material.

I8 · hc_historico is an integer from 1000 upward (1001, 1002, …). All records migrate to the
  new system — actives and archived. Closes §1.7 / consulta §3.4 and §1.8 / consulta §3.3.

I9 · Heroku is the CURRENT host of IPPU's HCE. It is NOT the confirmed destination — options
  will be evaluated later. This is input to §1.5 / consulta §3.2 (where the data lives and
  what we migrate from). §2.5 (production deployment) REMAINS OPEN. Do not record this as a
  deployment decision.

I10 · Confidentiality, reframed. Storing the data in the HCE requires no permission; sharing
  it does. §1.6 no longer blocks development — it blocks data leaving the system. Same family
  as I4.

I11 · Ateneos. M12.7 is already closed; these are deltas.
  Four types confirmed, jornada de capacitación included — it is the instance where several
  technicians meet to review ateneos, so it belongs.
  Prefix: one common prefix suffices; a specific JC- prefix for jornadas is acceptable if it
  is cheap. R0 confirms `codigo` is derived, so it is one line and no migration.
  The number belongs to the year it was REGISTERED — exactly what is implemented
  (anio_correlativo). Closes §1.14 / consulta §3.13 with zero work.
  Still missing: an explicit observaciones field, and document attachments with PPTX in
  particular. "Agregar acuerdo" already exists and stays.
  ⚠️ Visibility CORRECTS the raw meeting note: it is NOT "all technicians see all ateneos".
  Each technician sees those of their own group; the jornada de capacitación is the
  transversal instance. This closes §1.12 / consulta §3.12 in the RESTRICTIVE direction,
  opposite to what the note suggested — say so explicitly, because the implemented derivation
  is `sensible = (tipo == 'clinico')` and it does not express this.
  Institutional target: 8 ateneos a year, at least 2 per group. Record as an indicator for the
  M11.3/M11.4 dashboard. R0 confirmed nothing counts ateneos per group or per year today.

I12 · Scoring is joint: the two technicians agree in person and record a single number, one
  field. Closes §1.9 / consulta §3.8.
  D7 (§5.16) is not wrong, it is DORMANT: puntuacion_idea and puntuacion_protocolo were
  modelled nullable for exactly this. State the consequence plainly — the inter-rater kappa
  required by Manual §23, which the Manual calls the instrument's only invariant
  methodological requirement, is NOT COMPUTABLE under current practice. That has to be said
  out loud if the work is presented to INAU.

I13 · Confirmations that close open points with no work:
  - Baremo cut-offs are correct as loaded, confirmed by IPPU and by BUND's official
    documentation. Closes puntos-a-validar §1.2 — NOT a consulta question, it was removed
    before sending. The §1.2 guard about cut-offs vs labels never has to be exercised.
  - The 24 IPPU-TEA item references are confirmed. Closes puntos-a-validar §1.4 — same
    caveat, it was removed before sending.
  - DSM-5-TR severity: 0..1 per expediente, revisable, no fixed cadence — confirms what is
    implemented (§1.10 / consulta §3.10). DSM-5 and CIF are reference documents for a shared
    vocabulary, worth keeping accessible from the application.
  - Signatures: two technicians; once signed it is closed; corrections go in a separate note
    (consulta §1.2).
  - A child changing group mid-year: what is signed stays signed; what is pending is signed by
    the new technician (consulta §3.6 / §3.7, and the residue left open in §2.6).
  - "Evaluación por áreas" and "general" are replaced by protocols A and B (consulta §2.5).
  - Periods are reminders with no rigid dates, but the A→B order is firm (consulta §2.7).
  - The family document is almost always delivered on paper (consulta §3.9).
  - An NNA can stop attending diurna and remain in clínica (consulta §2.6). Note the tension
    with §5.12 (D3), which keeps clínica out of scope: the transition still has to be
    recordable.

I14 · Parents' guide. IPPU wants a guide on hand to give families, mainly for paperwork: BPS,
  MIDES, INAU. The procedure families ask about most is AYEX. It goes with the reports.
  Content, not model — but it needs an owner and a decision on whether the text is editable
  from the application or fixed.

TASK 3 — consulta-a-ippu.md
Fill the `> _Respuesta:_` blocks for every question the meeting answered, one or two lines
each, per the §6 procedure. Do not alter question text, numbering or structure. Leave
unanswered questions untouched. State at the end how many of the 14 Part-3 questions and how
many overall remain open.

TASK 4 — puntos-a-validar.md (the file is thawed — §6 says so; verify)
- Mark every point the meeting closed, with the date and "reunión IPPU 2026-08-21", in the
  style §1.3 and §2.6 already use for closed points.
- Pay the debt declared in §5.31: §2.1 still lacks the measured cost of the annual IDEA.
  Write it in, now that §5.31 and R0 have both measured it.
- Where the meeting OPENS something instead of closing it — group creation (I2), users and
  permissions (I6), the disclosure concept (I4/I10), report review (I5), the ateneo indicator
  (I11) — add or update the corresponding point, each saying explicitly what it blocks.

TASK 5 — Two amendments to PLAN-M12, and nothing else
1. §M12.6: Section VII is removed from the PAI at IPPU's request (I7), and the official name
   is «Proyecto de Atención Integral» (I7). Record both where the module is specified.
2. The no-goal about authentication is superseded by I6. Mark it amended, not deleted, with a
   pointer to I6 — the plan predates the meeting and is stale, not wrong.
Do not restructure the plan; do not touch its other sections.

TASK 6 — handoff.md header, §6 and bitácora
- Update "Foco actual" to state the real position: M12.0–M12.4 and M12.7 done (38 tables,
  240 tests, head 9246e659d2c9, all verified by R0 on 2026-08-26), M12.5 and M12.6 remaining,
  M12.8 closing.
- §6: add what this round opened (group creation now blocking, users/permissions, the
  disclosure concept, report review state, ateneo indicator, the parents' guide owner), and
  add the pending item that the team Google Doc still has to receive these answers by hand.
- Bitácora entry for this session: what was recorded, what closed, what is now blocking that
  was not, and what this session deliberately did not do.

---

CLOSING
Finish with a short list, in the chat and not in a file, of anything above that you found
contradictory, underspecified, or in conflict with something already in the repository.
Do not resolve it — surface it.