-- Base separada para pytest (M11.5). Se ejecuta una única vez, cuando
-- Postgres inicializa el volumen por primera vez.
--
-- Motivo: los tests hacen create_all/drop_all y no deben tocar los datos de
-- desarrollo. Mismo contenedor, misma versión del motor, base distinta.
CREATE DATABASE ippu_test OWNER ippu;
