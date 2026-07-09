import { formatAppDateTime, parseAppDateTime } from '../utils/appDateTime'

export const ESTADOS_PROYECTO = [
  { value: '', label: 'Todos los estados' },
  { value: 'ENVIADO', label: 'Enviando' },
  { value: 'EN_ATENCION', label: 'En atención' },
  { value: 'COTIZADO', label: 'Cotizado' },
  { value: 'VENDIDO', label: 'Vendido' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

export function formatEstadoProyecto(value) {
  const map = {
    ENVIADO: 'Enviando',
    EN_ATENCION: 'En atención',
    COTIZADO: 'Cotizado',
    VENDIDO: 'Vendido',
    CANCELADO: 'Cancelado',
  }
  return map[value] || value || '—'
}

/** Clase CSS según estado del proyecto. */
export function estadoTagClass(estado) {
  const map = {
    ENVIADO: 'tag tag--estado-enviado',
    EN_ATENCION: 'tag tag--estado-atencion',
    COTIZADO: 'tag tag--estado-cotizado',
    VENDIDO: 'tag tag--estado-vendido',
    CANCELADO: 'tag tag--estado-cancelado',
  }
  return map[estado] || 'tag'
}

export function isProyectoCancelado(projectOrEstado) {
  const estado =
    typeof projectOrEstado === 'string' ? projectOrEstado : projectOrEstado?.estado
  return estado === 'CANCELADO'
}

export function canDownloadCotizacion(project) {
  if (!project) return false
  if (project.tieneCotizacion) return true
  const archivo = project.cotizacionArchivo ?? project.cotizacion_archivo
  if (archivo && String(archivo).trim()) return true
  return project.estado === 'COTIZADO' || project.estado === 'VENDIDO'
}

export function formatProyectoDate(value) {
  return formatAppDateTime(value)
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
  const desde = filters.fechaDesde ? parseAppDateTime(`${filters.fechaDesde}T00:00:00`) : null
  const hasta = filters.fechaHasta ? parseAppDateTime(`${filters.fechaHasta}T23:59:59`) : null

  return rows.filter((row) => {
    if (estado && row.estado !== estado) return false
    if (nombreQ && !`${row.nombre || ''}`.toLowerCase().includes(nombreQ)) return false
    if (clienteQ && !`${row.cliente || ''}`.toLowerCase().includes(clienteQ)) return false
    if (desde || hasta) {
      const d = parseAppDateTime(row.fechaCreacion)
      if (!d || Number.isNaN(d.getTime())) return false
      if (desde && d < desde) return false
      if (hasta && d > hasta) return false
    }
    return true
  })
}

export { formatEstadoProyecto as formatEstado, formatProyectoDate as formatProjectDate }
