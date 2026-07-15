-- =====================================================================
-- HCE IPPU — 03. Funciones y triggers (reglas de negocio en la BD)
-- Implementa a nivel de LÓGICA DE DATOS las reglas que el documento
-- exige que no queden solo en la interfaz (§5.2 regla dura, §9).
-- =====================================================================
SET search_path TO hce, public;

-- Nota: cada función fija su propio search_path (SET search_path = hce, public)
-- para que los triggers resuelvan las tablas del esquema hce sin importar el
-- search_path del cliente que dispara el INSERT/UPDATE. Es la práctica segura
-- recomendada para funciones invocadas desde contextos arbitrarios.

-- ---------------------------------------------------------------------
-- 0. updated_at automático
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_actualizado_en() RETURNS trigger AS $$
BEGIN
    NEW.actualizado_en := now();
    RETURN NEW;
END $$ LANGUAGE plpgsql SET search_path = hce, public;

DROP TRIGGER IF EXISTS trg_upd_persona    ON persona;
CREATE TRIGGER trg_upd_persona    BEFORE UPDATE ON persona
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();
DROP TRIGGER IF EXISTS trg_upd_hce        ON hce_diurna;
CREATE TRIGGER trg_upd_hce        BEFORE UPDATE ON hce_diurna
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

-- ---------------------------------------------------------------------
-- 1. Auditoría de SOLO INSERCIÓN (§3.2 HCE-LOG, §9)
--    Registro automático e inalterable: se prohíbe UPDATE y DELETE.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auditoria_inalterable() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'HCE-LOG es de solo inserción: no se permite % sobre auditoria', TG_OP;
END $$ LANGUAGE plpgsql SET search_path = hce, public;

DROP TRIGGER IF EXISTS trg_auditoria_no_upd ON auditoria;
CREATE TRIGGER trg_auditoria_no_upd BEFORE UPDATE OR DELETE ON auditoria
    FOR EACH ROW EXECUTE FUNCTION auditoria_inalterable();

-- ---------------------------------------------------------------------
-- 2. Bloqueo por firma (§4.1)
--    Una vez firmado, el módulo queda bloqueado para edición. Toda
--    corrección posterior se hace por ADDENDA, no editando el original.
--    Un procedimiento controlado puede habilitar la addenda/firma con
--    SET LOCAL hce.modo = 'firma' | 'addenda' dentro de su transacción.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION bloqueo_por_firma() RETURNS trigger AS $$
DECLARE modo text := current_setting('hce.modo', true);
BEGIN
    IF OLD.estado = 'firmado' AND coalesce(modo, '') NOT IN ('firma', 'addenda') THEN
        RAISE EXCEPTION
            'Módulo % firmado y bloqueado (%). Las correcciones se registran por addenda.',
            TG_TABLE_NAME, OLD.id
            USING HINT = 'Use el procedimiento de addenda (SET LOCAL hce.modo=''addenda'').';
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql SET search_path = hce, public;

-- ---------------------------------------------------------------------
-- 3. Firma requiere consentimiento (§4.2)
--    Única excepción no admitida: operar sin consentimiento firmado.
--    Al firmar IDEA/protocolo/informe, el CI debe estar firmado.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION firma_requiere_ci() RETURNS trigger AS $$
DECLARE ci_ok boolean;
BEGIN
    IF NEW.estado = 'firmado' AND (TG_OP = 'INSERT' OR OLD.estado <> 'firmado') THEN
        SELECT (estado = 'firmado') INTO ci_ok
          FROM consentimiento WHERE hce_id = NEW.hce_id;
        IF NOT coalesce(ci_ok, false) THEN
            RAISE EXCEPTION
                'No se puede firmar % sin consentimiento informado firmado (HCE-CI). Requisito legal, sin excepción (Ley 18.331).',
                TG_TABLE_NAME;
        END IF;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql SET search_path = hce, public;

