export function emptyMaterialForm() {
  return {
    pCodeMat: '',
    pParams: '',
    pMinq: '',
    pLength: '',
    pWidth: '',
    pGrain: '',
    pEdgeMaSup: '',
    pEdgeMaInf: '',
    pEdgeMaIzq: '',
    pEdgeMaDer: '',
    pIdesc: '',
    pIidesc: '',
    pGroovei: '',
    pFurnCo: '',
    pFurnInf: '',
    pLabelIa: '',
    pDrwinfo: '',
  }
}

function trimOrNull(s) {
  if (s == null) return null
  const t = String(s).trim()
  return t === '' ? null : t
}

function intOrNull(s) {
  if (s === '' || s == null) return null
  const n = parseInt(String(s).replace(/\s/g, '').replace(/\./g, ''), 10)
  return Number.isFinite(n) ? n : null
}

function decimalOrNull(s) {
  if (s === '' || s == null) return null
  const t = String(s).trim().replace(/\s/g, '').replace(',', '.')
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/**
 * Convierte varias filas de formulario en payloads para POST /bulk.
 * Omite filas sin código de material (vacías).
 * @param {Record<string, string>[]} forms
 */
export function materialFormsToBulkPayload(forms) {
  const out = []
  for (const form of forms) {
    const code = String(form.pCodeMat ?? '').trim()
    if (!code) continue
    out.push(materialFormToPayload({ ...form, pCodeMat: code }))
  }
  return out
}

/** @param {Record<string, string>} form */
export function materialFormToPayload(form) {
  const code = form.pCodeMat.trim()
  if (!code) {
    throw new Error('P_CODE_MAT (material) es obligatorio')
  }
  return {
    pCodeMat: code,
    pParams: trimOrNull(form.pParams),
    pMinq: intOrNull(form.pMinq),
    pLength: decimalOrNull(form.pLength),
    pWidth: decimalOrNull(form.pWidth),
    pGrain: trimOrNull(form.pGrain),
    pEdgeMaSup: trimOrNull(form.pEdgeMaSup),
    pEdgeMaInf: trimOrNull(form.pEdgeMaInf),
    pEdgeMaIzq: trimOrNull(form.pEdgeMaIzq),
    pEdgeMaDer: trimOrNull(form.pEdgeMaDer),
    pIdesc: trimOrNull(form.pIdesc),
    pIidesc: trimOrNull(form.pIidesc),
    pGroovei: trimOrNull(form.pGroovei),
    pFurnCo: trimOrNull(form.pFurnCo),
    pFurnInf: trimOrNull(form.pFurnInf),
    pLabelIa: trimOrNull(form.pLabelIa),
    pDrwinfo: trimOrNull(form.pDrwinfo),
  }
}
