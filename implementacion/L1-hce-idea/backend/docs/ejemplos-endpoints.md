# Ejemplos de endpoints — API HCE + IDEA (Fase 2)

> ⚠️ **DOCUMENTO HISTÓRICO (API v1).** Los endpoints de acá **ya no existen**: el backend v1 se retiró
> entero en M11.2 (2026-08-07). Los routers v2 son **M11.4** y este archivo se regenera ahí. Se conserva
> como registro del contrato anterior. Ojo con `"grupo_id": "A"`: desde M12.1 el grupo tiene id entero y
> se muestra por su nombre (color) — D9, `handoff.md` §5.18.

> Generado automáticamente ejercitando cada endpoint contra una base de prueba seedeada.
> Request y response reales. Las listas largas se abrevian.

## Infraestructura

### `GET /health`
**Response — `200`:**
```json
{
  "status": "ok",
  "app": "HCE IDEA IPPU — API",
  "env": "dev"
}
```

## Catálogo IDEA

### `GET /catalogo/escalas`
**Response — `200`:**
```json
[
  {
    "id": "A",
    "nombre": "Relación Social",
    "orden": 1,
    "dimensiones": [
      {
        "id": "D1",
        "escala_id": "A",
        "numero": 1,
        "nombre": "Dimensión 1"
      },
      {
        "id": "D2",
        "escala_id": "A",
        "numero": 2,
        "nombre": "Dimensión 2"
      },
      {
        "id": "D3",
        "escala_id": "A",
        "numero": 3,
        "nombre": "Dimensión 3"
      }
    ]
  },
  {
    "id": "B",
    "nombre": "Comunicación",
    "orden": 2,
    "dimensiones": [
      {
        "id": "D4",
        "escala_id": "B",
        "numero": 4,
        "nombre": "Dimensión 4"
      },
      {
        "id": "D5",
        "escala_id": "B",
        "numero": 5,
        "nombre": "Dimensión 5"
      },
      {
        "id": "D6",
        "escala_id": "B",
        "numero": 6,
        "nombre": "Dimensión 6"
      }
    ]
  },
  {
    "id": "C",
    "nombre": "Anticipación",
    "orden": 3,
    "dimensiones": [
      {
        "id": "D7",
        "escala_id": "C",
        "numero": 7,
        "nombre": "Dimensión 7"
      },
      {
        "id": "D8",
        "escala_id": "C",
        "numero": 8,
        "nombre": "Dimensión 8"
      },
      {
        "id": "D9",
        "escala_id": "C",
        "numero": 9,
        "nombre": "Dimensión 9"
      }
    ]
  },
  {
    "id": "D",
    "nombre": "Simbolización",
    "orden": 4,
    "dimensiones": [
      {
        "id": "D10",
        "escala_id": "D",
        "numero": 10,
        "nombre": "Dimensión 10"
      },
      {
        "id": "D11",
        "escala_id": "D",
        "numero": 11,
        "nombre": "Dimensión 11"
      },
      {
        "id": "D12",
        "escala_id": "D",
        "numero": 12,
        "nombre": "Dimensión 12"
      }
    ]
  }
]
```

### `GET /catalogo/dimensiones`
**Response — `200`:**
```json
[
  {
    "id": "D1",
    "escala_id": "A",
    "numero": 1,
    "nombre": "Dimensión 1"
  },
  {
    "id": "D2",
    "escala_id": "A",
    "numero": 2,
    "nombre": "Dimensión 2"
  },
  "… (12 ítems en total)"
]
```

## Personas

### `GET /terapeutas`
**Response — `200`:**
```json
[
  {
    "id": 1,
    "nombre": "Dr. González",
    "especialidad": "Psicología",
    "email": "gonzalez@fundacionippu.uy",
    "cargo": null,
    "rol": "tecnico",
    "activo": true
  }
]
```

### `GET /grupos`
**Response — `200`:**
```json
[
  {
    "id": "A",
    "franja": "6-9 años",
    "dias": "Lun·Mié·Vie",
    "horario": "9-12",
    "obs": null,
    "talleres": []
  }
]
```

### `GET /talleres`
**Response — `200`:**
```json
[
  {
    "id": 1,
    "nombre": "Habilidades sociales"
  },
  {
    "id": 2,
    "nombre": "Música y expresión"
  }
]
```

## NNA (expediente)