-- ---------------------------------------------------------------------
-- 4. Validación y cálculo de totales — IDEA (§5.1)
--    · dimensiones: 12 objetos {n, valor, ns, obs} cuando no está bloqueado.
--    · valor 0..8 (impares admitidos) o ns=true (impide el cierre).
--    · totales por escala (0..24) y total (0..96) se CALCULAN aquí.
--    · al firmar: las 12 deben estar puntuadas (sin NS ni vacíos).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION idea_validar() RETURNS trigger AS $$
DECLARE
    d          jsonb;
    v          int;
    esc        int;
    n          int;
    t          int[] := ARRAY[0,0,0,0];
    faltantes  int := 0;
BEGIN
    IF NEW.estado <> 'bloqueado' THEN
        IF jsonb_typeof(NEW.dimensiones) <> 'array'
           OR jsonb_array_length(NEW.dimensiones) <> 12 THEN
            RAISE EXCEPTION 'IDEA: se requieren exactamente 12 dimensiones (recibidas %).',
                jsonb_array_length(NEW.dimensiones);
        END IF;

        FOR d IN SELECT * FROM jsonb_array_elements(NEW.dimensiones) LOOP
            n   := (d->>'n')::int;
            esc := ceil(n / 3.0);                 -- D1-3→1, D4-6→2, D7-9→3, D10-12→4
            IF coalesce((d->>'ns')::boolean, false) OR (d->>'valor') IS NULL THEN
                faltantes := faltantes + 1;
            ELSE
                v := (d->>'valor')::int;
                IF v < 0 OR v > 8 THEN
                    RAISE EXCEPTION 'IDEA dimensión D%: valor % fuera de rango 0..8.', n, v;
                END IF;
                t[esc] := t[esc] + v;
            END IF;
        END LOOP;

        NEW.total_e1 := t[1]; NEW.total_e2 := t[2];
        NEW.total_e3 := t[3]; NEW.total_e4 := t[4];
        NEW.total    := t[1] + t[2] + t[3] + t[4];

        IF NEW.estado = 'firmado' AND faltantes > 0 THEN
            RAISE EXCEPTION 'IDEA: no se puede firmar con % dimensión(es) en NS o sin puntuar.', faltantes;
        END IF;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql SET search_path = hce, public;

-- ---------------------------------------------------------------------
-- 5. Validación, totales y Δ — Protocolo IPPU-TEA (§5.2)
--    · items: 24 objetos {n, escala, valor, obs} cuando no está bloqueado.
--    · valor 1..5; observación obligatoria en ítems con valor 1 o 5.
--    · totales por escala (6..30) y total (24..120).
--    · Δ SOLO en B = B − A (jamás entre instrumentos distintos, §5.2).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION protocolo_validar() RETURNS trigger AS $$
DECLARE
    it         jsonb;
    v          int;
    esc        int;
    n          int;
    t          int[] := ARRAY[0,0,0,0];
    faltantes  int := 0;
    a          RECORD;
BEGIN
    IF NEW.estado <> 'bloqueado' THEN
        IF jsonb_typeof(NEW.items) <> 'array'
           OR jsonb_array_length(NEW.items) <> 24 THEN
            RAISE EXCEPTION 'Protocolo %: se requieren exactamente 24 ítems (recibidos %).',
                NEW.tipo, jsonb_array_length(NEW.items);
        END IF;

        FOR it IN SELECT * FROM jsonb_array_elements(NEW.items) LOOP
            n   := (it->>'n')::int;
            esc := ceil(n / 6.0);                 -- 6 ítems por escala
            IF (it->>'valor') IS NULL THEN
                faltantes := faltantes + 1;
            ELSE
                v := (it->>'valor')::int;
                IF v < 1 OR v > 5 THEN
                    RAISE EXCEPTION 'Protocolo % ítem %: valor % fuera de rango 1..5.', NEW.tipo, n, v;
                END IF;
                -- Observación obligatoria en 1 o 5 (integridad, §4.3).
                IF v IN (1,5) AND coalesce(btrim(it->>'obs'), '') = '' AND NEW.estado = 'firmado' THEN
                    RAISE EXCEPTION 'Protocolo % ítem %: valor % exige fundamentación (observación).', NEW.tipo, n, v;
                END IF;
                t[esc] := t[esc] + v;
            END IF;
        END LOOP;

        NEW.total_e1 := t[1]; NEW.total_e2 := t[2];
        NEW.total_e3 := t[3]; NEW.total_e4 := t[4];
        NEW.total    := t[1] + t[2] + t[3] + t[4];

        IF NEW.estado = 'firmado' AND faltantes > 0 THEN
            RAISE EXCEPTION 'Protocolo %: no se puede firmar con % ítem(es) sin puntuar.', NEW.tipo, faltantes;
        END IF;

        -- Δ solo para B, y solo B − A (regla dura de no homologabilidad §5.2).
        IF NEW.tipo = 'B' THEN
            SELECT total_e1, total_e2, total_e3, total_e4, total
              INTO a FROM protocolo
             WHERE hce_id = NEW.hce_id AND tipo = 'A' AND estado = 'firmado';
            IF FOUND AND NEW.total IS NOT NULL THEN
                NEW.deltas := jsonb_build_object(
                    'e1',    NEW.total_e1 - a.total_e1,
                    'e2',    NEW.total_e2 - a.total_e2,
                    'e3',    NEW.total_e3 - a.total_e3,
                    'e4',    NEW.total_e4 - a.total_e4,
                    'total', NEW.total    - a.total);
            END IF;
        ELSE
            NEW.deltas := NULL;                    -- A nunca tiene Δ
        END IF;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql SET search_path = hce, public;

