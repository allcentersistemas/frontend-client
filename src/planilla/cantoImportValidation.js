export const CANTO_IMPORT_FIELDS = ['l1', 'l2', 'a1', 'a2']

export const CANTO_IMPORT_LABELS = {
  l1: 'L1',
  l2: 'L2',
  a1: 'A1',
  a2: 'A2',
}

export function isBlankCantoValue(value) {
  const s = String(value ?? '').trim()
  return !s || s.toUpperCase() === 'NA'
}

/** Mapa mayúsculas → valor canónico del catálogo (name). */
export function buildCantoLookup(cantoOptions) {
  const map = new Map()
  const add = (key, canonical) => {
    const k = String(key ?? '').trim().toUpperCase()
    if (!k) return
    if (!map.has(k)) map.set(k, canonical)
  }

  for (const opt of cantoOptions ?? []) {
    const name = (opt.name || '').trim()
    const sku = (opt.sku || '').trim()
    const canonical = name || sku
    if (!canonical) continue
    add(name, canonical)
    add(sku, canonical)
    add(canonical, canonical)
  }

  add('NA', '')
  return map
}

export function resolveImportedCanto(raw, lookup) {
  if (isBlankCantoValue(raw)) return { value: '', valid: true }
  const key = String(raw).trim().toUpperCase()
  if (!lookup.has(key)) {
    return { value: '', valid: false }
  }
  return { value: lookup.get(key), valid: true }
}

export function collectCantoCatalogErrors(rows, cantoOptions) {
  const lookup = buildCantoLookup(cantoOptions)
  const errors = []

  for (let index = 0; index < (rows ?? []).length; index += 1) {
    const row = rows[index]
    for (const field of CANTO_IMPORT_FIELDS) {
      const raw = row[field]
      if (isBlankCantoValue(raw)) continue
      const resolved = resolveImportedCanto(raw, lookup)
      if (!resolved.valid) {
        errors.push({
          row: index + 1,
          field: CANTO_IMPORT_LABELS[field],
          value: String(raw).trim(),
        })
      }
    }
  }

  return errors
}

/**
 * Normaliza L1–A2 válidos al catálogo. Conserva el valor crudo si no coincide.
 */
export function applyCantoCatalogToRows(rows, cantoOptions) {
  const lookup = buildCantoLookup(cantoOptions)
  const errors = []

  const normalized = (rows ?? []).map((row, index) => {
    const next = { ...row }
    for (const field of CANTO_IMPORT_FIELDS) {
      const raw = row[field]
      if (isBlankCantoValue(raw)) {
        next[field] = ''
        continue
      }
      const resolved = resolveImportedCanto(raw, lookup)
      if (!resolved.valid) {
        errors.push({
          row: index + 1,
          field: CANTO_IMPORT_LABELS[field],
          value: String(raw).trim(),
        })
        next[field] = String(raw).trim()
      } else {
        next[field] = resolved.value
      }
    }
    return next
  })

  return { rows: normalized, errors }
}

export function formatCantoCatalogErrors(errors, intro = 'Revise los cantos:') {
  if (!errors?.length) return ''
  const lines = errors
    .slice(0, 15)
    .map((e) => `· Fila ${e.row}, ${e.field}: «${e.value}» no es un canto válido del catálogo.`)
  const extra = errors.length > 15 ? `\n…y ${errors.length - 15} valor(es) más.` : ''
  return `${intro}\n${lines.join('\n')}${extra}`
}

export function formatCantoImportErrors(errors) {
  return formatCantoCatalogErrors(
    errors,
    'Se importaron las filas. Corrija los cantos indicados antes de guardar el detalle:',
  )
}

export function validateCantoCatalogInRows(rows, cantoOptions) {
  return formatCantoCatalogErrors(
    collectCantoCatalogErrors(rows, cantoOptions),
    'No se puede guardar el detalle hasta corregir los cantos:',
  )
}