### `POST /nna` — crea un expediente
**Request:**
```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "ci": "5.111.222-3",
  "fecha_nac": "2016-05-10",
  "sexo": "Femenino",
  "grupo_id": "A",
  "tecnico_id": 1,
  "diagnostico": "TEA",
  "anamnesis": {
    "motivo": "Ingreso para abordaje interdisciplinario."
  },
  "talleres": [
    1,
    2
  ]
}
```
**Response — `201`:**
```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "ci": "5.111.222-3",
  "fecha_nac": "2016-05-10",
  "sexo": "Femenino",
  "localidad": null,
  "referente": null,
  "telefono": null,
  "grupo_id": "A",
  "tecnico_id": 1,
  "diagnostico": "TEA",
  "dx_fecha": null,
  "derivacion": null,
  "grado_apoyo": null,
  "antecedentes": null,
  "medicacion": null,
  "alerta": null,
  "id": 1,
  "activo": true,
  "fecha_baja": null,
  "edad": 10,
  "anamnesis": {
    "motivo": "Ingreso para abordaje interdisciplinario.",
    "perinatal": null,
    "desarrollo": null,
    "familiares": null
  },
  "talleres": [
    {
      "id": 1,
      "nombre": "Habilidades sociales"
    },
    {
      "id": 2,
      "nombre": "Música y expresión"
    }
  ],
  "grupo": {
    "id": "A",
    "franja": "6-9 años",
    "dias": "Lun·Mié·Vie",
    "horario": "9-12",
    "obs": null,
    "talleres": []
  },
  "tecnico": {
    "id": 1,
    "nombre": "Dr. González",
    "especialidad": "Psicología",
    "email": "gonzalez@fundacionippu.uy",
    "cargo": null,
    "rol": "tecnico",
    "activo": true
  }
}
```

### `GET /nna` — listado
**Response — `200`:**
```json
[
  {
    "id": 1,
    "nombre": "Ana",
    "apellido": "Pérez",
    "ci": "5.111.222-3",
    "grupo_id": "A",
    "edad": 10,
    "activo": true
  }
]
```

### `GET /nna?q=Ana` — búsqueda
**Response — `200`:**
```json
[
  {
    "id": 1,
    "nombre": "Ana",
    "apellido": "Pérez",
    "ci": "5.111.222-3",
    "grupo_id": "A",
    "edad": 10,
    "activo": true
  }
]
```

### `GET /nna/1` — expediente completo
**Response — `200`:**
```json
{
  "nombre": "Ana",
  "apellido": "Pérez",
  "ci": "5.111.222-3",
  "fecha_nac": "2016-05-10",
  "sexo": "Femenino",
  "localidad": null,
  "referente": null,
  "telefono": null,
  "grupo_id": "A",
  "tecnico_id": 1,
  "diagnostico": "TEA",
  "dx_fecha": null,
  "derivacion": null,
  "grado_apoyo": null,
  "antecedentes": null,
  "medicacion": null,
  "alerta": null,
  "id": 1,
  "activo": true,
  "fecha_baja": null,
  "edad": 10,
  "anamnesis": {
    "motivo": "Ingreso para abordaje interdisciplinario.",
    "perinatal": null,
    "desarrollo": null,
    "familiares": null
  },
  "talleres": [
    {
      "id": 1,
      "nombre": "Habilidades sociales"
    },
    {
      "id": 2,
      "nombre": "Música y expresión"
    }
  ],
  "grupo": {
    "id": "A",
    "franja": "6-9 años",
    "dias": "Lun·Mié·Vie",
    "horario": "9-12",
    "obs": null,
    "talleres": []
  },
  "tecnico": {
    "id": 1,
    "nombre": "Dr. González",
    "especialidad": "Psicología",
    "email": "gonzalez@fundacionippu.uy",
    "cargo": null,
    "rol": "tecnico",
    "activo": true
  }
}
```

### `PUT /nna/1` — edita
**Request:**
```json
{
  "nombre": "Ana María",
  "apellido": "Pérez",
  "ci": "5.111.222-3",
  "fecha_nac": "2016-05-10",
  "grupo_id": "A",
  "tecnico_id": 1,
  "talleres": [
    1
  ]
}
```
**Response — `200`:**
```json
{
  "nombre": "Ana María",
  "apellido": "Pérez",
  "ci": "5.111.222-3",
  "fecha_nac": "2016-05-10",
  "sexo": null,
  "localidad": null,
  "referente": null,
  "telefono": null,
  "grupo_id": "A",
  "tecnico_id": 1,
  "diagnostico": null,
  "dx_fecha": null,
  "derivacion": null,
  "grado_apoyo": null,
  "antecedentes": null,
  "medicacion": null,
  "alerta": null,
  "id": 1,
  "activo": true,
  "fecha_baja": null,
  "edad": 10,
  "anamnesis": {
    "motivo": "Ingreso para abordaje interdisciplinario.",
    "perinatal": null,
    "desarrollo": null,
    "familiares": null
  },
  "talleres": [
    {
      "id": 1,
      "nombre": "Habilidades sociales"
    }
  ],
  "grupo": {
    "id": "A",
    "franja": "6-9 años",
    "dias": "Lun·Mié·Vie",
    "horario": "9-12",
    "obs": null,
    "talleres": []
  },
  "tecnico": {
    "id": 1,
    "nombre": "Dr. González",
    "especialidad": "Psicología",
    "email": "gonzalez@fundacionippu.uy",
    "cargo": null,
    "rol": "tecnico",
    "activo": true
  }
}
```

