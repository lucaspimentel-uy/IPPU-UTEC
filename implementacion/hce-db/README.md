# HCE IPPU — Base de datos (PostgreSQL + JSONB)

Base de datos de la **Historia Clínica Electrónica** del Servicio de Atención Diurna (Fase 1),
según el **Documento Técnico UTEC-LIDIA v1.0** (§6) y el prototipo `HCE_IPPU_Prototipo_v1.html`.

Motor: **PostgreSQL 13+** (verificado end-to-end en PostgreSQL 18). Enfoque **relacional + JSONB**.
Diseño y fundamentos en [`docs/modelo-datos.md`](docs/modelo-datos.md).

## Estructura

```
hce-db/
├─ README.md
├─ docs/
│  └─ modelo-datos.md          # diseño, mapeo §6, reglas de negocio
└─ sql/
   ├─ 00_run_all.sql           # orquestador (\i en orden)
   ├─ 01_extensiones_tipos.sql # pgcrypto, citext, esquema hce, ENUMs
   ├─ 02_esquema.sql           # tablas, constraints, índices
   ├─ 03_funciones_triggers.sql# reglas de negocio (firma, auditoría, no-homologabilidad…)
   ├─ 04_seed_catalogos.sql    # IDEA, IPPU-TEA, baremo, vocabulario, categorías
   └─ 05_seed_demo.sql         # 4 usuarios demo del prototipo (§11)
```

Todo vive en el esquema `hce` (no contamina `public`).

## Puesta en marcha

Con PostgreSQL instalado y un usuario con permiso para crear bases:

```bash
# 1) crear la base
createdb hce_ippu            # o:  psql -U postgres -c "CREATE DATABASE hce_ippu;"

# 2) ejecutar todo el pipeline (desde la carpeta sql/)
cd sql
psql "postgresql://postgres@localhost:5432/hce_ippu" -v ON_ERROR_STOP=1 -f 00_run_all.sql
```

En Windows con la instalación estándar de PostgreSQL:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"; $env:PGCLIENTENCODING = "UTF8"
psql -U postgres -c "CREATE DATABASE hce_ippu;"
psql -U postgres -d hce_ippu -v ON_ERROR_STOP=1 -f sql\00_run_all.sql
```

> **Codificación:** los archivos `.sql` están en UTF-8. Si ejecutás sentencias sueltas con
> `psql -c` desde una terminal, exportá `PGCLIENTENCODING=UTF8` para no romper las tildes.

Al terminar, el seed imprime un resumen del estado de cada demo:

```
Usuario demo 1 | CI=firmado   | IDEA=firmado (58/96) | PROT=[A:firmado B:firmado] | IC=firmado
Usuario demo 2 | CI=firmado   | IDEA=firmado (31/96) | PROT=[A:borrador]          | IC=<NULL>
Usuario demo 3 | CI=firmado   | IDEA=borrador (72/96)| PROT=[<NULL>]              | IC=<NULL>
Usuario demo 4 | CI=pendiente | IDEA=<NULL>          | PROT=[<NULL>]              | IC=<NULL>
```

## API de datos (funciones de dominio)

La aplicación debería operar el ciclo clínico a través de estas funciones (encapsulan las reglas):

```sql
-- Firma atómica: firma + bloqueo + asiento en HCE-LOG en una transacción.
SELECT hce.firmar_modulo('idea'|'protocolo'|'informe_cierre', <id>, <profesional_id>, <rol>);

-- Habilitación fuera de secuencia con constancia obligatoria (queda trazada).
SELECT hce.habilitar_excepcional('protocolo', <id>, <profesional_id>, '<motivo>');

-- Sugerencia de secuencia (informa, no bloquea).
SELECT * FROM hce.sugerencia_secuencia(<hce_id>, 'HCE-PA');
```

Corrección de un módulo firmado (addenda controlada):

```sql
BEGIN;
  SET LOCAL hce.modo = 'addenda';
  UPDATE hce.idea SET objetivos = objetivos || ' [addenda …]' WHERE id = <id>;
COMMIT;
```

## Búsqueda (§3.3)

Índices listos para las tres vías: `persona.ci`, `hce_diurna.hc`, `hce_diurna.grupo_id`
(y navegación grupo → integrante → HCE).

## Reejecución

Los catálogos usan *upsert* (`ON CONFLICT`) y el seed demo usa IDs fijos con `ON CONFLICT DO NOTHING`.
Para una carga totalmente limpia, recrear la base (`DROP DATABASE` / `CREATE DATABASE`) y correr
`00_run_all.sql` de nuevo.

## Estado de verificación

Pipeline completo ejecutado en PostgreSQL 18 sin errores. Reglas verificadas: cálculo de totales
IDEA/IPPU-TEA y Δ (B−A), bloqueo por firma + addenda, firma-requiere-CI, auditoría inalterable,
protección de imagen (individual y grupal), derivación del baremo desde el %, `firmar_modulo`,
`habilitar_excepcional` y `sugerencia_secuencia`. Ver tabla en `docs/modelo-datos.md §4`.
