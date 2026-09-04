import { ESTADOS_FLUJO_CLIENTE, flujoStepIndex } from '../planilla/proyectoListUtils'

/**
 * Barra única: Enviado…Vendido → Optimizado…Despachado (XML como continuación).
 */
export function ProyectoFlujoBar({ estado, className = '' }) {
  const current = flujoStepIndex(estado)
  if (current < 0) return null

  const obraStart = ESTADOS_FLUJO_CLIENTE.findIndex((s) => s.fase === 'obra')

  return (
    <div className={`seguimiento-bar ${className}`.trim()} aria-label="Avance del pedido">
      <ol className="seguimiento-bar__list">
        {ESTADOS_FLUJO_CLIENTE.map((step, index) => {
          const done = index < current
          const active = index === current
          const isObra = step.fase === 'obra'
          const isBridge = index === obraStart
          return (
            <li
              key={step.value}
              className={[
                'seguimiento-bar__step',
                done ? 'seguimiento-bar__step--done' : '',
                active ? 'seguimiento-bar__step--active' : '',
                isObra ? 'seguimiento-bar__step--obra' : 'seguimiento-bar__step--comercial',
                isBridge ? 'seguimiento-bar__step--bridge' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={isObra ? 'Avance de obra / XML' : 'Estado del proyecto'}
            >
              <span className="seguimiento-bar__dot" aria-hidden />
              <span className="seguimiento-bar__label">{step.label}</span>
            </li>
          )
        })}
      </ol>
      <p className="seguimiento-bar__hint muted">
        Hasta vendido: proyecto · Desde optimizado: obra/XML
      </p>
    </div>
  )
}
