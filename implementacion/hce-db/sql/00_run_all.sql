-- =====================================================================
-- HCE IPPU — Orquestador. Ejecuta todo el esquema + seed en orden.
-- Uso:  psql "postgresql://usuario:clave@host:5432/hce_ippu" -v ON_ERROR_STOP=1 -f 00_run_all.sql
-- (ejecutar desde la carpeta sql/ para que las rutas relativas funcionen)
-- =====================================================================
\set ON_ERROR_STOP on
\echo '== 01 extensiones y tipos =='
\i 01_extensiones_tipos.sql
\echo '== 02 esquema =='
\i 02_esquema.sql
\echo '== 03 funciones y triggers =='
\i 03_funciones_triggers.sql
\echo '== 04 seed catalogos =='
\i 04_seed_catalogos.sql
\echo '== 05 seed demo =='
\i 05_seed_demo.sql
\echo '== Listo. =='
