function blankOrNA(value) {
  const s = String(value ?? '').trim()
  return !s || s.toUpperCase() === 'NA' ? '' : s
}

/** Cantos y bordes: NA o vacío → celda en blanco en exportación. */
export function exportCantoValue(value) {
  const s = String(value ?? '').trim()
  if (!s || s.toUpperCase() === 'NA') return ''
  return `${s} `
}

/** Perforación y ranura → [P_IDESC] en exportación optimizador. */
export function formatPerforacionRanuraForExport(row) {
  const parts = []
  const qty = blankOrNA(row.perforacionCantidad)
  const lado1 = blankOrNA(row.perforacionLado1)
  const lado2 = blankOrNA(row.perforacionLado2)
  const perfParts = [qty, lado1, lado2].filter(Boolean)
  if (perfParts.length) {
    parts.push(`P(${perfParts.join('/')})`)
  }
  const rd = blankOrNA(row.ranuraDist)
  const rp = blankOrNA(row.ranuraProf)
  const re = blankOrNA(row.ranuraEs)
  const rl = blankOrNA(row.ranuraLado)
  const ranParts = [rd, rp, re, rl].filter(Boolean)
  if (ranParts.length) {
    parts.push(`R(${ranParts.join('/')})`)
  }
  return parts.join(' | ')
}

export function formatObservacionForExport(row) {
  if (row.observacion == null) return ''
  return String(row.observacion).trim()
}
