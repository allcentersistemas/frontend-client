function blankOrNA(value) {
  const s = String(value ?? '').trim()
  return !s || s === 'NA' ? '' : s
}

/** Perforación y ranura → [P_IDESC] en exportación optimizador. */
export function formatPerforacionRanuraForExport(row) {
  const parts = []
  const qty = blankOrNA(row.perforacionCantidad)
  const lado1 = blankOrNA(row.perforacionLado1)
  const lado2 = blankOrNA(row.perforacionLado2)
  if (qty) {
    const lados = [lado1, lado2].filter(Boolean).join(',')
    parts.push(lados ? `Perf ${qty} (${lados})` : `Perf ${qty}`)
  }
  const rd = blankOrNA(row.ranuraDist)
  const rp = blankOrNA(row.ranuraProf)
  const re = blankOrNA(row.ranuraEs)
  const rl = blankOrNA(row.ranuraLado)
  if (rd || rp || re || rl) {
    parts.push(`Ran ${[rd, rp, re, rl].filter(Boolean).join('/')}`)
  }
  return parts.join(' | ')
}

export function formatObservacionForExport(row) {
  if (row.observacion == null) return ''
  return String(row.observacion).trim()
}
