import { EstadoTag } from './EstadoTag'
import { ProyectoFlujoBar } from './ProyectoFlujoBar'
import { flujoStepIndex, resolveEstadoContinuo } from '../planilla/proyectoListUtils'

/**
 * Flujo continuo por orden: estado del proyecto + continuación del XML.
 * @param {{ proyectoEstado?: string, estadoEscaneo?: string|null, hasXml?: boolean, compact?: boolean }} props
 */
export function OrdenFlujoEstado({
  proyectoEstado,
  estadoEscaneo,
  hasXml,
  compact = false,
}) {
  const xmlPresent =
    typeof hasXml === 'boolean' ? hasXml : Boolean(estadoEscaneo)
  const efectivo = resolveEstadoContinuo(proyectoEstado, estadoEscaneo, {
    hasXml: xmlPresent,
  })
  if (!efectivo) return null
  if (efectivo === 'CANCELADO') return <EstadoTag estado="CANCELADO" />

  const sinXml = !xmlPresent
  const yaVendido = flujoStepIndex(efectivo) >= flujoStepIndex('VENDIDO')

  return (
    <div className="orden-obra-estado">
      <div className="orden-obra-estado__row">
        <span className="small muted">Avance:</span>
        <EstadoTag estado={efectivo} />
        {sinXml && yaVendido ? (
          <span className="small muted">· Sin XML (el proyecto no avanza hasta anidarlo)</span>
        ) : null}
      </div>
      {!compact ? <ProyectoFlujoBar estado={efectivo} /> : null}
    </div>
  )
}
