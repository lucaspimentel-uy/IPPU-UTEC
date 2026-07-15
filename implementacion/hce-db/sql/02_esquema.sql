-- =====================================================================
-- HCE IPPU — 02. Esquema (tablas, constraints, índices)
-- Mapea el §6 del documento técnico a un modelo relacional + JSONB.
--
-- Criterio de diseño (enfoque mixto):
--   · Relacional para IDENTIDAD y RELACIONES  → integridad referencial,
--     claves de negocio, índices de búsqueda (§3.3), estadística (§9).
--   · JSONB para el CONTENIDO de cada instrumento (dimensiones/ítems,
--     firmas, excepciones, envíos/gestiones) → encaje natural con los
--     documentos anidados del §6 y flexibilidad para portabilidad (§8.3).
--   · Los TOTALES derivados se materializan en columnas (validados por
--     trigger contra el detalle JSONB) para consultas e informes rápidos.
-- =====================================================================
SET search_path TO hce, public;

-- =====================================================================
-- A. PARAMETRIZACIÓN INSTITUCIONAL (portabilidad §8.3)
--    Ninguna regla de IPPU está hardcodeada: vive como dato editable.
-- =====================================================================

-- Configuración singleton de la institución.
CREATE TABLE IF NOT EXISTS config_institucion (
    id                     smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    nombre_institucion     text NOT NULL,
    servicios_habilitados  hce.servicio[] NOT NULL DEFAULT '{atencion_diurna}',
    marca_agua_export      text,                 -- §8.4 recomendado
    creado_en              timestamptz NOT NULL DEFAULT now()
);

-- Tabla de categorías del Baremo Único Nacional (§7.2). PARAMETRIZABLE:
-- los rangos se validan contra la reglamentación vigente del Consejo Asesor.
CREATE TABLE IF NOT EXISTS baremo_categoria (
    id        serial PRIMARY KEY,
    nombre    text NOT NULL,                      -- 'Leve', 'Moderado', ...
    pct_min   smallint NOT NULL CHECK (pct_min BETWEEN 0 AND 100),
    pct_max   smallint NOT NULL CHECK (pct_max BETWEEN 0 AND 100),
    orden     smallint,
    vigente   boolean NOT NULL DEFAULT true,
    CHECK (pct_min <= pct_max)
);

-- Categorías de documentos adjuntos (§3.2 HCE-DOC, §8.3 parametrizable).
CREATE TABLE IF NOT EXISTS categoria_documento (
    id                    serial PRIMARY KEY,
    nombre                text UNIQUE NOT NULL,
    es_registro_historico boolean NOT NULL DEFAULT false,  -- §10 migración
    orden                 smallint
);

-- Vocabulario controlado del sistema (§8.1). Constante de producto:
-- «severo / muy severo», nunca «grave». Se consulta desde la app/informes.
CREATE TABLE IF NOT EXISTS vocabulario (
    clave     text PRIMARY KEY,                   -- 'severidad_alta'
    termino   text NOT NULL,                      -- 'severo'
    prohibido text[] NOT NULL DEFAULT '{}'        -- {'grave','muy grave'}
);

-- Recordatorios configurables (§4.4). Nunca fechas límite bloqueantes.
CREATE TABLE IF NOT EXISTS recordatorio_config (
    id          serial PRIMARY KEY,
    clave       text UNIQUE NOT NULL,             -- 'idea_ingreso'
    descripcion text NOT NULL,
    referencia  text,                             -- momento de referencia
    activo      boolean NOT NULL DEFAULT true
);

-- =====================================================================
-- B. CATÁLOGOS DE INSTRUMENTOS (data-driven, §5)
--    El protocolo vive en la base, no en el código: si IPPU ajusta un
--    descriptor se cambia el dato (una sola fuente de verdad).
-- =====================================================================

-- IDEA (Rivière, 2001) — 4 escalas.
CREATE TABLE IF NOT EXISTS idea_escala (
    id     smallint PRIMARY KEY CHECK (id BETWEEN 1 AND 4),
    letra  char(1) NOT NULL,                      -- A..D
    nombre text NOT NULL,
    orden  smallint NOT NULL
);

