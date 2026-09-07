import { ESTADOS_FLUJO_CLIENTE, flujoStepIndex, normalizeEstadoCodigo } from '../planilla/proyectoListUtils'

/**
 * Barra de avance del pedido.
 * @param {{ estado?: string, className?: string, compact?: boolean }} props
 */
export function ProyectoFlujoBar({ estado, className = '', compact = false }) {
  const code = normalizeEstadoCodigo(estado)
  const current = flujoStepIndex(code)
  if (current < 0) return null

  const obraStart = ESTADOS_FLUJO_CLIENTE.findIndex((s) => s.fase === 'obra')
  const activeTone = String(code || '').toLowerCase().replace(/_/g, '-')

  return (
    <div
      className={`seguimiento-bar${compact ? ' seguimiento-bar--compact' : ''} ${className}`.trim()}
      aria-label="Avance del pedido"
      data-estado={code || ''}
    >
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
                active ? `seguimiento-bar__step--tone-${activeTone}` : '',
                isObra ? 'seguimiento-bar__step--obra' : 'seguimiento-bar__step--comercial',
                isBridge ? 'seguimiento-bar__step--bridge' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={step.label}
            >
              <span className="seguimiento-bar__dot" aria-hidden />
              {!compact ? <span className="seguimiento-bar__label">{step.label}</span> : null}
            </li>
          )
        })}
      </ol>
      {!compact ? (
        <p className="seguimiento-bar__hint muted">
          El proyecto solo avanza cuando todas las órdenes llegan a ese estado.
        </p>
      ) : (
        <p className={`seguimiento-bar__current seguimiento-bar__current--${activeTone}`}>
          {ESTADOS_FLUJO_CLIENTE[current]?.label}
        </p>
      )}
    </div>
  )
}
