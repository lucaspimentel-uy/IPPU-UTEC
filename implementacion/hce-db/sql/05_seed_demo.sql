-- =====================================================================
-- HCE IPPU — 05. Seed de datos DEMO (ficticios, §11)
-- Cuatro usuarios que cubren los estados del flujo:
--   demo 1 — ciclo anual completo (2025): CI, LB, PA, PB, IC firmados.
--   demo 2 — ciclo en curso (2026): LB firmada, Protocolo A en borrador.
--   demo 3 — ingreso reciente (2026): CI firmado, IDEA en borrador con NS.
--   demo 4 — consentimiento pendiente: todos los módulos bloqueados.
-- Todos los datos son ficticios (cédulas con 'X'), tomados del prototipo.
-- =====================================================================
SET search_path TO hce, public;

-- ---------------------------------------------------------------------
-- Helpers temporales para construir el detalle JSONB de los instrumentos
-- (se descartan al cerrar la sesión).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.mk_idea(vals int[], obs text[]) RETURNS jsonb AS $$
  SELECT jsonb_agg(jsonb_build_object(
           'n', i, 'valor', vals[i], 'ns', vals[i] IS NULL, 'obs', coalesce(obs[i], '')
         ) ORDER BY i)
  FROM generate_series(1, 12) AS i;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION pg_temp.mk_prot(vals int[], obs text[]) RETURNS jsonb AS $$
  SELECT jsonb_agg(jsonb_build_object(
           'n', i, 'escala', ceil(i / 6.0)::int, 'valor', vals[i], 'obs', coalesce(obs[i], '')
         ) ORDER BY i)
  FROM generate_series(1, 24) AS i;
$$ LANGUAGE sql;

-- Firma doble reutilizable (psicóloga + maestra del grupo).
CREATE OR REPLACE FUNCTION pg_temp.firmas2(p1 uuid, n1 text, p2 uuid, n2 text, f date) RETURNS jsonb AS $$
  SELECT jsonb_build_array(
    jsonb_build_object('profesional_id', p1, 'nombre', n1, 'rol', 'Psicólogo/a', 'tipo', 'consenso', 'fecha', f),
    jsonb_build_object('profesional_id', p2, 'nombre', n2, 'rol', 'Maestro/a',  'tipo', 'consenso', 'fecha', f));
$$ LANGUAGE sql;

-- =====================================================================
-- Profesionales (equipo técnico ficticio)
-- =====================================================================
INSERT INTO profesional (id, nombre, email, especialidad, cargo, rol) VALUES
 ('00000000-0000-0000-0000-0000000000f1','Lic. A. Fernández','a.fernandez@demo.ippu.uy','Psicología','Técnica de referencia','tecnico'),
 ('00000000-0000-0000-0000-0000000000f2','Mtra. C. Rodríguez','c.rodriguez@demo.ippu.uy','Educación especial','Maestra del grupo','tecnico'),
 ('00000000-0000-0000-0000-0000000000f3','Lic. M. Suárez','m.suarez@demo.ippu.uy','Psicología','Técnica de referencia','tecnico'),
 ('00000000-0000-0000-0000-0000000000f4','Mtra. L. Pereira','l.pereira@demo.ippu.uy','Educación especial','Maestra del grupo','tecnico'),
 ('00000000-0000-0000-0000-0000000000f5','Mtra. P. González','p.gonzalez@demo.ippu.uy','Educación especial','Maestra del grupo','tecnico'),
 ('00000000-0000-0000-0000-0000000000f6','Lic. Fga. (demo)','fga@demo.ippu.uy','Fonoaudiología','Otro técnico habilitado','tecnico'),
 ('00000000-0000-0000-0000-0000000000fa','Coordinación (demo)','coord@demo.ippu.uy','Coordinación','Coordinación institucional','coordinacion')
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- Grupos de referencia (roles con etiqueta configurable)
-- =====================================================================
INSERT INTO grupo (id, nombre, anio, tecnico1_id, tecnico1_rol, tecnico2_id, tecnico2_rol, obs) VALUES
 ('00000000-0000-0000-0000-0000000000a1','Grupo Celeste',2025,'00000000-0000-0000-0000-0000000000f1','Psicólogo/a','00000000-0000-0000-0000-0000000000f2','Maestro/a','Ciclo 2025.'),
 ('00000000-0000-0000-0000-0000000000a2','Grupo Naranja',2026,'00000000-0000-0000-0000-0000000000f3','Psicólogo/a','00000000-0000-0000-0000-0000000000f4','Maestro/a','Ciclo 2026 en curso.'),
 ('00000000-0000-0000-0000-0000000000a3','Grupo Verde',  2026,'00000000-0000-0000-0000-0000000000f1','Psicólogo/a','00000000-0000-0000-0000-0000000000f5','Maestro/a','Ingresos recientes.'),
 ('00000000-0000-0000-0000-0000000000a4','Grupo Azul',   2026,'00000000-0000-0000-0000-0000000000f3','Psicólogo/a','00000000-0000-0000-0000-0000000000f2','Maestro/a','Consentimientos en gestión.')