-- ---------------------------------------------------------------------
-- 6. Protección de imagen de NNA (§8.4, Ley 17.823 art. 11)
--    · Foto individual: exige autorización de imagen 'autorizado'.
--    · Foto grupal: exige que TODOS los integrantes del grupo tengan
--      autorización registrada; informa quiénes faltan.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION foto_proteccion_imagen() RETURNS trigger AS $$
DECLARE faltan text;
BEGIN
    IF NEW.hce_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM autorizacion_imagen
                        WHERE hce_id = NEW.hce_id AND estado = 'autorizado') THEN
            RAISE EXCEPTION 'Foto individual sin autorización de uso de imagen registrada (§8.4).';
        END IF;
    ELSE
        SELECT string_agg(coalesce(p.nombre,'') || ' ' || coalesce(p.apellido,''), ', ')
          INTO faltan
          FROM hce_diurna h
          JOIN persona p ON p.id = h.persona_id
          LEFT JOIN autorizacion_imagen ai
                 ON ai.hce_id = h.id AND ai.estado = 'autorizado'
         WHERE h.grupo_id = NEW.grupo_id AND ai.hce_id IS NULL;
        IF faltan IS NOT NULL THEN
            RAISE EXCEPTION 'Foto grupal bloqueada: falta autorización de imagen de: %', faltan;
        END IF;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql SET search_path = hce, public;

DROP TRIGGER IF EXISTS trg_foto_proteccion ON foto;
CREATE TRIGGER trg_foto_proteccion BEFORE INSERT ON foto
    FOR EACH ROW EXECUTE FUNCTION foto_proteccion_imagen();

-- ---------------------------------------------------------------------
-- 7. Derivación de categoría del baremo (§7.2, §7.5)
--    categoria_id se deriva del PORCENTAJE oficial vía tabla configurable.
--    JAMÁS desde puntajes clínicos: esta función solo mira NEW.pct.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION vf_derivar_categoria() RETURNS trigger AS $$
BEGIN
    IF NEW.pct IS NULL THEN
        NEW.categoria_id := NULL;
    ELSE
        SELECT id INTO NEW.categoria_id
          FROM baremo_categoria
         WHERE vigente AND NEW.pct BETWEEN pct_min AND pct_max
         ORDER BY orden LIMIT 1;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql SET search_path = hce, public;

DROP TRIGGER IF EXISTS trg_vf_categoria ON valoracion_funcional;
CREATE TRIGGER trg_vf_categoria BEFORE INSERT OR UPDATE ON valoracion_funcional
    FOR EACH ROW EXECUTE FUNCTION vf_derivar_categoria();

-- ---------------------------------------------------------------------
-- 8. Cableado de triggers de los módulos evaluativos
--    Orden BEFORE: validar contenido/totales → chequear CI → set updated_at.
--    bloqueo_por_firma va aparte (solo UPDATE).
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_idea_validar ON idea;
CREATE TRIGGER trg_idea_validar BEFORE INSERT OR UPDATE ON idea
    FOR EACH ROW EXECUTE FUNCTION idea_validar();
