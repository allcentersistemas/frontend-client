import { EstadoTag } from './EstadoTag'
import { ProyectoFlujoBar } from './ProyectoFlujoBar'
import { flujoStepIndex, resolveEstadoContinuo } from '../planilla/proyectoListUtils'

/**
 * Flujo continuo por orden: estado del proyecto + continuación del XML.
 */
export function OrdenFlujoEstado({ proyectoEstado, estadoEscaneo, compact = false }) {
  const efectivo = resolveEstadoContinuo(proyectoEstado, estadoEscaneo)
  if (!efectivo) return null
  if (efectivo === 'CANCELADO') return <EstadoTag estado="CANCELADO" />

  const sinXml = !estadoEscaneo
  const yaVendido = flujoStepIndex(efectivo) >= flujoStepIndex('VENDIDO')

  return (
    <div className="orden-obra-estado">
      <div className="orden-obra-estado__row">
        <span className="small muted">Avance:</span>
        <EstadoTag estado={efectivo} />
        {sinXml && yaVendido ? (
          <span className="small muted">· XML pendiente de asignar</span>
        ) : null}
      </div>
      {!compact ? <ProyectoFlujoBar estado={efectivo} /> : null}
    </div>
  )
}
