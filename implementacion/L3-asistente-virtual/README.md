# L3 — Asistente virtual

Asistente para técnicos de IPPU que responde **sólo con documentos autorizados**, siempre con cita, con límites
clínicos y derivación a un humano. El plan, las decisiones y los límites viven en
[`docs/planes/L3-asistente-plan.md`](../../docs/planes/L3-asistente-plan.md); este README sólo dice cómo se
trabaja acá (`handoff.md` §5.128 y §5.129).

## Estructura
```
L3-asistente-virtual/
├── asistente/      # código del servicio (F1-b en adelante)
├── eval/           # banco de evaluación (banco-v0.md: 30 casos en 15 pares)
└── tests/          # pytest
```

## Cómo correrlo (PowerShell, desde esta carpeta)
```
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m pytest -q
```

## Reglas
- No se toca la carpeta de la HCE (Línea 1) ni se importa nada de ella. Entorno y dependencias propios.
- Sólo datos simulados. Ningún documento de IPPU va a una API hospedada sin autorización escrita (plan §2.4).
- Ramas cortas `l3/<tema>`; al cerrar, entrada en `docs/bitacora.md` y casilla de `handoff.md` §6.
