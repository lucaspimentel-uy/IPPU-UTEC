"""Capa de servicios — la lógica de negocio del servidor (`handoff.md` §5.2.2).

Acá viven las reglas que la base **no** hace cumplir (la BD sólo garantiza
integridad estructural: FKs, UNIQUE, CHECKs simples; no hay triggers). Un módulo
por dominio.

## Regla de transacción (M11.3-a) — de la que dependen las rebanadas siguientes

**Una transacción por request.**

- Los servicios **sólo hacen `flush()`**. **Nunca hacen `commit` ni `rollback`**: no
  son dueños de la transacción, la usan.
- El `commit` ocurre **una sola vez**, en la dependencia
  `app.routers.dependencias.sesion_transaccional`, cuando el endpoint volvió sin
  excepción. Cualquier excepción —de dominio o no— hace `rollback` de **todo** lo
  que el request escribió.
- Un servicio levanta errores de dominio (`app.services.errores`) y **no importa
  FastAPI**.

**Por qué importa.** Firmar un módulo es *cambiar el módulo + calcular totales +
escribir `auditoria`*, y las tres cosas tienen que entrar juntas o no entrar
(`esquema-datos-v2.md` §4: «transacción: firma + totales + auditoría»). Si cada
servicio hiciera su propio `commit`, una falla en el tercer paso dejaría los dos
primeros guardados y una firma sin su rastro. Con un único commit al final, el
servicio de firma puede llamar al de auditoría y al de totales **dentro de la
misma transacción** sin coordinar nada.

**Consecuencia para quien escriba un servicio nuevo:** si necesita el `id` de lo
que acaba de crear, hace `flush()`; si necesita que una falla *no* deshaga el
resto (no hay ningún caso hoy), eso es una decisión a escribir en `handoff.md` §5,
no un `commit` a escondidas.
"""