ON CONFLICT (id) DO NOTHING;

-- Otro técnico habilitado en el Grupo Celeste (alcance acotado, §9).
INSERT INTO grupo_otro_tecnico (grupo_id, profesional_id, alcance) VALUES
 ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000f6','Aportes en campos de texto libre de PA, PB e IC')
ON CONFLICT DO NOTHING;

-- =====================================================================
-- Personas + HCE (una por caso demo)
-- =====================================================================
INSERT INTO persona (id, nombre, apellido, ci, fnac, sexo) VALUES
 ('00000000-0000-0000-0000-0000000000d1','Usuario demo 1','(M., 9 años)','5.XXX.XXX-1','2016-04-12','M'),
 ('00000000-0000-0000-0000-0000000000d2','Usuario demo 2','(F., 12 años)','5.XXX.XXX-2','2014-08-02','F'),
 ('00000000-0000-0000-0000-0000000000d3','Usuario demo 3','(M., 6 años)','6.XXX.XXX-3','2020-01-15','M'),
 ('00000000-0000-0000-0000-0000000000d4','Usuario demo 4','(F., 15 años)','5.XXX.XXX-4','2011-05-30','F')
ON CONFLICT (id) DO NOTHING;

INSERT INTO persona_servicio (persona_id, servicio)
 SELECT id, 'atencion_diurna' FROM persona WHERE id IN (
   '00000000-0000-0000-0000-0000000000d1','00000000-0000-0000-0000-0000000000d2',
   '00000000-0000-0000-0000-0000000000d3','00000000-0000-0000-0000-0000000000d4')
ON CONFLICT DO NOTHING;

INSERT INTO hce_diurna (id, persona_id, hc, grupo_id, anio, diagnostico, cie11, nivel_soporte, anamnesis) VALUES
 ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000d1','HC-2025-014','00000000-0000-0000-0000-0000000000a1',2025,
  'TEA — diagnóstico médico confirmado','6A02.1','Nivel 2',
  '{"motivo":"Derivación de INAU. Dificultades de comunicación y conducta en contexto escolar.","antPerinatales":"Embarazo a término, sin complicaciones relevantes.","antMedicos":"Sin patologías médicas asociadas. Audición y visión normales.","desarrollo":"Retraso en la adquisición del lenguaje (~30 meses). Marcha a los 14 meses.","familia":"Convive con madre y hermana mayor. Red de apoyo activa.","escolaridad":"Escuela pública con acompañante terapéutico 3 veces por semana.","medicacion":"Risperidona 0,5 mg/día (indicación psiquiátrica).","otros":"—"}'),
 ('00000000-0000-0000-0000-0000000000c2','00000000-0000-0000-0000-0000000000d2','HC-2026-003','00000000-0000-0000-0000-0000000000a2',2026,
  'TEA — diagnóstico médico confirmado','6A02.0','Nivel 1',
  '{"motivo":"Consulta espontánea de la familia por dificultades de integración con pares.","desarrollo":"Lenguaje estructuralmente conservado; dificultades pragmáticas desde edad preescolar.","escolaridad":"Liceo público, 1.er año. Sin apoyos formales.","medicacion":"No recibe.","otros":"—"}'),
 ('00000000-0000-0000-0000-0000000000c3','00000000-0000-0000-0000-0000000000d3','HC-2026-021','00000000-0000-0000-0000-0000000000a3',2026,
  'En proceso diagnóstico (derivado a neuropediatría)','Pendiente diagnóstico','No determinado',
  '{"motivo":"Derivación desde CAIF por ausencia de lenguaje oral y aislamiento.","antPerinatales":"Prematurez leve (36 semanas).","desarrollo":"Ausencia de lenguaje oral funcional a los 6 años.","escolaridad":"Educación inicial, asistencia irregular.","otros":"Se coordina interconsulta con MSP."}'),
 ('00000000-0000-0000-0000-0000000000c4','00000000-0000-0000-0000-0000000000d4','HC-2026-027','00000000-0000-0000-0000-0000000000a4',2026,
  'TEA — diagnóstico previo externo','6A02.3','Nivel 3','{}')
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- DEMO 1 — ciclo completo 2025 (todo firmado)
-- =====================================================================
INSERT INTO consentimiento (hce_id, firmante, fecha, estado)
 VALUES ('00000000-0000-0000-0000-0000000000c1','Madre — R.P.','2025-03-05','firmado');

