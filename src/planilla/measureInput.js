/** Campos numéricos enteros en el detalle de planilla. */
export const MEASURE_FIELDS = ['cantidad', 'largoVeta', 'ancho', 'perforacionCantidad']

/** Medida mínima del tablero (largo/ancho) en la unidad de la planilla. */
export const MIN_BOARD_MEASURE = 51

const BOARD_MEASURE_FIELDS = [
  ['largoVeta', 'Ancho'],
  ['ancho', 'Ancho'],
]

/** Solo dígitos (enteros). Convierte comas/puntos y rechaza decimales. */
export function normalizeMeasureInput(value) {
  if (value == null) return ''
  return String(value).replace(/\D/g, '')
}

export function normalizeMeasureRow(row) {
  const out = { ...row }
  for (const key of MEASURE_FIELDS) {
    if (out[key] != null && out[key] !== '') {
      out[key] = normalizeMeasureInput(out[key])
    }
  }
  if (row.ranuraEspecial) {
    for (const key of ['ranuraDist', 'ranuraProf', 'ranuraEs']) {
      if (out[key] != null && out[key] !== '') {
        out[key] = normalizeMeasureInput(out[key])
      }
    }
  }
  return out
}

/** Valida medidas del tablero; devuelve mensaje de error o null. */
export function validateBoardMeasures(row, rowIndex = 0) {
  for (const [key, label] of BOARD_MEASURE_FIELDS) {
    const raw = row[key]
    if (raw === '' || raw == null) continue
    const n = Number(raw)
    if (Number.isFinite(n) && n > 0 && n < MIN_BOARD_MEASURE) {
      const fila = rowIndex >= 0 ? ` (fila ${rowIndex + 1})` : ''
      return `${label} no debe ser menor a ${MIN_BOARD_MEASURE}${fila}.`
    }
  }
  return null
}

export function validateAllBoardMeasures(rows) {
  for (let i = 0; i < rows.length; i += 1) {
    const message = validateBoardMeasures(rows[i], i)
    if (message) return message
  }
  return null
}
