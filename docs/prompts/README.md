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

### Nombres (normalizados el 2026-08-26)

Los prompts que llegaron con el nombre que tenían en el chat —mayúsculas, espacios, tildes en el nombre de
archivo, un `.txt`— se renombraron **sin tocar una línea de contenido** a la convención de arriba. Un nombre
con espacios o con `Ó` obliga a comillas en cualquier comando y no viaja igual entre las tres máquinas del
equipo. Si buscás uno por el nombre viejo, está en la historia de git: los renombres se hicieron con
`git mv`, así que `git log --follow` los sigue.

## Pendiente

- [x] ~~**Mover `prompt-sesion-demo-F1-ajustes-frontend.md` de la raíz a esta carpeta.**~~ → **HECHO**
      (`281405b`, ver `handoff.md` §6). Se movió cuando F1 aterrizó, como decía este pendiente.
