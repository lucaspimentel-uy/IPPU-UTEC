SESSION M12.5 · HCE-INC — INCLUSIÓN EDUCATIVA Y SOCIAL

Round M12 (absorption of Prototype v4), sub-module M12.5. You are running this alone: no
other branch is open on app/models/, so §5.19 does NOT freeze the migration — regenerate it
at close, as M12.1 through M12.4 and M12.7 did.

Read first, in this order: handoff.md (§5 entries, §6, §12), CLAUDE.md,
backend/docs/esquema-datos-v2.md, docs/planes/PLAN-M12-absorcion-prototipo-v4-2026-08.md
§M12.5, docs/markdown/prototipo-v4-referencia.md §6, and
docs/notas/relevamiento-estado-2026-08-26.md.

Starting state, verified by R0 on 2026-08-26: 38 tables, 240 passed / 0 skipped, head
9246e659d2c9. Confirm it yourself before you start; do not trust this line.

=== RULES THAT OVERRIDE THE TASK ===

EVIDENCE. Every claim about the code carries file:line or the command output that produced
it. Where documentation and code disagree, the code wins and the divergence gets recorded.
Do not infer model shape from .md files — the repo and the docs have diverged repeatedly.

ANTI-CONTRADICTION (§12.6). If anything here contradicts a decision already written in §5,
STOP, do not implement it, and record it in §7 / §6 as an open question. §5 is append-only:
where a new decision supersedes an old one, write a NEW entry that says so. Never edit the
old one.

NUMBERING. Session D1 used §5.36–§5.49 (series I, I1–I14). READ the file and confirm the last
existing section before numbering anything.

SCOPE. Models, migration, catalogues, tests, docs for HCE-INC. Do NOT touch demo/. Do NOT
open M12.6. Do NOT implement the annual IDEA (decision I1 is written; implementation is a
separate module and §5.35 puts its gate before M11.3).

=== BEFORE MODELLING: TWO DECISIONS THIS SESSION MUST WRITE ===

