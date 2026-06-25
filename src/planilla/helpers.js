import { normalizeMeasureInput } from './measureInput.js'
import { RANURA_DIST, RANURA_ES, RANURA_PROF } from './detalleColumns.js'

export const VETA_NO = '0-No'
export const VETA_LONGITUD = '1-Longitud'

export function newDetalle() {
  return {
    tablero: '',
    cantidad: '',
    largoVeta: '',
    ancho: '',
    vetaLongitud: false,
    l1: '',
    l2: '',
    a1: '',
    a2: '',
    perforacionCantidad: '',
    perforacionLado1: '',
    perforacionLado2: '',
    ranuraEspecial: false,
    ranuraDist: '',
    ranuraProf: '',
    ranuraEs: '',
    ranuraLado: '',
    observado: false,
    observacion: '',
  }
}

export function newProjectDraft() {
  return { nombre: '', descripcion: '' }
}

export function newOrderDraft() {
  return { codigo: '', descripcion: '' }
}

export const CANTO_FALLBACK = [
  { id: 'delgado', name: 'DELGADO', sku: '' },
  { id: 'grueso', name: 'GRUESO', sku: '' },
]

export function isPersistedProjectId(id) {
  const n = Number(id)
  return Number.isFinite(n) && n > 0 && n < 1_000_000_000_000
}

export function vetaToPayload(checked) {
  return checked ? VETA_LONGITUD : VETA_NO
}

export function vetaFromApi(value) {
  if (!value) return false
  const v = String(value).trim()
  return v === VETA_LONGITUD || v.startsWith('1-') || v === '1'
}

function isPresetRanura(value, options) {
  const v = String(value ?? '').trim()
  if (!v || v === 'NA') return true
  return options.includes(v)
}

function inferRanuraEspecial(detalle) {
  if (detalle.ranuraEspecial) return true
  return (
    !isPresetRanura(detalle.ranuraDist, RANURA_DIST) ||
    !isPresetRanura(detalle.ranuraProf, RANURA_PROF) ||
    !isPresetRanura(detalle.ranuraEs, RANURA_ES)
  )
}

export function mapDetalleFromApi(detalle) {
  return {
    tablero: detalle.tablero || '',
    cantidad: detalle.cantidad || '',
    largoVeta: detalle.largoVeta || '',
    ancho: detalle.ancho || '',
    vetaLongitud: vetaFromApi(detalle.veta),
    l1: detalle.l1 || '',
    l2: detalle.l2 || '',
    a1: detalle.a1 || '',
    a2: detalle.a2 || '',
    perforacionCantidad: detalle.perforacionCantidad || '',
    perforacionLado1: detalle.perforacionLado1 || '',
    perforacionLado2: detalle.perforacionLado2 || '',
    ranuraEspecial: inferRanuraEspecial(detalle),
    ranuraDist: detalle.ranuraDist || '',
    ranuraProf: detalle.ranuraProf || '',
    ranuraEs: detalle.ranuraEs || '',
    ranuraLado: detalle.ranuraLado || '',
    observado: Boolean(detalle.observado),
    observacion: detalle.observacion || '',
  }
}

export function mapDetalleToApiPayload(row) {
  return {
    tablero: row.tablero,
    cantidad: normalizeMeasureInput(row.cantidad),
    largoVeta: normalizeMeasureInput(row.largoVeta),
    ancho: normalizeMeasureInput(row.ancho),
    veta: vetaToPayload(Boolean(row.vetaLongitud)),
    l1: row.l1,
    l2: row.l2,
    a1: row.a1,
    a2: row.a2,
    perforacionCantidad: normalizeMeasureInput(row.perforacionCantidad),
    perforacionLado1: row.perforacionLado1,
    perforacionLado2: row.perforacionLado2,
    ranuraEspecial: Boolean(row.ranuraEspecial),
    ranuraDist: row.ranuraDist,
    ranuraProf: row.ranuraProf,
    ranuraEs: row.ranuraEs,
    ranuraLado: row.ranuraLado,
    observado: Boolean(row.observado),
    observacion: row.observacion,
  }
}

export function mapOrdersFromApi(savedOrders) {
  return (savedOrders || []).map((order) => ({
    id: order.id,
    codigo: order.codigo || '',
    descripcion: order.descripcion || '',
    detalles: (order.detalles || []).map(mapDetalleFromApi),
  }))
}

export function mergeCantoOptions(cantosKardex) {
  const merged = [...(cantosKardex || [])]
  if (!merged.some((o) => String(o.name || o.sku || '').toUpperCase() === 'NA')) {
    merged.unshift({ id: 'na', name: 'NA', sku: '' })
  }
  for (const fb of CANTO_FALLBACK) {
    const key = fb.name.toUpperCase()
    if (!merged.some((o) => String(o.name || o.sku || '').toUpperCase() === key)) {
      merged.push(fb)
    }
  }
  return merged
}

export function planillaBasePath(project) {
  if (project && isPersistedProjectId(project.id)) {
    return `/app/planilla-corte/${project.id}`
  }
  return '/app/planilla-corte'
}

export function planillaOrderDetallePath(project, orderId) {
  const base =
    project && isPersistedProjectId(project.id)
      ? `/app/planilla-corte/${project.id}`
      : '/app/planilla-corte/nuevo'
  return `${base}/orden/${orderId}`
}

export function formatEstado(value) {
  const map = {
    ENVIADO: 'Enviando',
    EN_ATENCION: 'En atención',
    COTIZADO: 'Cotizado',
  }
  return map[value] || value || '—'
}

export function formatProjectDate(value) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return String(value)
  }
}