-- HCE-LB (IDEA) firmado. Totales esperados: E1=18 E2=14 E3=14 E4=12 total=58.
INSERT INTO idea (hce_id, fecha, sesiones_obs, dimensiones, sintesis, objetivos, firmas, estado, firmado_en)
 VALUES ('00000000-0000-0000-0000-0000000000c1','2025-03-20',6,
   pg_temp.mk_idea(ARRAY[6,6,6,6,4,4,4,6,4,4,4,4],
                   ARRAY[NULL,'Diferencia inicial entre evaluadores (6 vs 4); consenso en 6 por observaciones de sesión grupal.']),
   'Mayor afectación en Relación Social (18/24) y Comunicación (14/24). Perfil orientativo Nivel 2 DSM-5-TR. Referencia conjunta muy limitada; lenguaje expresivo reducido a palabras sueltas con ecolalia frecuente.',
   '1) Incrementar atención conjunta con apoyo gestual. 2) Introducir un sistema aumentativo de comunicación acorde al perfil de la Escala 2. 3) Anticipación visual de rutinas del grupo.',
   pg_temp.firmas2('00000000-0000-0000-0000-0000000000f1','Lic. A. Fernández','00000000-0000-0000-0000-0000000000f2','Mtra. C. Rodríguez','2025-03-20'),
   'firmado','2025-03-20 12:00-03');

-- HCE-PA firmado. Totales esperados: E1=16 E2=15 E3=16 E4=13 total=60.
INSERT INTO protocolo (hce_id, tipo, fecha, semanas, items, sint_tecnico1, sint_tecnico2, otros, firmas, estado, firmado_en)
 VALUES ('00000000-0000-0000-0000-0000000000c1','A','2025-07-07',16,
   pg_temp.mk_prot(ARRAY[3,3,3,2,3,2, 3,3,2,3,2,2, 3,2,3,2,3,3, 2,3,2,2,2,2],
                   ARRAY['Contacto visual emergente en saludo y pedido, solo con apoyo verbal del adulto.']),
   'Emergencia clara de atención conjunta con apoyo. El sistema aumentativo se consolidó en sesión. Persisten dificultades en interacción con pares sin mediación.',
   'Mayor permanencia en actividades estructuradas. Barreras: transiciones y trabajo en pequeño grupo.',
   'Fonoaudiología: buena respuesta al apoyo gestual (ítems E2-4 y E2-6).',
   pg_temp.firmas2('00000000-0000-0000-0000-0000000000f1','Lic. A. Fernández','00000000-0000-0000-0000-0000000000f2','Mtra. C. Rodríguez','2025-07-07'),
   'firmado','2025-07-07 12:00-03');

