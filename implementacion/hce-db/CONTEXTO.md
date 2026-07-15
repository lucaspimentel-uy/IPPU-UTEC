# Contexto — Creación de la base de datos HCE IPPU

> Registro de la sesión de trabajo en la que se diseñó y verificó la base de datos.
> Fecha: 2026-07-15 · Motor elegido: **PostgreSQL 13+ / JSONB (enfoque mixto)**.

## 1. Punto de partida

- **Especificación:** `1_Documento_Tecnico_UTEC-LIDIA.docx.md` (Documento Técnico UTEC-LIDIA v1.0),
  con el modelo de datos en el **§6** y las reglas de negocio distribuidas por todo el documento.
- **Referencia de comportamiento:** prototipo `HCE_IPPU_Prototipo_v1.html` (cálculos, validaciones,
  habilitación excepcional, 4 usuarios demo).
- **Alcance:** Fase 1 — Servicio de Atención Diurna (ciclo IDEA → Protocolos A/B → Informe de Cierre,
  gestión documental, organismos INAU/BPS, valoración funcional, auditoría).

## 2. Decisión de motor de base de datos

El usuario había pensado en **MongoDB** (documental) pero estaba abierto a sugerencias. Tras analizar
el dominio (HCE con valor legal, integridad referencial, firma+bloqueo atómicos, auditoría inalterable,
estadística agregada, portabilidad institucional) se recomendó y se eligió:

> **PostgreSQL + JSONB (enfoque mixto)**
> - **Relacional** para identidad, relaciones y auditoría (integridad, transacciones ACID, índices).
> - **JSONB** para el contenido anidado de los instrumentos (12 dimensiones, 24 ítems, firmas,
>   excepciones, envíos/gestiones) — encaje natural con los documentos del §6 y flexibilidad para
>   la portabilidad (§8.3).
> - **Totales derivados** materializados en columnas y validados por trigger contra el detalle JSONB.

El §6 del documento permite explícitamente implementación *«relacional, documental o mixta»*.

## 3. Hallazgo importante: backend relacional previo desactualizado

Existe una implementación anterior en `IPPU-UTEC-main/implementacion/L1-hce-idea/`
(SQLAlchemy + Alembic + FastAPI). **Está desactualizada** respecto a la spec nueva:

- Modela la escala Likert con **36 ítems**; la spec nueva define la Escala IPPU-TEA con **24**.
- Tiene tablas "provisionales" de áreas/general que el documento nuevo dice **no** forzar a campos
  estructurados (§10).

El diseño nuevo en `hce-db/` reemplaza ese modelo. **Pendiente de decisión en equipo:** archivar L1.

## 4. Qué se entregó

Todo bajo `IPPU-UTEC-main/implementacion/hce-db/`:

```
hce-db/
├─ README.md                     · puesta en marcha + API de datos
├─ CONTEXTO.md                   · este archivo
├─ docs/
│  └─ modelo-datos.md            · diseño, mapeo §6, reglas, decisiones abiertas
└─ sql/
   ├─ 00_run_all.sql             · orquestador (\i en orden)
   ├─ 01_extensiones_tipos.sql   · pgcrypto, citext, esquema hce, ENUMs
   ├─ 02_esquema.sql             · tablas, constraints, índices
   ├─ 03_funciones_triggers.sql  · reglas de negocio
   ├─ 04_seed_catalogos.sql      · IDEA, IPPU-TEA, baremo, vocabulario, categorías
   └─ 05_seed_demo.sql           · 4 usuarios demo del prototipo (§11)
```

Todo el esquema vive en el namespace `hce` (no contamina `public`).

### Tablas principales (mapeo §6)

- **Identidad/estructura:** `persona` (+ `persona_servicio`), `profesional`, `grupo`
  (+ `grupo_otro_tecnico`), `hce_diurna`.
