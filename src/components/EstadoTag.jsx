import { estadoTagClass, formatEstadoProyecto } from '../planilla/proyectoListUtils'

/** @param {{ estado: string }} props */
export function EstadoTag({ estado }) {
  return <span className={estadoTagClass(estado)}>{formatEstadoProyecto(estado)}</span>
}