-- HCE-PB firmado. Totales: E1=20 E2=21 E3=20 E4=18 total=79 · Δ=+4/+6/+4/+5 (=+19).
INSERT INTO protocolo (hce_id, tipo, fecha, semanas, items, sint_tecnico1, sint_tecnico2, otros, ajustes, firmas, estado, firmado_en)
 VALUES ('00000000-0000-0000-0000-0000000000c1','B','2025-12-11',17,
   pg_temp.mk_prot(ARRAY[4,3,4,3,3,3, 4,4,3,4,3,3, 3,3,3,3,4,4, 3,4,3,3,3,2],
                   (SELECT array_agg(CASE WHEN i=20 THEN 'Imitación de secuencias de 2–3 pasos observada también en el hogar (reporte familiar).' END ORDER BY i)
                      FROM generate_series(1,24) AS i)),
   'Generalización parcial de la comunicación por intercambio de imágenes al hogar. Atención conjunta consistente en sesión. Interacción con pares aún dependiente de mediación.',
   'Participa de rutinas grupales completas. Ajustes curriculares: apoyos visuales en todas las consignas.',
   'Psicomotricidad: mejora en regulación ante estímulos sonoros.',
   'Se incorporó agenda visual individual (agosto) y se aumentó la frecuencia de trabajo de a dos con un par tolerado (octubre).',
   pg_temp.firmas2('00000000-0000-0000-0000-0000000000f1','Lic. A. Fernández','00000000-0000-0000-0000-0000000000f2','Mtra. C. Rodríguez','2025-12-11'),
   'firmado','2025-12-11 12:00-03');

-- HCE-IC firmado, con «Recibí» de la familia.
INSERT INTO informe_cierre (hce_id, fecha, sint_escala, sint_tecnico1, sint_tecnico2, recomendaciones, orientaciones, recibi_familia, firmas, estado, firmado_en)
 VALUES ('00000000-0000-0000-0000-0000000000c1','2025-12-19',
   jsonb_build_array(
     'Progreso moderado y sostenido en la relación social (Δ +4). La atención conjunta pasó de emergente a consistente en contextos estructurados.',
     'Área de mayor progreso del año (Δ +6). El sistema aumentativo se consolidó y comienza a generalizarse al hogar.',
     'Progreso moderado (Δ +4). La agenda visual individual redujo las conductas de oposición ante transiciones.',
     'Progreso leve sobre una base muy descendida (Δ +5). La imitación mejoró; el juego simbólico permanece incipiente.'),
   'Año de progreso clínicamente significativo, concentrado en comunicación funcional y anticipación. Se recomienda continuidad en el mismo grupo con intensificación del trabajo entre pares.',
   'La incorporación de apoyos visuales sistemáticos fue el ajuste de mayor impacto pedagógico. Sostenerlos y comenzar retiro gradual en rutinas dominadas.',
   '1) Profundizar el uso funcional del sistema aumentativo (Escala 2). 2) Ampliar el juego compartido con pares (Escala 4). 3) Retiro gradual de apoyos en rutinas consolidadas (Escala 3). 4) Mantener coordinación con escuela.',
   'Sostener la agenda visual en el hogar. Ofrecer oportunidades de pedido con el sistema de comunicación en situaciones cotidianas. Anticipar los cambios de rutina del fin de semana.',
   '{"recibido":true,"fecha":"2025-12-19","firmante":"Madre — R.P."}',
   pg_temp.firmas2('00000000-0000-0000-0000-0000000000f1','Lic. A. Fernández','00000000-0000-0000-0000-0000000000f2','Mtra. C. Rodríguez','2025-12-19'),
   'firmado','2025-12-19 12:00-03');

-- Organismos, valoración funcional, documentos y autorización de imagen (demo 1).
INSERT INTO organismo_inau (hce_id, sipi, convenio, referente, ingreso, obs, envios) VALUES
 ('00000000-0000-0000-0000-0000000000c1','SIPI-XXXXXX-1','Proyecto 3749 — Convenio INAU','Supervisora territorial — Región Oeste','2025-03-01',
  'Cupo convenio Atención Diurna. Situación familiar estable.',
  '[{"fecha":"2025-07-20","txt":"Informe semestral enviado (síntesis Protocolo A)"},{"fecha":"2025-12-22","txt":"Informe de Cierre Anual 2025 enviado (documento único HCE-IC)"}]');

