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

/**
 * Normaliza L1–A2 al catálogo. Devuelve filas listas y errores por celda inválida.
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
        next[field] = ''
      } else {
        next[field] = resolved.value
      }
    }
    return next
  })

  return { rows: normalized, errors }
}

export function formatCantoImportErrors(errors) {
  if (!errors?.length) return ''
  const lines = errors
    .slice(0, 15)
    .map((e) => `· Fila ${e.row}, ${e.field}: «${e.value}» no es un canto válido del catálogo.`)
  const extra = errors.length > 15 ? `\n…y ${errors.length - 15} valor(es) más.` : ''
  return `Revise los cantos del Excel:\n${lines.join('\n')}${extra}`
}
