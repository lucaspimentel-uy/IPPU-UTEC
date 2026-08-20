# `docs/prompts/` — prompts de sesión

Acá viven los prompts largos con los que se arranca una sesión de trabajo (Claude o persona): el encargo
de una ronda, el guion de una limpieza, la instrucción de un refactor.

**Por qué existe esta carpeta** (2026-08-20, `handoff.md` §5.29). Los prompts de sesión estaban quedando
sueltos en la **raíz del repo**, junto a `handoff.md`, `CLAUDE.md` y `README.md` — que son los tres
documentos que alguien que clona tiene que leer sí o sí. Mezclar un encargo puntual y con fecha de
vencimiento con el contexto permanente del proyecto le sube el ruido a lo que menos ruido debería tener.

## Convención

- Un archivo por sesión o por ronda: `prompt-<qué>-<cuándo>.md`.
- **Se conservan**, no se borran al terminar: son el registro de qué se pidió, que es distinto de lo que se
  decidió (`handoff.md` §5) y de lo que se hizo (`handoff.md` §13). Cuando una decisión sorprende, el
  prompt explica de dónde salió.
- No son normativos. Si un prompt y `handoff.md` §5 se contradicen, **gana §5** (regla anti-contradicción,
  §12.6): un prompt es un encargo, una decisión de §5 es un acuerdo del equipo.

## Pendiente

- [ ] **Mover `prompt-sesion-demo-F1-ajustes-frontend.md` de la raíz a esta carpeta.** Hoy vive en la raíz
      **de la rama `demo/F1-navegacion`**, no en `main`. No se movió a propósito: F1 es una ronda abierta
      y tocar sus archivos ahora fabrica un conflicto de merge que hoy no existe. **Se mueve cuando F1
      aterrice.**
