import { formatCantoImportErrors } from './cantoImportValidation'
import { formatRanuraImportErrorsOnLoad } from './ranuraImportValidation'

export function formatDetalleImportErrors(cantoErrors, ranuraErrors) {
  const parts = []
  if (cantoErrors?.length) parts.push(formatCantoImportErrors(cantoErrors))
  if (ranuraErrors?.length) parts.push(formatRanuraImportErrorsOnLoad(ranuraErrors))
  return parts.join('\n\n')
}
