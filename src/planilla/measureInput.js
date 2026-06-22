/** Campos numéricos de medida / cantidad en el detalle de planilla. */
export const MEASURE_FIELDS = ['cantidad', 'largoVeta', 'ancho', 'perforacionCantidad']

/** Convierte comas decimales a punto para persistir en BD. */
export function normalizeMeasureInput(value) {
  if (value == null) return ''
  return String(value).replace(/,/g, '.')
}

export function normalizeMeasureRow(row) {
  const out = { ...row }
  for (const key of MEASURE_FIELDS) {
    if (out[key] != null && out[key] !== '') {
      out[key] = normalizeMeasureInput(out[key])
    }
  }
  return out
}
