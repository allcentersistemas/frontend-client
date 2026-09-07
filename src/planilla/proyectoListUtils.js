import { formatAppDateTime, parseAppDateTime } from '../utils/appDateTime'

/**
 * Flujo continuo cliente: comercial del proyecto + continuación obra/XML.
 * Tras VENDIDO, el avance lo marca principalmente el estado_escaneo del XML.
 */
export const ESTADOS_FLUJO_CLIENTE = [
  { value: 'ENVIADO', label: 'Enviado', fase: 'comercial' },
  { value: 'EN_ATENCION', label: 'En atención', fase: 'comercial' },
  { value: 'COTIZADO', label: 'Cotizado', fase: 'comercial' },
  { value: 'VENDIDO', label: 'Vendido', fase: 'comercial' },
  { value: 'OPTIMIZADO', label: 'Optimizado', fase: 'obra' },
  { value: 'PRODUCCION', label: 'Producción', fase: 'obra' },
  { value: 'DESPACHO', label: 'Listo para despacho', fase: 'obra' },
  { value: 'LISTO_PARA_ENTREGAR', label: 'Listo para entregar', fase: 'obra' },
  { value: 'ENTREGADO', label: 'Despachado', fase: 'obra' },
]

export const ESTADOS_PROYECTO = [
  { value: '', label: 'Todos los estados' },
  ...ESTADOS_FLUJO_CLIENTE.map(({ value, label }) => ({ value, label })),
  { value: 'CANCELADO', label: 'Cancelado' },
]

/** @deprecated Usar ESTADOS_FLUJO_CLIENTE (fase obra). */
export const ESTADOS_SEGUIMIENTO_CLIENTE = ESTADOS_FLUJO_CLIENTE.filter((s) => s.fase === 'obra')

export function normalizeEstadoCodigo(estado) {
  if (estado == null || estado === '') return null
  const e = String(estado).trim().toUpperCase().replace(/[\s-]+/g, '_')
  if (e === 'ENVIANDO') return 'ENVIADO'
  if (e === 'COMPLETADA' || e === 'COMPLETADO' || e === 'LISTO') return 'LISTO_PARA_ENTREGAR'
  if (e === 'EN_PROCESO') return 'DESPACHO'
  return e
}

export function flujoStepIndex(estado) {
  const code = normalizeEstadoCodigo(estado)
  if (!code || code === 'CANCELADO') return -1
  return ESTADOS_FLUJO_CLIENTE.findIndex((s) => s.value === code)
}

/**
 * Une estado de proyecto + XML de una orden.
 * Tras VENDIDO, cada orden avanza con su propio XML; sin XML se queda en VENDIDO.
 * @param {string} proyectoEstado
 * @param {string|null|undefined} estadoEscaneo
 * @param {{ hasXml?: boolean }} [opts]
 */
export function resolveEstadoContinuo(proyectoEstado, estadoEscaneo, opts = {}) {
  if (normalizeEstadoCodigo(proyectoEstado) === 'CANCELADO') return 'CANCELADO'
  const iProj = flujoStepIndex(proyectoEstado)
  const iVendido = flujoStepIndex('VENDIDO')
  if (iProj < 0) {
    return normalizeEstadoCodigo(estadoEscaneo) || normalizeEstadoCodigo(proyectoEstado)
  }
  // Fase comercial: manda el proyecto.
  if (iProj < iVendido) return ESTADOS_FLUJO_CLIENTE[iProj].value

  const hasXml =
    typeof opts.hasXml === 'boolean' ? opts.hasXml : Boolean(estadoEscaneo)
  // Post-venta sin XML → no puede pasar de VENDIDO.
  if (!hasXml) return 'VENDIDO'
  const iXml = flujoStepIndex(estadoEscaneo)
  // XML vacío/PENDIENTE → OPTIMIZADO (igual que backend).
  if (iXml < 0) return 'OPTIMIZADO'
  return ESTADOS_FLUJO_CLIENTE[Math.max(iVendido, iXml)].value
}