DROP TRIGGER IF EXISTS trg_idea_ci ON idea;
CREATE TRIGGER trg_idea_ci BEFORE INSERT OR UPDATE ON idea
    FOR EACH ROW EXECUTE FUNCTION firma_requiere_ci();
DROP TRIGGER IF EXISTS trg_idea_bloqueo ON idea;
CREATE TRIGGER trg_idea_bloqueo BEFORE UPDATE ON idea
    FOR EACH ROW EXECUTE FUNCTION bloqueo_por_firma();
DROP TRIGGER IF EXISTS trg_idea_upd ON idea;
CREATE TRIGGER trg_idea_upd BEFORE UPDATE ON idea
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

DROP TRIGGER IF EXISTS trg_prot_validar ON protocolo;
CREATE TRIGGER trg_prot_validar BEFORE INSERT OR UPDATE ON protocolo
    FOR EACH ROW EXECUTE FUNCTION protocolo_validar();
DROP TRIGGER IF EXISTS trg_prot_ci ON protocolo;
CREATE TRIGGER trg_prot_ci BEFORE INSERT OR UPDATE ON protocolo
    FOR EACH ROW EXECUTE FUNCTION firma_requiere_ci();
DROP TRIGGER IF EXISTS trg_prot_bloqueo ON protocolo;
CREATE TRIGGER trg_prot_bloqueo BEFORE UPDATE ON protocolo
    FOR EACH ROW EXECUTE FUNCTION bloqueo_por_firma();
DROP TRIGGER IF EXISTS trg_prot_upd ON protocolo;
CREATE TRIGGER trg_prot_upd BEFORE UPDATE ON protocolo
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

DROP TRIGGER IF EXISTS trg_ic_ci ON informe_cierre;
CREATE TRIGGER trg_ic_ci BEFORE INSERT OR UPDATE ON informe_cierre
    FOR EACH ROW EXECUTE FUNCTION firma_requiere_ci();
DROP TRIGGER IF EXISTS trg_ic_bloqueo ON informe_cierre;
CREATE TRIGGER trg_ic_bloqueo BEFORE UPDATE ON informe_cierre
    FOR EACH ROW EXECUTE FUNCTION bloqueo_por_firma();
DROP TRIGGER IF EXISTS trg_ic_upd ON informe_cierre;
CREATE TRIGGER trg_ic_upd BEFORE UPDATE ON informe_cierre
    FOR EACH ROW EXECUTE FUNCTION set_actualizado_en();

-- =====================================================================
-- 9. Procedimientos de dominio (API de datos para la aplicación)
-- =====================================================================

-- 9.1 Firma atómica: firma + bloqueo + asiento en HCE-LOG en una TX.
--     tabla ∈ {'idea','protocolo','informe_cierre'}.
CREATE OR REPLACE FUNCTION firmar_modulo(
    p_tabla      text,
    p_id         uuid,
    p_profesional uuid,
    p_rol        text DEFAULT NULL,
    p_tipo_firma text DEFAULT 'consenso'          -- 'independiente' | 'consenso'
) RETURNS void AS $$
DECLARE
    v_hce   uuid;
    v_nom   text;
    v_firma jsonb;
