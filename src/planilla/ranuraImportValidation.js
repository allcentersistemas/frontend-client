import { LADO_OPTIONS, RANURA_DIST, RANURA_ES, RANURA_PROF } from './detalleColumns'

export const RANURA_PRESET_FIELDS = [
  { key: 'ranuraDist', label: 'Ran. dist.', options: RANURA_DIST },
  { key: 'ranuraProf', label: 'Ran. prof.', options: RANURA_PROF },
  { key: 'ranuraEs', label: 'Ran. esp.', options: RANURA_ES },
]

export const LADO_IMPORT_FIELDS = [
  { key: 'perforacionLado1', label: 'Perf. lado' },
  { key: 'ranuraLado', label: 'Ran. lado' },
]

function isBlankOptionValue(value) {
  const s = String(value ?? '').trim()
  return !s || s.toUpperCase() === 'NA'
}

function normalizeOptionKey(value) {
  return String(value ?? '').trim().toUpperCase()
}

function resolveImportedOption(raw, options) {
  if (isBlankOptionValue(raw)) return { value: '', valid: true }
  const key = normalizeOptionKey(raw)
  const match = options.find((opt) => normalizeOptionKey(opt) === key)
  if (!match) return { value: String(raw).trim(), valid: false }
  return { value: match, valid: true }
}

export function collectRanuraImportErrors(rows) {
  const errors = []

  for (let index = 0; index < (rows ?? []).length; index += 1) {
    const row = rows[index]
    if (row.ranuraEspecial) continue

    for (const { key, label, options } of RANURA_PRESET_FIELDS) {
      const raw = row[key]
      if (isBlankOptionValue(raw)) continue
      const resolved = resolveImportedOption(raw, options)
      if (!resolved.valid) {
        errors.push({ row: index + 1, field: label, value: String(raw).trim() })
      }
    }

    for (const { key, label } of LADO_IMPORT_FIELDS) {
      const raw = row[key]
      if (isBlankOptionValue(raw)) continue
      const resolved = resolveImportedOption(raw, LADO_OPTIONS)
      if (!resolved.valid) {
        errors.push({ row: index + 1, field: label, value: String(raw).trim() })
      }
    }
  }

  return errors
}

/** Normaliza ranuras/lados importados. No activa ranura especial. */
export function applyRanuraImportToRows(rows) {
  const errors = []

  const normalized = (rows ?? []).map((row, index) => {
    const next = { ...row, ranuraEspecial: false }

    for (const { key, label, options } of RANURA_PRESET_FIELDS) {
      const raw = row[key]
      if (isBlankOptionValue(raw)) {
        next[key] = ''
        continue
      }
      const resolved = resolveImportedOption(raw, options)
      if (!resolved.valid) {
        errors.push({ row: index + 1, field: label, value: String(raw).trim() })
        next[key] = String(raw).trim()
      } else {
        next[key] = resolved.value
      }
    }

    for (const { key, label } of LADO_IMPORT_FIELDS) {
      const raw = row[key]
      if (isBlankOptionValue(raw)) {
        next[key] = ''
        continue
      }
      const resolved = resolveImportedOption(raw, LADO_OPTIONS)
      if (!resolved.valid) {
        errors.push({ row: index + 1, field: label, value: String(raw).trim() })
        next[key] = String(raw).trim()
      } else {
        next[key] = resolved.value
      }
    }

    return next
  })

  return { rows: normalized, errors }
}

export function formatRanuraImportErrors(errors, intro = 'Revise perforación y ranuras:') {
  if (!errors?.length) return ''
  const lines = errors
    .slice(0, 15)
    .map(
      (e) =>
        `· Fila ${e.row}, ${e.field}: «${e.value}» no es válido. Seleccione una de las opciones del formulario.`,
    )
  const extra = errors.length > 15 ? `\n…y ${errors.length - 15} valor(es) más.` : ''
  return `${intro}\n${lines.join('\n')}${extra}`
}

export function formatRanuraImportErrorsOnLoad(errors) {
  return formatRanuraImportErrors(
    errors,
    'Se importaron las filas. Corrija perforación y ranuras antes de guardar el detalle:',
  )
}

export function validateRanuraOptionsInRows(
  rows,
  intro = 'No se puede guardar el detalle hasta corregir perforación y ranuras:',
) {
  return formatRanuraImportErrors(collectRanuraImportErrors(rows), intro)
}
