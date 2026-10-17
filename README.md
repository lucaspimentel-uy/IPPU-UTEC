# Proyecto IPPU × UTEC-LIDIA

Repositorio de trabajo del convenio entre la **Fundación IPPU** (Instituto Psico-Pedagógico Uruguayo) y
**UTEC-LIDIA** (Licenciatura en Ingeniería de Datos e IA) para aplicar inteligencia artificial y ciencia de datos
a la atención de **niños, niñas y adolescentes (NNA) con TEA**.

## Las cuatro líneas

| Línea | Tema |
|---|---|
| **L1** ⭐ | Historia Clínica Electrónica (HCE) + inventario **IDEA** + analítica institucional |
| L2 | Pictogramas personalizados con IA (CAA/AAC) |
| L3 | Asistente virtual (chatbot RAG) para técnicos, familias y docentes |
| L4 | Patrones de visualización / dashboards (incl. eye-tracking) |

## Estado de la Línea 1 (octubre de 2026)

La L1 tiene un **backend** (API FastAPI sobre PostgreSQL) con la cadena anual de evaluación —consentimiento,
línea base IDEA, protocolos A y B con su variación, informe de cierre— y la valoración funcional, y una **demo web
conectada a esa API**: ingresar, listar y abrir expedientes, editarlos y firmar cada módulo. Lo que todavía no está
conectado se ve en pantalla como «Modo demostración — no se guarda». El objetivo es llegar al **2026-11-26** con un
prototipo presentable que usa **sólo datos simulados**.

## Cómo correrlo

Backend, base de datos, demo y verificación: [`CLAUDE.md`](CLAUDE.md), sección «Cómo correr». La demo necesita la
API arriba y se sirve en `http://localhost:5500`; no abre desde un archivo local.

## Dónde está cada cosa

- **Estado actual, decisiones y pendientes:** [`handoff.md`](handoff.md) (empezar por su cabecera).
- **Mapa de carpetas y archivos:** [`docs/estructura-repositorio.md`](docs/estructura-repositorio.md).
- **Reglas para trabajar en el repo** (también las lee Claude Code): [`CLAUDE.md`](CLAUDE.md).
- **Documentación de IPPU ya convertida a Markdown:** `docs/markdown/`.
- **Qué falta definir con IPPU:** `docs/notas/puntos-a-validar.md`.

## Equipo

- **UTEC-LIDIA (estudiantes):** Samuel Furtado, Lucas Pimentel, Victor Uria.
- **UTEC (referentes):** Matías López, Vitalio Alfonso Reguera.
- **IPPU:** Fernando Sierra (Director).

## Privacidad

Trabajar **sólo con datos simulados o anonimizados** mientras no exista un acuerdo de confidencialidad firmado con
IPPU. Los datos de los NNA son sensibles: no subir identificadores ni imágenes reales a servicios externos.