### `PATCH /nna/1/estado` — baja
**Request:**
```json
{
  "activo": false,
  "fecha_baja": "2026-07-01"
}
```
**Response — `200`:**
```json
{
  "nombre": "Ana María",
  "apellido": "Pérez",
  "ci": "5.111.222-3",
  "fecha_nac": "2016-05-10",
  "sexo": null,
  "localidad": null,
  "referente": null,
  "telefono": null,
  "grupo_id": "A",
  "tecnico_id": 1,
  "diagnostico": null,
  "dx_fecha": null,
  "derivacion": null,
  "grado_apoyo": null,
  "antecedentes": null,
  "medicacion": null,
  "alerta": null,
  "id": 1,
  "activo": false,
  "fecha_baja": "2026-07-01",
  "edad": 10,
  "anamnesis": {
    "motivo": "Ingreso para abordaje interdisciplinario.",
    "perinatal": null,
    "desarrollo": null,
    "familiares": null
  },
  "talleres": [
    {
      "id": 1,
      "nombre": "Habilidades sociales"
    }
  ],
  "grupo": {
    "id": "A",
    "franja": "6-9 años",
    "dias": "Lun·Mié·Vie",
    "horario": "9-12",
    "obs": null,
    "talleres": []
  },
  "tecnico": {
    "id": 1,
    "nombre": "Dr. González",
    "especialidad": "Psicología",
    "email": "gonzalez@fundacionippu.uy",
    "cargo": null,
    "rol": "tecnico",
    "activo": true
  }
}
```

### `PATCH /nna/1/estado` — reactiva
**Request:**
```json
{
  "activo": true
}
```
**Response — `200`:**
```json
{
  "nombre": "Ana María",
  "apellido": "Pérez",
  "ci": "5.111.222-3",
  "fecha_nac": "2016-05-10",
  "sexo": null,
  "localidad": null,
  "referente": null,
  "telefono": null,
  "grupo_id": "A",
  "tecnico_id": 1,
  "diagnostico": null,
  "dx_fecha": null,
  "derivacion": null,
  "grado_apoyo": null,
  "antecedentes": null,
  "medicacion": null,
  "alerta": null,
  "id": 1,
  "activo": true,
  "fecha_baja": null,
  "edad": 10,
  "anamnesis": {
    "motivo": "Ingreso para abordaje interdisciplinario.",
    "perinatal": null,
    "desarrollo": null,
    "familiares": null
  },
  "talleres": [
    {
      "id": 1,
      "nombre": "Habilidades sociales"
    }
  ],
  "grupo": {
    "id": "A",
    "franja": "6-9 años",
    "dias": "Lun·Mié·Vie",
    "horario": "9-12",
    "obs": null,
    "talleres": []
  },
  "tecnico": {
    "id": 1,
    "nombre": "Dr. González",
    "especialidad": "Psicología",
    "email": "gonzalez@fundacionippu.uy",
    "cargo": null,
    "rol": "tecnico",
    "activo": true
  }
}
```

## Evaluación IDEA

### `POST /nna/1/idea` — total se calcula en el servidor
**Request:**
```json
{
  "anio": 2026,
  "periodo": "inicial",
  "fecha": "2026-01-15",
  "evaluador_id": 1,
  "observaciones": "Evaluación inicial.",
  "dimensiones": [
    {
      "dimension_id": "D1",
      "puntaje": 4
    },
    {
      "dimension_id": "D2",
      "puntaje": 4
    },
    "… (12 ítems en total)"
  ]
}
```
**Response — `201`:**
```json
{
  "id": 1,
  "nna_id": 1,
  "anio": 2026,
  "periodo": "inicial",
  "fecha": "2026-01-15",
  "evaluador_id": 1,
  "total": 33,
  "observaciones": "Evaluación inicial.",
  "dimensiones": [
    {
      "dimension_id": "D1",
      "puntaje": 4
    },
    {
      "dimension_id": "D10",
      "puntaje": 2
    },
    "… (12 ítems en total)"
  ]
}
```

### `GET /nna/1/idea`
**Response — `200`:**
```json
[
  {
    "id": 1,
    "nna_id": 1,
    "anio": 2026,
    "periodo": "inicial",
    "fecha": "2026-01-15",
    "evaluador_id": 1,
    "total": 33,
    "observaciones": "Evaluación inicial.",
    "dimensiones": [
      {
        "dimension_id": "D1",
        "puntaje": 4
      },
      {
        "dimension_id": "D10",
        "puntaje": 2
      },
      "… (12 ítems en total)"
    ]
  }
]
```

