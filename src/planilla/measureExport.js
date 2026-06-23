/**
 * Medidas largo/ancho para el optimizador: entero en UI/BD × 100 (ej. 437 → 43700).
 */
export function formatMeasureForOptimizer(value) {
  if (value === '' || value == null) return ''
  const n = parseInt(String(value).replace(/\D/g, ''), 10)
  if (!Number.isFinite(n)) return ''
  return String(n * 100)
}