- **Módulos evaluativos:** `idea` (HCE-LB), `protocolo` (HCE-PA/PB), `informe_cierre` (HCE-IC).
- **Previos/soporte:** `consentimiento` (HCE-CI), `autorizacion_imagen`, `documento`, `foto` (HCE-DOC).
- **Organismos/valoración:** `organismo_inau`, `organismo_bps` (HCE-ORG), `valoracion_funcional` (HCE-VF).
- **Auditoría:** `auditoria` (HCE-LOG, solo inserción).
- **Catálogos/parámetros:** `idea_escala`/`idea_dimension`, `ippu_escala`/`ippu_item`,
  `baremo_categoria`, `categoria_documento`, `vocabulario`, `recordatorio_config`, `config_institucion`.

## 5. Reglas de negocio implementadas en la base (no solo en la UI)

| Regla (documento) | Implementación |
| :-- | :-- |
| Firma bloquea edición; corrección por addenda (§4.1) | `bloqueo_por_firma()` + `SET LOCAL hce.modo='addenda'` |
| Sin consentimiento no se firma nada (§4.2) | `firma_requiere_ci()` |
| Habilitación excepcional con constancia (§4.2) | `habilitar_excepcional()` → traza en HCE-LOG |
| Totales IDEA 0–96 / escala 0–24; sin NS al firmar (§4.3, §5.1) | `idea_validar()` |
| Totales IPPU-TEA 24–120; obs obligatoria en 1/5 (§5.2) | `protocolo_validar()` |
| **Δ solo B − A; nunca entre instrumentos** (§5.2 regla dura) | `protocolo_validar()` |
| Categoría del baremo derivada del %, no de puntajes clínicos (§7.5) | `vf_derivar_categoria()` |
| Protección de imagen individual y grupal (§8.4) | `foto_proteccion_imagen()` |
| Auditoría de solo inserción, inalterable (§9) | `auditoria_inalterable()` |
| Firma atómica (firma + bloqueo + HCE-LOG en una TX) | `firmar_modulo()` |
| Secuencia guiada, no impuesta (§4.1) | `sugerencia_secuencia()` |

## 6. Verificación realizada

Pipeline completo ejecutado en **PostgreSQL 18** (instalación local) sin errores. Se probó:

- Carga de esquema + catálogos + demo → resumen de estados por demo coincide con el prototipo.
- Cálculo por trigger: IDEA demo 1 = **58/96**, demo 2 = 31/96; Protocolo demo 1 A=60, B=79, **Δ total +19**.
- Casos negativos que deben fallar: editar módulo firmado, firmar sin CI, UPDATE de auditoría,
  foto sin autorización (individual y grupal) → todos rechazados con el mensaje de negocio correcto.
- Funciones de dominio: `firmar_modulo`, `habilitar_excepcional`, `sugerencia_secuencia`, addenda controlada.

### Bug encontrado y corregido durante la verificación

Las funciones de trigger referenciaban tablas sin calificar el esquema y fallaban con
*«no existe la relación»* cuando el `search_path` del cliente no incluía `hce`. Se corrigió fijando
`SET search_path = hce, public` en cada función (práctica segura recomendada).

## 7. Decisiones abiertas para revisión con IPPU

1. **`hce_diurna` 1:1 con `persona`** (ciclo anual en el `anio` de cada módulo). Si IPPU prefiere un
   expediente por ciclo lectivo → cambiar a `UNIQUE(persona_id, anio)`.
2. **Confiabilidad interjueces (κ de Cohen, §9):** las `firmas[]` ya guardan puntuación por evaluador
   con `tipo` (independiente/consenso); el cálculo de κ queda para la fase piloto (§12-D).
3. **Archivar el backend L1** relacional desactualizado.

## 8. Cómo levantarla

```bash
psql -U postgres -c "CREATE DATABASE hce_ippu;"
cd sql
psql -U postgres -d hce_ippu -v ON_ERROR_STOP=1 -f 00_run_all.sql
```

Detalles y variante Windows/PowerShell en [`README.md`](README.md).
