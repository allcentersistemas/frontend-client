/**
 * Medidas largo/ancho para exportación (Excel/TXT/CSV): entero en UI/BD × 10 (ej. 437 → 4370).
 */
export function formatMeasureForOptimizer(value) {
  if (value === '' || value == null) return ''
  const n = parseInt(String(value).replace(/\D/g, ''), 10)
  if (!Number.isFinite(n)) return ''
  return String(n * 10)
}