BEGIN
    IF p_tabla NOT IN ('idea','protocolo','informe_cierre') THEN
        RAISE EXCEPTION 'firmar_modulo: tabla % no admitida.', p_tabla;
    END IF;
    SELECT nombre INTO v_nom FROM profesional WHERE id = p_profesional;
    v_firma := jsonb_build_object(
        'profesional_id', p_profesional, 'nombre', v_nom,
        'rol', p_rol, 'tipo', p_tipo_firma, 'fecha', now());

    -- Permite la transición borrador→firmado pese al bloqueo_por_firma.
    PERFORM set_config('hce.modo', 'firma', true);

    EXECUTE format(
        'UPDATE %I SET estado = ''firmado'', firmado_en = now(),
                firmas = firmas || $1
          WHERE id = $2 RETURNING hce_id', p_tabla)
      INTO v_hce USING v_firma, p_id;

    IF v_hce IS NULL THEN
        RAISE EXCEPTION 'firmar_modulo: no existe % con id %.', p_tabla, p_id;
    END IF;

    INSERT INTO auditoria (hce_id, usuario_id, modulo, campo, valor_nuevo, tipo)
    VALUES (v_hce, p_profesional, upper(p_tabla), 'estado', 'firmado', 'firma');
END $$ LANGUAGE plpgsql SET search_path = hce, public;

-- 9.2 Habilitación excepcional (§4.2): habilita un módulo fuera de
--     secuencia dejando constancia obligatoria en HCE-LOG.
CREATE OR REPLACE FUNCTION habilitar_excepcional(
    p_tabla      text,
    p_id         uuid,
    p_profesional uuid,
    p_motivo     text
) RETURNS void AS $$
DECLARE v_hce uuid; v_exc jsonb;
BEGIN
    IF coalesce(btrim(p_motivo),'') = '' THEN
        RAISE EXCEPTION 'La habilitación excepcional exige constancia del motivo (§4.2).';
    END IF;
    v_exc := jsonb_build_object('motivo', p_motivo, 'profesional_id', p_profesional, 'fecha', now());

    EXECUTE format(
        'UPDATE %I SET estado = ''borrador'', excepciones = excepciones || $1
          WHERE id = $2 AND estado = ''bloqueado'' RETURNING hce_id', p_tabla)
      INTO v_hce USING v_exc, p_id;

    IF v_hce IS NULL THEN
        RAISE EXCEPTION 'habilitar_excepcional: % id % no existe o no está bloqueado.', p_tabla, p_id;
    END IF;

    INSERT INTO auditoria (hce_id, usuario_id, modulo, campo, valor_nuevo, tipo)
    VALUES (v_hce, p_profesional, upper(p_tabla), 'habilitacion_excepcional', p_motivo, 'excepcion');
END $$ LANGUAGE plpgsql SET search_path = hce, public;

-- 9.3 Ayuda de secuencia (§4.1): sugiere el camino por defecto SIN
--     imponerlo. Devuelve si el flujo "recomienda" el módulo y por qué.
--     (La app decide; el único bloqueo real es CI, vía firma_requiere_ci.)
CREATE OR REPLACE FUNCTION sugerencia_secuencia(p_hce uuid, p_modulo text)
RETURNS TABLE (recomendado boolean, motivo text) AS $$
DECLARE
    ci   boolean := EXISTS (SELECT 1 FROM consentimiento WHERE hce_id=p_hce AND estado='firmado');
    lb   boolean := EXISTS (SELECT 1 FROM idea      WHERE hce_id=p_hce AND estado='firmado');
    pa   boolean := EXISTS (SELECT 1 FROM protocolo WHERE hce_id=p_hce AND tipo='A' AND estado='firmado');
    pb   boolean := EXISTS (SELECT 1 FROM protocolo WHERE hce_id=p_hce AND tipo='B' AND estado='firmado');
BEGIN
    CASE upper(p_modulo)
      WHEN 'HCE-LB' THEN RETURN QUERY SELECT ci,  CASE WHEN ci THEN 'CI firmado' ELSE 'Falta CI firmado' END;
      WHEN 'HCE-PA' THEN RETURN QUERY SELECT lb,  CASE WHEN lb THEN 'LB firmada' ELSE 'Se recomienda LB firmada primero' END;
      WHEN 'HCE-PB' THEN RETURN QUERY SELECT pa,  CASE WHEN pa THEN 'Protocolo A firmado' ELSE 'Se recomienda Protocolo A firmado primero' END;
      WHEN 'HCE-IC' THEN RETURN QUERY SELECT (lb AND pa AND pb), CASE WHEN (lb AND pa AND pb) THEN 'LB, PA y PB firmados' ELSE 'Se recomiendan LB, PA y PB firmados' END;
      ELSE RETURN QUERY SELECT true, 'Módulo sin restricción de secuencia';
    END CASE;
END $$ LANGUAGE plpgsql SET search_path = hce, public;
