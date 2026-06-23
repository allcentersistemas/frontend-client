/** Entero para exportación al optimizador (sin decimales). */
export function formatMeasureForOptimizer(value) {
  if (value === '' || value == null) return ''
  const n = parseInt(String(value).replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? String(n) : ''
}
