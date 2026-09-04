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

/** Vacío, blanco o «NA» → sin valor (cadena vacía en UI / null al guardar). */
export function blankOrEmpty(value) {
  const s = String(value ?? '').trim()
  if (!s || s.toUpperCase() === 'NA') return ''
  return s
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
    tablero: blankOrEmpty(detalle.tablero),
    cantidad: blankOrEmpty(detalle.cantidad),
    largoVeta: blankOrEmpty(detalle.largoVeta),
    ancho: blankOrEmpty(detalle.ancho),
    vetaLongitud: vetaFromApi(detalle.veta),
    l1: blankOrEmpty(detalle.l1),
    l2: blankOrEmpty(detalle.l2),
    a1: blankOrEmpty(detalle.a1),
    a2: blankOrEmpty(detalle.a2),
    perforacionCantidad: blankOrEmpty(detalle.perforacionCantidad),
    perforacionLado1: blankOrEmpty(detalle.perforacionLado1),
    perforacionLado2: blankOrEmpty(detalle.perforacionLado2),
    ranuraEspecial: inferRanuraEspecial(detalle),
    ranuraDist: blankOrEmpty(detalle.ranuraDist),
    ranuraProf: blankOrEmpty(detalle.ranuraProf),
    ranuraEs: blankOrEmpty(detalle.ranuraEs),
    ranuraLado: blankOrEmpty(detalle.ranuraLado),
    observado: Boolean(detalle.observado),
    observacion: blankOrEmpty(detalle.observacion),
  }
}

export function mapDetalleToApiPayload(row) {
  return {
    tablero: blankOrEmpty(row.tablero),
    cantidad: normalizeMeasureInput(row.cantidad),
    largoVeta: normalizeMeasureInput(row.largoVeta),
    ancho: normalizeMeasureInput(row.ancho),
    veta: vetaToPayload(Boolean(row.vetaLongitud)),
    l1: blankOrEmpty(row.l1),
    l2: blankOrEmpty(row.l2),
    a1: blankOrEmpty(row.a1),
    a2: blankOrEmpty(row.a2),
    perforacionCantidad: normalizeMeasureInput(row.perforacionCantidad),
    perforacionLado1: blankOrEmpty(row.perforacionLado1),
    perforacionLado2: blankOrEmpty(row.perforacionLado2),
    ranuraEspecial: Boolean(row.ranuraEspecial),
    ranuraDist: blankOrEmpty(row.ranuraDist),
    ranuraProf: blankOrEmpty(row.ranuraProf),
    ranuraEs: blankOrEmpty(row.ranuraEs),
    ranuraLado: blankOrEmpty(row.ranuraLado),
    observado: Boolean(row.observado),
    observacion: blankOrEmpty(row.observacion),
  }
}

export function mapOrdersFromApi(savedOrders) {
  return (savedOrders || []).map((order) => ({
    id: order.id,
    codigo: order.codigo || '',
    descripcion: order.descripcion || '',
    biesseOrderId: order.biesseOrderId ?? order.biesse_order_id ?? null,
    biesseOrderName: order.biesseOrderName ?? order.biesse_order_name ?? null,
    opCodigo: order.opCodigo ?? order.op_codigo ?? null,
    estadoEscaneo: order.estadoEscaneo ?? order.estado_escaneo ?? null,
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
    VENDIDO: 'Vendido',
    CANCELADO: 'Cancelado',
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
