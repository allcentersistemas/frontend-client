/** Campos numéricos enteros en el detalle de planilla. */
export const MEASURE_FIELDS = ['cantidad', 'largoVeta', 'ancho', 'perforacionCantidad']

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