DECISION A · What in Prototype v4 is normative and what is fixture.
  Background, measured during D1: the four colour group names ("Grupo Azul / Celeste /
  Naranja / Verde") live inside Prototype v4 — HCE_IPPU_Prototipo_v4.html and
  prototipo-v4-catalogos.json under GRUPOS_EQUIPO, with professionals labelled "(demo)" —
  and entered the repo via D9/§5.18 in M12.1 (2a75c25). IPPU confirmed at the 21/08 meeting
  that the real names are Inicial · Escolares · Preadolescentes · Adolescentes · Taller de
  Adolescentes.
  The failure was not invention. It was reading DEMO SEED DATA out of a precedence-1
  normative source (§5.10) as if it were institutional truth.
  M12.5 is where this bites next: it takes five catalogues from the same prototype —
  INC_TIPOS (10), INC_ESTADOS (7), INC_TEMAS (5), INC_MEDIOS (7), INC_ROLES (8).
  Before seeding ANY of them:
  - Inspect the prototype source and classify each catalogue: is it an instrument/vocabulary
    definition (normative) or sample rows a demo needed to render (fixture)? State the
    evidence per catalogue — "(demo)" markers, placeholder names, personal names, plausible
    institution-specific values.
  - Anything you cannot classify with evidence goes in as NOT SEEDED plus an open question,
    not as a guess.
  - Write the general rule as a §5 entry so the next sub-module inherits it, and record which
    catalogues already in the repo (M12.1–M12.7) were never checked against it. Do NOT go
    re-verify them in this session — list them.

DECISION B · Is the inclusion state annual or continuous?
  §5.35 isolated this deliberately so it would not be lost, and IPPU answered the IDEA
  version of the question (I1) but not this one. The schema now uses the annual pattern four
  times: protocolo, informe_cierre, grupo (D9/§5.18) and idea (I1, pending implementation).
  Choose the REVERSIBLE direction and say so explicitly, the way M12.4 did for severidad_dsm
  (puntos-a-validar §1.10): one record per expediente now, because moving to 1:N later means
  adding an id and dropping the PK without losing rows, while the opposite direction forces
  discarding data.
  Record it as a §5 entry AND as an open question for IPPU in puntos-a-validar.md, with what
  it would cost to change.

=== WHAT TO BUILD ===

Specification: PLAN-M12 §M12.5 and prototipo-v4-referencia.md §6. Follow them; where they
disagree with the prototype's actual JS/JSON, the prototype wins and you record the
divergence.

catalogo_centro_educativo { nombre, tipo, zona, contacto }
  Does NOT exist in the prototype — there `centro` is free text. The catalogue is ours,
  requested by the Especificaciones Técnicas for the definitive system.
  ⚠️ DECIDE, with the M12.3 precedent explicitly on the table: FK from inclusion, or text
  matched against the catalogue?
  M12.3 chose text-without-FK for taller_nombre so that retiring or reordering a taller could
  never drag a clinical record, and so a retired taller still renders marked as retired. A
  school reference may or may not be the same kind of thing. Argue it, decide it, write it.
  ⚠️ This catalogue is administered by coordination, which puts it in the same family as
  puntos-a-validar §2.8 (no way to create a group) and §2.9 (no way to manage talleres):
  a model decision that delegates to coordination an operation that does not exist. Seed
  accordingly (insert-only or not at all) and add it to that point rather than opening a new
  one.

inclusion { hce_id, centro (per Decision above), tipo_centro, grado, modalidad, dias_horas,
  at, at_nombre, ref_nombre, ref_rol, ref_tel, estado, fecha_estado, obs }
  estado from INC_ESTADOS, default "Sin registrar".
  Belongs to the expediente, so hce_id per §5.26 nomenclature.
  ⚠️ §5.22 depends on the exact column names of centro, modalidad and grado: M12.6 reads
  them live as carga única for PAI section V. Name them stably and record the contract, so
  M12.6 is not rewriting a mapping against columns that moved.
  No signature flow. Open the whole cycle.

inclusion_bitacora { inclusion_id, fecha, interlocutor, rol, medio, tema, contenido, acuerdos,
  autor_id, timestamp }
  Catalogues: INC_TEMAS, INC_MEDIOS, INC_ROLES — after Decision A.

`sensible` is DERIVED, never captured: in the prototype, sensible = (tema === 'Clínica —
  sensible'). Model it as a computed column or a service derivation, with a SQL expression so
  Fase 4 can filter on it. A loose boolean desynchronises from the tema, and the concrete
  consequence is grave family information circulating alongside school data — which is
  exactly what the segmentation exists to prevent.
  ⚠️ Decisions I4 and I10 (21/08) reframe what "sensible" means: IPPU said STORING data needs
  no permission and SHARING it does. R0 confirmed the model represents storage and has no
  notion of disclosure anywhere in app/. Do not build a disclosure layer here — it is bigger
  than this module and I4 flags it for before M11.3/M11.4. But make sure the derivation you
  write reads as "restricted to share", not "restricted to store", and say in the docstring
  which of the two it currently means.

Catalogue shape: decide table vs constant per catalogue, with the AT_TIPOS precedent from
  M12.7 explicit. There the type was a CONSTANT rather than a catalogue because it is the
  discriminator the CHECKs are written against, and an editable fifth value would let a row
  save with no subject and both content blocks at once. INC_TEMAS drives the `sensible`
  derivation, which makes it discriminator-shaped; INC_ESTADOS carries description and
  semáforo, which makes it attribute-shaped. Argue each one.

Indexes on estado and fecha_estado. The área dashboard is computed from the HCEs — no
  parallel spreadsheet — but the computation itself is M11.3/M11.4. Guarantee the data and
  the indexes only.

Read demo/js/inclusion.js READ-ONLY. It is 175 lines from round F1 and it is what IPPU
  actually saw at the meeting. Do not edit it. Record every place the backend you build
  diverges from what that screen shows, because a divergence means IPPU validated something
  the model does not do.

=== CLOSING ROUTINE (§5.19 and the M12 criterion) ===
- Before you start: `git status`. Three files are modified in the working tree from other
  sessions (docs/estructura-repositorio.md, demo/verificacion/README.md,
  docs/notas/borrador-color-y-significado-clinico.md) plus loose prompts. They are NOT yours.
  Do not commit them, do not stash them, do not revert them. If you cannot start without a
  clean tree, stop and say so instead of touching them.
- Work on a short branch: `backend/M12.5-hce-inc`, per CLAUDE.md §2 and the pattern D1 used.
- Commit ONLY the files this module produces or modifies — models, migration, seed, tests,
  docs, and the session prompt. Name them explicitly in `git add`; never `git add -A`.
- Do NOT merge and do NOT push. Leave the branch for review.

=== REPORT AT THE END ===
Numbers first: tables before/after, tests passed/skipped, new migration id, catalogues seeded
with row counts and their normative-vs-fixture classification.
Then: every decision you made that the plan did not dictate, with its reasoning.
Then: everything you found contradictory, underspecified or in conflict with the repo —
surfaced, not resolved.