import { estadoTagClass, formatEstadoProyecto, normalizeEstadoCodigo } from '../planilla/proyectoListUtils'

/** @param {{ estado: string }} props */
export function EstadoTag({ estado }) {
  const code = normalizeEstadoCodigo(estado)
  return <span className={estadoTagClass(code || estado)}>{formatEstadoProyecto(code || estado)}</span>
}
