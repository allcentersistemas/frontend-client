export const ESTADOS_PROYECTO = [
  { value: '', label: 'Todos los estados' },
  { value: 'ENVIADO', label: 'Enviando' },
  { value: 'EN_ATENCION', label: 'En atención' },
  { value: 'COTIZADO', label: 'Cotizado' },
]

export function formatEstadoProyecto(value) {
  const map = {
    ENVIADO: 'Enviando',
    EN_ATENCION: 'En atención',
    COTIZADO: 'Cotizado',
  }
  return map[value] || value || '—'
}

/** Clase CSS según estado del proyecto. */
export function estadoTagClass(estado) {
  const map = {
    ENVIADO: 'tag tag--estado-enviado',
    EN_ATENCION: 'tag tag--estado-atencion',
    COTIZADO: 'tag tag--estado-cotizado',
  }
  return map[estado] || 'tag'
}

export function formatProyectoDate(value) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  } catch {
    return String(value)
  }
}

export function emptyProyectoFilters() {
  return {
    estado: '',
    nombre: '',
    cliente: '',
    vendedor: '',
    fechaDesde: '',
    fechaHasta: '',
  }
}

export function filterProyectosClientSide(rows, filters) {
  const nombreQ = filters.nombre?.trim().toLowerCase()
  const clienteQ = filters.cliente?.trim().toLowerCase()
  const estado = filters.estado?.trim()
  const desde = filters.fechaDesde ? new Date(`${filters.fechaDesde}T00:00:00`) : null
  const hasta = filters.fechaHasta ? new Date(`${filters.fechaHasta}T23:59:59`) : null

  return rows.filter((row) => {
    if (estado && row.estado !== estado) return false
    if (nombreQ && !`${row.nombre || ''}`.toLowerCase().includes(nombreQ)) return false
    if (clienteQ && !`${row.cliente || ''}`.toLowerCase().includes(clienteQ)) return false
    if (desde || hasta) {
      const d = row.fechaCreacion ? new Date(row.fechaCreacion) : null
      if (!d || Number.isNaN(d.getTime())) return false
      if (desde && d < desde) return false
      if (hasta && d > hasta) return false
    }
    return true
  })
}

export { formatEstadoProyecto as formatEstado, formatProyectoDate as formatProjectDate }
