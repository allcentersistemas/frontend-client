import { estadoTagClass, formatEstadoProyecto } from '../planilla/proyectoListUtils'

export function EstadoTag({ estado }) {
  return <span className={estadoTagClass(estado)}>{formatEstadoProyecto(estado)}</span>
}