INSERT INTO organismo_bps (hce_id, prestacion, tramite, estado, vencimiento, obs, gestiones) VALUES
 ('00000000-0000-0000-0000-0000000000c1','Ayuda Extraordinaria (AYEX) — instituto habilitado','AYEX-2025-XXXX','Vigente','2026-12-31',
  'Renovación anual con constancia de asistencia y diagnóstico.',
  '[{"fecha":"2025-02-10","txt":"Alta de AYEX aprobada por BPS"},{"fecha":"2026-02-15","txt":"Renovación 2026 presentada y aprobada"}]');

-- pct 58 → el trigger deriva categoría 'Severo' (50–95 %). Nunca desde puntajes clínicos.
INSERT INTO valoracion_funcional (hce_id, estado, fecha, organismo, pct, vigencia, rnpcd, dominios, capacidades, barreras, apoyos, obs) VALUES
 ('00000000-0000-0000-0000-0000000000c1','Valorado','2025-05-14','Equipo valorador BPS (BUND)',58,'2028-05-14','RNPcD-XXXX',
  '{"comunicacion":"Apoyo frecuente","autocuidado":"Apoyo ocasional","movilidad":"Autónomo","aprendizaje":"Apoyo frecuente","interacciones":"Apoyo frecuente","comunidad":"Apoyo permanente"}',
  'Buena memoria visual; disfruta de la música y del agua; vínculo afectivo sólido; usa con intención su sistema de comunicación en contextos conocidos.',
  'Entornos ruidosos y poco predecibles; consignas exclusivamente verbales; transporte público en hora pico.',
  'Agenda visual en el hogar y en IPPU; acompañante terapéutico escolar 3 veces/semana; red familiar activa; AYEX vigente.',
  'La familia consulta por el trámite de asistente personal (Sistema de Cuidados); se orienta y se registra.');

INSERT INTO documento (hce_id, categoria_id, nombre, fecha_original) VALUES
 ('00000000-0000-0000-0000-0000000000c1',(SELECT id FROM categoria_documento WHERE nombre='Informe médico externo'),'Informe neuropediátrico 2024 (externo).pdf','2025-03-05'),
 ('00000000-0000-0000-0000-0000000000c1',(SELECT id FROM categoria_documento WHERE nombre='Informe escolar'),'Informe escolar 2025 — Escuela N.º XX.pdf','2025-11-30'),
 ('00000000-0000-0000-0000-0000000000c1',(SELECT id FROM categoria_documento WHERE nombre='Autorización / consentimiento'),'Autorización de uso de imagen — firmada.pdf','2025-03-05');

INSERT INTO autorizacion_imagen (hce_id, estado, fecha) VALUES
 ('00000000-0000-0000-0000-0000000000c1','autorizado','2025-03-05');

-- Foto individual (válida: la autorización de imagen está registrada, §8.4).
INSERT INTO foto (hce_id, descripcion, fecha) VALUES
 ('00000000-0000-0000-0000-0000000000c1','Actividad de música — cierre 2025',DATE '2025-11-20');

-- Asientos de auditoría (firma) — HCE-LOG (demostrativos).
INSERT INTO auditoria (hce_id, usuario_id, modulo, campo, valor_nuevo, tipo) VALUES
 ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000f1','HCE-LB','estado','firmado','firma'),
 ('00000000-0000-0000-0000-0000000000c1','00000000-0000-0000-0000-0000000000f1','HCE-IC','estado','firmado','firma');

-- =====================================================================
-- DEMO 2 — ciclo en curso 2026: IDEA firmado, Protocolo A en borrador
-- =====================================================================
INSERT INTO consentimiento (hce_id, firmante, fecha, estado)
 VALUES ('00000000-0000-0000-0000-0000000000c2','Padre — J.D.','2026-03-02','firmado');

-- IDEA firmado. Totales esperados: E1=10 E2=6 E3=10 E4=5 total=31.
INSERT INTO idea (hce_id, fecha, sesiones_obs, dimensiones, sintesis, objetivos, firmas, estado, firmado_en)
 VALUES ('00000000-0000-0000-0000-0000000000c2','2026-03-18',5,
   pg_temp.mk_idea(ARRAY[4,2,4,2,2,2,4,4,2,2,1,2], ARRAY[]::text[]),
   'Perfil leve (total 31/96). Mayor afectación relativa en flexibilidad y relación con pares. Lenguaje formal preservado con dificultades pragmáticas. Nivel de soporte orientativo: Nivel 1.',
   '1) Habilidades conversacionales con pares (inicio y cierre). 2) Tolerancia a cambios de plan. 3) Identificación y expresión de emociones propias.',
   pg_temp.firmas2('00000000-0000-0000-0000-0000000000f3','Lic. M. Suárez','00000000-0000-0000-0000-0000000000f4','Mtra. L. Pereira','2026-03-18'),
   'firmado','2026-03-18 12:00-03');