### `GET /idea/1`
**Response — `200`:**
```json
{
  "id": 1,
  "nna_id": 1,
  "anio": 2026,
  "periodo": "inicial",
  "fecha": "2026-01-15",
  "evaluador_id": 1,
  "total": 33,
  "observaciones": "Evaluación inicial.",
  "dimensiones": [
    {
      "dimension_id": "D1",
      "puntaje": 4
    },
    {
      "dimension_id": "D10",
      "puntaje": 2
    },
    "… (12 ítems en total)"
  ]
}
```

## Evaluación intermedia (Likert)

### `POST /nna/1/likert` — equivalente_idea se calcula en el servidor
**Request:**
```json
{
  "anio": 2026,
  "fecha": "2026-06-10",
  "evaluador_id": 1,
  "items": [
    {
      "dimension_id": "D1",
      "item_num": 1,
      "valor": 3
    },
    {
      "dimension_id": "D1",
      "item_num": 2,
      "valor": 3
    },
    "… (36 ítems en total)"
  ]
}
```
**Response — `201`:**
```json
{
  "id": 1,
  "nna_id": 1,
  "anio": 2026,
  "fecha": "2026-06-10",
  "evaluador_id": 1,
  "equivalente_idea": 48.0,
  "observaciones": null,
  "items": [
    {
      "dimension_id": "D1",
      "item_num": 1,
      "valor": 3
    },
    {
      "dimension_id": "D1",
      "item_num": 2,
      "valor": 3
    },
    "… (36 ítems en total)"
  ]
}
```

### `GET /nna/1/likert`
**Response — `200`:**
```json
[
  {
    "id": 1,
    "nna_id": 1,
    "anio": 2026,
    "fecha": "2026-06-10",
    "evaluador_id": 1,
    "equivalente_idea": 48.0,
    "observaciones": null,
    "items": [
      {
        "dimension_id": "D1",
        "item_num": 1,
        "valor": 3
      },
      {
        "dimension_id": "D1",
        "item_num": 2,
        "valor": 3
      },
      "… (36 ítems en total)"
    ]
  }
]
```

## Clínica (observaciones y eventos)

### `POST /nna/1/observaciones`
**Request:**
```json
{
  "fecha": "2026-03-02",
  "autor_id": 1,
  "texto": "Buena adaptación al taller de música."
}
```
**Response — `201`:**
```json
{
  "id": 1,
  "nna_id": 1,
  "fecha": "2026-03-02",
  "autor_id": 1,
  "texto": "Buena adaptación al taller de música."
}
```

### `GET /nna/1/observaciones`
**Response — `200`:**
```json
[
  {
    "id": 1,
    "nna_id": 1,
    "fecha": "2026-03-02",
    "autor_id": 1,
    "texto": "Buena adaptación al taller de música."
  }
]
```

### `POST /nna/1/eventos`
**Request:**
```json
{
  "tipo": "alta",
  "fecha": "2026-02-01",
  "titulo": "Alta en HCE"
}
```
**Response — `201`:**
```json
{
  "tipo": "alta",
  "fecha": "2026-02-01",
  "titulo": "Alta en HCE",
  "descripcion": null,
  "autor_id": null,
  "id": 1,
  "nna_id": 1
}
```

### `GET /nna/1/eventos`
**Response — `200`:**
```json
[
  {
    "tipo": "alta",
    "fecha": "2026-02-01",
    "titulo": "Alta en HCE",
    "descripcion": null,
    "autor_id": null,
    "id": 1,
    "nna_id": 1
  }
]
```

## Ejemplos de errores (validación)

### `POST /nna` — C.I. duplicada → 409
**Request:**
```json
{
  "nombre": "Otra",
  "apellido": "X",
  "ci": "5.111.222-3"
}
```
**Response — `409`:**
```json
{
  "detail": "Ya existe un NNA con la C.I. 5.111.222-3"
}
```

### `POST /nna/1/idea` — cuerpo de relleno de Swagger → 422 (el error que viste)
**Request:**
```json
{
  "anio": 2026,
  "periodo": "string",
  "dimensiones": [
    {
      "dimension_id": "string",
      "puntaje": 8
    }
  ]
}
```
**Response — `422`:**
```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": [
        "body",
        "periodo"
      ],
      "msg": "Value error, periodo debe ser 'inicial' o 'final'",
      "input": "string",
      "ctx": {
        "error": {}
      }
    },
    {
      "type": "value_error",
      "loc": [
        "body",
        "dimensiones"
      ],
      "msg": "Value error, Se requieren exactamente las 12 dimensiones D1..D12, sin repetir",
      "input": [
        {
          "dimension_id": "string",
          "puntaje": 8
        }
      ],
      "ctx": {
        "error": {}
      }
    }
  ]
}
```