/**
 * Estado del proyecto = cuello de botella (mínimo) de todas sus órdenes.
 * Si falta XML en alguna → VENDIDO (en fase post-venta).
 */
export function resolveEstadoProyectoDesdeOrdenes(proyectoEstado, orders = []) {
  if (normalizeEstadoCodigo(proyectoEstado) === 'CANCELADO') return 'CANCELADO'
  const iProj = flujoStepIndex(proyectoEstado)
  const iVendido = flujoStepIndex('VENDIDO')
  if (iProj < 0) return normalizeEstadoCodigo(proyectoEstado)
  // Pre-venta: no inventar avance desde XML.
  if (iProj < iVendido) return ESTADOS_FLUJO_CLIENTE[iProj].value
  if (!Array.isArray(orders) || orders.length === 0) {
    return ESTADOS_FLUJO_CLIENTE[iProj].value
  }

  let bottleneck = null
  for (const order of orders) {
    const hasXml = order?.biesseOrderId != null
    if (!hasXml) {
      return 'VENDIDO'
    }
    let i = flujoStepIndex(order?.estadoEscaneo)
    if (i < 0) i = flujoStepIndex('OPTIMIZADO')
    if (bottleneck == null || i < bottleneck) bottleneck = i
  }
  if (bottleneck == null) return 'VENDIDO'
  return ESTADOS_FLUJO_CLIENTE[Math.max(iVendido, bottleneck)].value
}

export function formatEstadoProyecto(value) {
  const code = normalizeEstadoCodigo(value)
  if (code === 'CANCELADO') return 'Cancelado'
  const hit = ESTADOS_FLUJO_CLIENTE.find((s) => s.value === code)
  return hit?.label || value || '—'
}

export function formatEstadoObra(value) {
  return formatEstadoProyecto(value)
}

export function estadoTagClass(estado) {
  const code = normalizeEstadoCodigo(estado)
  const map = {
    ENVIADO: 'tag tag--estado-enviado',
    EN_ATENCION: 'tag tag--estado-atencion',
    COTIZADO: 'tag tag--estado-cotizado',
    VENDIDO: 'tag tag--estado-vendido',
    OPTIMIZADO: 'tag tag--estado-optimizado',
    PRODUCCION: 'tag tag--estado-produccion',
    DESPACHO: 'tag tag--estado-despacho',
    LISTO_PARA_ENTREGAR: 'tag tag--estado-listo',
    ENTREGADO: 'tag tag--estado-entregado',
    CANCELADO: 'tag tag--estado-cancelado',
  }
  return map[code] || 'tag'
}

export function normalizeEstadoSeguimiento(estado) {
  const code = normalizeEstadoCodigo(estado)
  if (!code) return null
  if (ESTADOS_SEGUIMIENTO_CLIENTE.some((s) => s.value === code)) return code
  return null
}

export function seguimientoStepIndex(estado) {
  return flujoStepIndex(estado)
}

export function isProyectoCancelado(projectOrEstado) {
  const estado =
    typeof projectOrEstado === 'string' ? projectOrEstado : projectOrEstado?.estado
  return normalizeEstadoCodigo(estado) === 'CANCELADO'
}

export function canDownloadCotizacion(project) {
  if (!project) return false
  if (project.tieneCotizacion) return true
  const archivo = project.cotizacionArchivo ?? project.cotizacion_archivo
  if (archivo && String(archivo).trim()) return true
  const idx = flujoStepIndex(project.estado)
  const cotizadoIdx = flujoStepIndex('COTIZADO')
  return idx >= cotizadoIdx
}

export function canViewPlano(project) {
  if (!project) return false
  if (project.tienePlano) return true
  const archivo = project.planoArchivo ?? project.plano_archivo
  return Boolean(archivo && String(archivo).trim())
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
