/** Campos numéricos enteros en el detalle de planilla. */
export const MEASURE_FIELDS = ['cantidad', 'largoVeta', 'ancho', 'perforacionCantidad']

/** Medida mínima del tablero (largo/ancho) en la unidad de la planilla. */
export const MIN_BOARD_MEASURE = 50

export const BOARD_MEASURE_KEYS = ['largoVeta', 'ancho']

const BOARD_MEASURE_FIELDS = [
  ['largoVeta', 'Largo'],
  ['ancho', 'Ancho'],
]

/** Solo dígitos (enteros). Convierte comas/puntos y rechaza decimales. */
export function normalizeMeasureInput(value) {
  if (value == null) return ''
  return String(value).replace(/\D/g, '')
}

export function isBoardMeasureField(key) {
  return BOARD_MEASURE_KEYS.includes(key)
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

/** Valida una medida de tablero; devuelve mensaje de error o null. */
export function validateBoardMeasureValue(key, value, rowIndex = 0) {
  if (!isBoardMeasureField(key)) return null
  if (value === '' || value == null) return null
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  if (n < MIN_BOARD_MEASURE) {
    const label = key === 'largoVeta' ? 'Largo' : 'Ancho'
    const fila = rowIndex >= 0 ? ` (fila ${rowIndex + 1})` : ''
    return `${label} no debe ser menor a ${MIN_BOARD_MEASURE}${fila}.`
  }
  return null
}

/** Valida medidas del tablero en una fila; devuelve mensaje de error o null. */
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
