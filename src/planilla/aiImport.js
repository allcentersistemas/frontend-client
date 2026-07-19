import { newDetalle } from './helpers'
import { normalizeMeasureInput } from './measureInput'
import { applyCantoCatalogToRows } from './cantoImportValidation'
import { applyRanuraImportToRows } from './ranuraImportValidation'

function digitos(value) {
  if (value == null || value === '') return ''
  return normalizeMeasureInput(String(value))
}

/**
 * Mapea filas del endpoint IA → filas de planilla (newDetalle).
 * @param {Array<object>} filas
 * @param {{ cantoOptions?: Array }} [opts]
 */
export function mapAiExtractToDetalleRows(filas, opts = {}) {
  const rows = (filas ?? []).map((f) => {
    const row = newDetalle()
    row.cantidad = digitos(f.cantidad)
    row.largoVeta = digitos(f.largo ?? f.largoVeta)
    row.ancho = digitos(f.ancho)
    row.l1 = f.l1 ?? ''
    row.l2 = f.l2 ?? ''
    row.a1 = f.a1 ?? ''
    row.a2 = f.a2 ?? ''
    row.ranuraDist = f.ranuraDist ?? ''
    row.ranuraProf = f.ranuraProf ?? ''
    row.ranuraEs = f.ranuraEs ?? ''
    row.ranuraLado = f.ranuraLado ?? ''
    row.observacion = f.descripcion ?? f.observacion ?? ''
    return row
  })

  const { rows: withCantos, errors: cantoErrors } = applyCantoCatalogToRows(rows, opts.cantoOptions)
  const { rows: withRanuras, errors: ranuraErrors } = applyRanuraImportToRows(withCantos)
  return { rows: withRanuras, cantoErrors, ranuraErrors }
}
