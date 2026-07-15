-- =====================================================================
-- HCE IPPU — 01. Extensiones y tipos base
-- PostgreSQL 13+  ·  Motor: relacional + JSONB (enfoque mixto)
-- Documento técnico UTEC-LIDIA v1.0 (§6 Modelo de datos sugerido)
-- ---------------------------------------------------------------------
-- Este archivo prepara el esquema: extensiones, esquema lógico `hce`
-- y los tipos enumerados (dominios de valores controlados).
-- =====================================================================

-- pgcrypto: gen_random_uuid() para PKs sintéticas.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- citext: comparación case-insensitive para email.
CREATE EXTENSION IF NOT EXISTS citext;

-- Esquema propio para no contaminar public.
CREATE SCHEMA IF NOT EXISTS hce;
SET search_path TO hce, public;

-- ---------------------------------------------------------------------
-- Tipos enumerados (valores controlados por diseño, portables).
-- Se usan ENUM donde el conjunto es estable y normativo. Las etiquetas
-- "de institución" (roles de técnicos, categorías documentales, baremo)
-- NO son ENUM: viven en tablas parametrizables (§8.3 portabilidad).
-- ---------------------------------------------------------------------

-- Servicios institucionales (§3.1). Fase 1 = atencion_diurna.
DO $$ BEGIN
  CREATE TYPE hce.servicio AS ENUM ('atencion_diurna', 'taller', 'clinica');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Estado del ciclo de vida de un módulo evaluativo (§4.1).
-- bloqueado → borrador → firmado. La firma bloquea la edición.
DO $$ BEGIN
  CREATE TYPE hce.estado_modulo AS ENUM ('bloqueado', 'borrador', 'firmado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tipo de asiento de auditoría (§6 auditoria.tipo).
DO $$ BEGIN
  CREATE TYPE hce.tipo_auditoria AS ENUM ('edicion', 'firma', 'excepcion', 'acceso');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Rol de sistema del profesional (perfiles de permisos, §9).
DO $$ BEGIN
  CREATE TYPE hce.rol_sistema AS ENUM ('tecnico', 'coordinacion', 'direccion', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Estado del consentimiento informado (§3.2 HCE-CI).
DO $$ BEGIN
  CREATE TYPE hce.estado_consentimiento AS ENUM ('pendiente', 'firmado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Estado de la autorización de uso de imagen (§8.4).
DO $$ BEGIN
  CREATE TYPE hce.estado_autorizacion AS ENUM ('pendiente', 'autorizado', 'denegado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tipo de protocolo semestral IPPU-TEA (§5.2).
DO $$ BEGIN
  CREATE TYPE hce.tipo_protocolo AS ENUM ('A', 'B');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
