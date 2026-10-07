"""Routers de la API — un módulo por dominio. **Contrato de respuesta (M11.3-a).**

Este contrato lo consume la demo HTML (Fase 3) y las rebanadas siguientes lo
heredan: **no se cambia sin acuerdo del equipo**.

## Éxito

- **GET** → el recurso (o la lista) **directo**, sin sobre.
- **POST / PATCH / PUT** → el sobre `Resultado[T]`::

      {"data": <el recurso resultante>, "warnings": []}

  `warnings` **está siempre presente**. Es una lista de `{"code", "mensaje", ...}`
  con avisos **no bloqueantes**: la secuencia del flujo sólo avisa (`handoff.md`
  §5.95), así que una escritura fuera de orden responde 2xx con el aviso acá. En
  M11.3-a la lista siempre viene vacía; el mecanismo ya está en el contrato para
  que la rebanada de flujo no tenga que cambiarlo.

## Error

Todos los errores —404, 409, 422, 403 y también los de validación de FastAPI—
tienen el mismo cuerpo::

    {"code": "conflict", "detail": [{"campo": "persona.ci", "mensaje": "..."}]}

`code` es estable y legible por máquina (`not_found`, `conflict`,
`signed_module`, `validation_error`, `forbidden`, `http_error`); `detail` es
**siempre una lista**, aunque haya un solo problema. Los servicios levantan
errores de dominio (`app/services/errores.py`); la traducción a HTTP está en
`app/routers/errores.py`.

## Transacción

**Una por request**, con el commit en `app.routers.dependencias.sesion_transaccional`.
La regla completa está en `app/services/__init__.py`.
"""