-- Protocolo A en BORRADOR (sin firmar): totales se calculan, síntesis pendientes.
INSERT INTO protocolo (hce_id, tipo, fecha, semanas, items, estado)
 VALUES ('00000000-0000-0000-0000-0000000000c2','A',NULL,16,
   pg_temp.mk_prot(ARRAY[3,4,3,3,3,4, 4,4,3,3,3,3, 3,3,3,4,3,3, 4,3,3,4,3,3], ARRAY[]::text[]),
   'borrador');

INSERT INTO organismo_bps (hce_id, prestacion, tramite, estado, obs, gestiones) VALUES
 ('00000000-0000-0000-0000-0000000000c2','Ayuda Extraordinaria (AYEX)','AYEX-2026-XXXX','En trámite',
  'Documentación presentada; a la espera de resolución.',
  '[{"fecha":"2026-04-03","txt":"Solicitud AYEX presentada en BPS"}]');

-- =====================================================================
-- DEMO 3 — ingreso reciente 2026: CI firmado, IDEA en borrador con NS
-- =====================================================================
INSERT INTO consentimiento (hce_id, firmante, fecha, estado)
 VALUES ('00000000-0000-0000-0000-0000000000c3','Madre — S.L.','2026-06-10','firmado');

-- IDEA en BORRADOR con NS en D3 y D12 (impide el cierre; no se puede firmar).
INSERT INTO idea (hce_id, fecha, sesiones_obs, dimensiones, estado)
 VALUES ('00000000-0000-0000-0000-0000000000c3',NULL,5,
   pg_temp.mk_idea(ARRAY[8,8,NULL,8,8,6,6,6,8,8,6,NULL],
                   ARRAY[NULL,NULL,'NS: se requiere más observación en situaciones de juego compartido antes de puntuar D3.']),
   'borrador');

INSERT INTO organismo_inau (hce_id, sipi, convenio, referente, ingreso, obs) VALUES
 ('00000000-0000-0000-0000-0000000000c3','SIPI-XXXXXX-3','Proyecto 3749 — Convenio INAU','Supervisora territorial — Región Oeste','2026-06-01',
  'Derivación CAIF. Coordinar informe de ingreso con referente INAU.');

-- =====================================================================
-- DEMO 4 — consentimiento pendiente (todo bloqueado)
-- =====================================================================
INSERT INTO consentimiento (hce_id, estado)
 VALUES ('00000000-0000-0000-0000-0000000000c4','pendiente');
-- No se cargan módulos de evaluación: sin CI firmado ninguno puede habilitarse.

-- ---------------------------------------------------------------------
-- Resumen
-- ---------------------------------------------------------------------
DO $$
DECLARE r record;
BEGIN
  RAISE NOTICE 'Seed demo cargado.';
  FOR r IN
    SELECT p.nombre,
           (SELECT estado::text FROM consentimiento c WHERE c.hce_id=h.id) ci,
           (SELECT estado::text||' ('||coalesce(total::text,'-')||'/96)' FROM idea i WHERE i.hce_id=h.id) idea,
           (SELECT string_agg(tipo||':'||estado, ' ') FROM protocolo pr WHERE pr.hce_id=h.id) prot,
           (SELECT estado::text FROM informe_cierre ic WHERE ic.hce_id=h.id) cierre
    FROM hce_diurna h JOIN persona p ON p.id=h.persona_id ORDER BY p.nombre
  LOOP
    RAISE NOTICE '  % | CI=% | IDEA=% | PROT=[%] | IC=%', rpad(r.nombre,22), r.ci, r.idea, r.prot, r.cierre;
  END LOOP;
END $$;
