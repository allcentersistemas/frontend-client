import { EstadoTag } from './EstadoTag'
import { ProyectoFlujoBar } from './ProyectoFlujoBar'
import {
  formatEstadoOrdenCliente,
  flujoStepIndex,
  resolveEstadoOrdenCliente,
} from '../planilla/proyectoListUtils'

/**
 * Flujo por orden en detalle de planilla (portal cliente).
 * El avance de producción se muestra sin jerga interna de XML.
 */
export function OrdenFlujoEstado({
  proyectoEstado,
  estadoEscaneo,
  hasXml,
  compact = false,
}) {
  const efectivo = resolveEstadoOrdenCliente(proyectoEstado, {
    biesseOrderId: typeof hasXml === 'boolean' ? (hasXml ? 1 : null) : estadoEscaneo ? 1 : null,
    estadoEscaneo,
  })
  if (!efectivo) return null
  if (efectivo === 'CANCELADO') return <EstadoTag estado="CANCELADO" />

  const label =
    efectivo === 'PENDIENTE_PRODUCCION'
      ? formatEstadoOrdenCliente(efectivo)
      : null
  const enPreparacion = efectivo === 'PENDIENTE_PRODUCCION'
  const showBar = !compact && !enPreparacion && flujoStepIndex(efectivo) >= 0

  return (
    <div className="orden-obra-estado">
      <div className="orden-obra-estado__row">
        <span className="small muted">Avance:</span>
        {enPreparacion ? (
          <span className="tag tag--estado-pendiente">{label}</span>
        ) : (
          <EstadoTag estado={efectivo} />
        )}
      </div>
      {showBar ? <ProyectoFlujoBar estado={efectivo} /> : null}
    </div>
  )
}