-- IDEA — 12 dimensiones (D1..D12), con criterios de anclaje consultables.
CREATE TABLE IF NOT EXISTS idea_dimension (
    id         smallint PRIMARY KEY CHECK (id BETWEEN 1 AND 12),  -- D1..D12
    escala_id  smallint NOT NULL REFERENCES idea_escala(id),
    nombre     text NOT NULL,
    que_evalua text,                              -- «qué evalúa» (§5.1)
    -- Anclajes {"8":..,"6":..,"4":..,"2":..,"0":..} (§5.1 panel desplegable).
    anclajes   jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Escala IPPU-TEA — 4 escalas conceptuales (E1..E4).
CREATE TABLE IF NOT EXISTS ippu_escala (
    id     smallint PRIMARY KEY CHECK (id BETWEEN 1 AND 4),
    codigo text NOT NULL,                         -- 'E1'..'E4'
    nombre text NOT NULL,
    orden  smallint NOT NULL
);

-- Escala IPPU-TEA — 24 ítems (6 por escala), con referencia documental.
CREATE TABLE IF NOT EXISTS ippu_item (
    id               smallint PRIMARY KEY CHECK (id BETWEEN 1 AND 24),
    escala_id        smallint NOT NULL REFERENCES ippu_escala(id),
    numero_en_escala smallint NOT NULL CHECK (numero_en_escala BETWEEN 1 AND 6),
    texto            text NOT NULL,
    referencia       text,                        -- cita = referencia, no indicación (§8.2)
    UNIQUE (escala_id, numero_en_escala)
);

-- =====================================================================
-- C. PERSONAS Y ESTRUCTURA INSTITUCIONAL
-- =====================================================================

-- Profesional = evaluador + usuario del sistema (§3.1, §9).
CREATE TABLE IF NOT EXISTS profesional (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre          text NOT NULL,
    email           citext UNIQUE,
    especialidad    text,
    cargo           text,
    rol             hce.rol_sistema NOT NULL DEFAULT 'tecnico',
    hashed_password text,                         -- autenticación (Fase 4)
    activo          boolean NOT NULL DEFAULT true,
    creado_en       timestamptz NOT NULL DEFAULT now()
);

-- Persona = identidad única transversal a los servicios (§3.1).
CREATE TABLE IF NOT EXISTS persona (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        text NOT NULL,
    apellido      text,
    ci            text UNIQUE,                    -- cédula (índice de búsqueda §3.3)
    fnac          date,
    sexo          text CHECK (sexo IN ('M','F','X')),
    creado_en     timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- servicios[] del §6 → tabla puente (integridad referencial).
CREATE TABLE IF NOT EXISTS persona_servicio (
    persona_id uuid NOT NULL REFERENCES persona(id) ON DELETE CASCADE,
    servicio   hce.servicio NOT NULL,
    PRIMARY KEY (persona_id, servicio)
);

-- Grupo de referencia (§3.1). Roles de técnicos con ETIQUETA configurable.
CREATE TABLE IF NOT EXISTS grupo (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre       text NOT NULL,
    anio         smallint NOT NULL,
    tecnico1_id  uuid REFERENCES profesional(id),
    tecnico1_rol text,                            -- p.ej. 'Psicólogo/a' (configurable)
    tecnico2_id  uuid REFERENCES profesional(id),
    tecnico2_rol text,                            -- p.ej. 'Maestro/a' (configurable)
    obs          text,
    CHECK (tecnico1_id IS NULL OR tecnico2_id IS NULL OR tecnico1_id <> tecnico2_id),
    UNIQUE (nombre, anio)
);

-- otros_tecnicos[] del §6 → puente con alcance de participación (§9).
CREATE TABLE IF NOT EXISTS grupo_otro_tecnico (
    grupo_id       uuid NOT NULL REFERENCES grupo(id) ON DELETE CASCADE,
    profesional_id uuid NOT NULL REFERENCES profesional(id),
    alcance        text,                          -- 'texto libre PA/PB/IC'
    PRIMARY KEY (grupo_id, profesional_id)
);

-- =====================================================================
-- D. HCE INDIVIDUAL — Servicio de Atención Diurna
-- =====================================================================
CREATE TABLE IF NOT EXISTS hce_diurna (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id    uuid NOT NULL REFERENCES persona(id),
    hc            text,                           -- N.º histórico (identificador secundario §3.3/§10)
    grupo_id      uuid REFERENCES grupo(id),
    anio          smallint NOT NULL,
    diagnostico   text,
    cie11         text,
    nivel_soporte text,                           -- orientativo (§3.2). Vocabulario controlado.
    anamnesis     jsonb NOT NULL DEFAULT '{}'::jsonb,  -- HCE-00, siempre abierto (§3.2)
    creado_en     timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    UNIQUE (persona_id)                           -- una HCE de diurna por persona (reingreso reusa la identidad)
);

-- =====================================================================
-- E. GESTIÓN DOCUMENTAL (§3.2 HCE-DOC, §8.4)
--    Se declara antes que los módulos que referencian adjuntos.
-- =====================================================================
CREATE TABLE IF NOT EXISTS documento (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hce_id                uuid NOT NULL REFERENCES hce_diurna(id) ON DELETE CASCADE,
    categoria_id          integer REFERENCES categoria_documento(id),
    nombre                text NOT NULL,
    fecha_original        date,
    fecha_carga           timestamptz NOT NULL DEFAULT now(),
    archivo_uri           text,                   -- archivo_id → referencia al almacenamiento
    es_registro_historico boolean NOT NULL DEFAULT false  -- §10 migración
);

-- Foto: individual (hce_id) o grupal (grupo_id), NUNCA ambas (§6).
-- La protección de imagen (§8.4) se aplica por trigger (03_...).
CREATE TABLE IF NOT EXISTS foto (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hce_id      uuid REFERENCES hce_diurna(id) ON DELETE CASCADE,
    grupo_id    uuid REFERENCES grupo(id) ON DELETE CASCADE,
    descripcion text,
    fecha       date,
    archivo_uri text,
    CHECK ((hce_id IS NOT NULL) <> (grupo_id IS NOT NULL))  -- exactamente una
);

-- =====================================================================
-- F. MÓDULOS PREVIOS A LA EVALUACIÓN
-- =====================================================================

-- HCE-CI — Consentimiento informado (§3.2). Único bloqueo sin excepción.
CREATE TABLE IF NOT EXISTS consentimiento (
    hce_id     uuid PRIMARY KEY REFERENCES hce_diurna(id) ON DELETE CASCADE,
    firmante   text,
    fecha      date,
    adjunto_id uuid REFERENCES documento(id),
    estado     hce.estado_consentimiento NOT NULL DEFAULT 'pendiente'
);

-- Autorización de uso de imagen (§8.4).
CREATE TABLE IF NOT EXISTS autorizacion_imagen (
    hce_id     uuid PRIMARY KEY REFERENCES hce_diurna(id) ON DELETE CASCADE,
    estado     hce.estado_autorizacion NOT NULL DEFAULT 'pendiente',
    fecha      date,
    adjunto_id uuid REFERENCES documento(id)
);

-- =====================================================================
-- G. INSTRUMENTOS DE EVALUACIÓN
--    Patrón común: contenido en JSONB, totales derivados en columnas,
--    firmas[] y excepciones[] en JSONB, estado + firmado_en.
-- =====================================================================

-- HCE-LB — Línea base IDEA (§5.1). Un IDEA por HCE (reingreso >12m: nuevo).
CREATE TABLE IF NOT EXISTS idea (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hce_id         uuid NOT NULL UNIQUE REFERENCES hce_diurna(id) ON DELETE CASCADE,
    fecha          date,
    sesiones_obs   smallint,
    -- dimensiones: [{ "n":1, "valor":0-8|null, "ns":bool, "obs":"" } × 12]
    dimensiones    jsonb NOT NULL DEFAULT '[]'::jsonb,
    total_e1       smallint CHECK (total_e1 BETWEEN 0 AND 24),  -- derivados, validados por trigger
    total_e2       smallint CHECK (total_e2 BETWEEN 0 AND 24),
    total_e3       smallint CHECK (total_e3 BETWEEN 0 AND 24),
    total_e4       smallint CHECK (total_e4 BETWEEN 0 AND 24),
    total          smallint CHECK (total BETWEEN 0 AND 96),
    sintesis       text,
    objetivos      text,
    migrado_origen jsonb,                         -- {origen, fecha_original, verificado} (§10)
    firmas         jsonb NOT NULL DEFAULT '[]'::jsonb,   -- firma doble
    excepciones    jsonb NOT NULL DEFAULT '[]'::jsonb,   -- habilitación excepcional (§4.2)
    estado         hce.estado_modulo NOT NULL DEFAULT 'bloqueado',
    firmado_en     timestamptz,
    creado_en      timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- HCE-PA / HCE-PB — Protocolos A y B, Escala IPPU-TEA (§5.2).
CREATE TABLE IF NOT EXISTS protocolo (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hce_id         uuid NOT NULL REFERENCES hce_diurna(id) ON DELETE CASCADE,
    tipo           hce.tipo_protocolo NOT NULL,
    fecha          date,
    semanas        smallint,
    -- items: [{ "n":1, "escala":1, "valor":1-5|null, "obs":"" } × 24]
    items          jsonb NOT NULL DEFAULT '[]'::jsonb,
    total_e1       smallint CHECK (total_e1 BETWEEN 6 AND 30),
    total_e2       smallint CHECK (total_e2 BETWEEN 6 AND 30),
    total_e3       smallint CHECK (total_e3 BETWEEN 6 AND 30),
    total_e4       smallint CHECK (total_e4 BETWEEN 6 AND 30),
    total          smallint CHECK (total BETWEEN 24 AND 120),
    sint_tecnico1  text,
    sint_tecnico2  text,
    otros          text,                          -- aportes de otros técnicos (§9)
    ajustes        text,                          -- solo B
    -- deltas (solo B): {"e1":Δ,"e2":Δ,"e3":Δ,"e4":Δ,"total":Δ}. B − A ÚNICAMENTE.
    deltas         jsonb,
    firmas         jsonb NOT NULL DEFAULT '[]'::jsonb,
    excepciones    jsonb NOT NULL DEFAULT '[]'::jsonb,
    estado         hce.estado_modulo NOT NULL DEFAULT 'bloqueado',
    firmado_en     timestamptz,
    creado_en      timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    UNIQUE (hce_id, tipo)
);

-- HCE-IC — Informe de Cierre Anual (§5.3). Versión única, exportable a PDF.
CREATE TABLE IF NOT EXISTS informe_cierre (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    hce_id         uuid NOT NULL UNIQUE REFERENCES hce_diurna(id) ON DELETE CASCADE,
    fecha          date,
    sint_escala    jsonb NOT NULL DEFAULT '[]'::jsonb,   -- síntesis por escala [4]
    sint_tecnico1  text,
    sint_tecnico2  text,
    recomendaciones text,
    orientaciones  text,
    recibi_familia jsonb,                          -- {recibido:bool, fecha, firmante}
    pdf_id         uuid REFERENCES documento(id),
    firmas         jsonb NOT NULL DEFAULT '[]'::jsonb,
    excepciones    jsonb NOT NULL DEFAULT '[]'::jsonb,
    estado         hce.estado_modulo NOT NULL DEFAULT 'bloqueado',
    firmado_en     timestamptz,
    creado_en      timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- =====================================================================
-- H. ÁREAS DE ORGANISMOS (§3.2 HCE-ORG)
-- =====================================================================
CREATE TABLE IF NOT EXISTS organismo_inau (
    hce_id    uuid PRIMARY KEY REFERENCES hce_diurna(id) ON DELETE CASCADE,
    sipi      text,
    convenio  text,
    referente text,
    ingreso   date,
    obs       text,
    envios    jsonb NOT NULL DEFAULT '[]'::jsonb   -- [{fecha, txt}]
);

CREATE TABLE IF NOT EXISTS organismo_bps (
    hce_id      uuid PRIMARY KEY REFERENCES hce_diurna(id) ON DELETE CASCADE,
    prestacion  text,
    tramite     text,
    estado      text,
    vencimiento date,
    obs         text,
    gestiones   jsonb NOT NULL DEFAULT '[]'::jsonb  -- [{fecha, txt}]
);

-- =====================================================================
-- I. VALORACIÓN FUNCIONAL (§7 HCE-VF)
--    categoria_id se DERIVA del pct vía baremo_categoria (por trigger),
--    NUNCA desde puntajes clínicos (salvaguarda §7.5).
-- =====================================================================
CREATE TABLE IF NOT EXISTS valoracion_funcional (
    hce_id             uuid PRIMARY KEY REFERENCES hce_diurna(id) ON DELETE CASCADE,
    estado             text,                       -- 'No iniciado'|'En trámite'|'Valorado'
    fecha              date,
    organismo          text,
    pct                smallint CHECK (pct BETWEEN 0 AND 100),
    categoria_id       integer REFERENCES baremo_categoria(id),  -- derivada de pct
    vigencia           date,
    rnpcd              text,
    -- dominios CIF: 6 dominios con nivel de autonomía (§7.3)
    dominios           jsonb NOT NULL DEFAULT '{}'::jsonb,
    capacidades        text,
    barreras           text,
    apoyos             text,
    sintesis_funcional text,
    obs                text
);

-- =====================================================================
-- J. AUDITORÍA (§3.2 HCE-LOG, §9) — SOLO INSERCIÓN
--    Inalterable: el trigger de 03_... impide UPDATE/DELETE.
-- =====================================================================
CREATE TABLE IF NOT EXISTS auditoria (
    id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    hce_id         uuid REFERENCES hce_diurna(id),
    usuario_id     uuid REFERENCES profesional(id),
    ts             timestamptz NOT NULL DEFAULT now(),
    modulo         text NOT NULL,                  -- 'HCE-LB', 'HCE-PA', ...
    campo          text,
    valor_anterior text,
    valor_nuevo    text,
    tipo           hce.tipo_auditoria NOT NULL
);

-- =====================================================================
-- K. ÍNDICES
-- =====================================================================
-- Búsqueda por tres vías (§3.3): cédula, N.º de HC, grupo de referencia.
CREATE INDEX IF NOT EXISTS ix_persona_ci        ON persona(ci);
CREATE INDEX IF NOT EXISTS ix_hce_hc            ON hce_diurna(hc);
CREATE INDEX IF NOT EXISTS ix_hce_grupo         ON hce_diurna(grupo_id);
CREATE INDEX IF NOT EXISTS ix_hce_persona       ON hce_diurna(persona_id);
-- Navegación grupo → integrante (§3.3).
CREATE INDEX IF NOT EXISTS ix_grupo_tecnico1    ON grupo(tecnico1_id);
CREATE INDEX IF NOT EXISTS ix_grupo_tecnico2    ON grupo(tecnico2_id);
-- Módulos por HCE.
CREATE INDEX IF NOT EXISTS ix_protocolo_hce     ON protocolo(hce_id);
CREATE INDEX IF NOT EXISTS ix_documento_hce     ON documento(hce_id);
CREATE INDEX IF NOT EXISTS ix_foto_hce          ON foto(hce_id);
CREATE INDEX IF NOT EXISTS ix_foto_grupo        ON foto(grupo_id);
-- Auditoría: consultas por expediente y por fecha.
CREATE INDEX IF NOT EXISTS ix_auditoria_hce_ts  ON auditoria(hce_id, ts DESC);
-- Consulta del detalle JSONB por dimensión/ítem (analítica longitudinal).
CREATE INDEX IF NOT EXISTS ix_idea_dim_gin      ON idea      USING gin (dimensiones);
CREATE INDEX IF NOT EXISTS ix_protocolo_items_gin ON protocolo USING gin (items);
