export function newDetalle() {
  return {
    tablero: '',
    cantidad: '',
    largoVeta: '',
    ancho: '',
    l1: '',
    l2: '',
    a1: '',
    a2: '',
    perforacionCantidad: '',
    perforacionLado1: '',
    perforacionLado2: '',
    ranuraDist: '',
    ranuraProf: '',
    ranuraEs: '',
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

export function mapDetalleFromApi(detalle) {
  return {
    tablero: detalle.tablero || '',
    cantidad: detalle.cantidad || '',
    largoVeta: detalle.largoVeta || '',
    ancho: detalle.ancho || '',
    l1: detalle.l1 || '',
    l2: detalle.l2 || '',
    a1: detalle.a1 || '',
    a2: detalle.a2 || '',
    perforacionCantidad: detalle.perforacionCantidad || '',
    perforacionLado1: detalle.perforacionLado1 || '',
    perforacionLado2: detalle.perforacionLado2 || '',
    ranuraDist: detalle.ranuraDist || '',
    ranuraProf: detalle.ranuraProf || '',
    ranuraEs: detalle.ranuraEs || '',
    observado: Boolean(detalle.observado),
    observacion: detalle.observacion || '',
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
  for (const fb of CANTO_FALLBACK) {
    const key = fb.name.toUpperCase()
    if (!merged.some((o) => String(o.name || o.sku || '').toUpperCase() === key)) {
      merged.push(fb)
    }
  }
  return merged
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
