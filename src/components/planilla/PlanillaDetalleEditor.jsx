import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { SearchableSelect } from './SearchableSelect'

const LADO_OPTIONS = ['L1', 'L2', 'A1', 'A2']

function VetaCheckbox({ checked, onChange }) {
  return (
    <label className="planilla-veta" title={checked ? '1-Longitud' : '0-No'}>
      <input
        type="checkbox"
        className="planilla-veta__input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="planilla-veta__box" aria-hidden />
      <span className="planilla-veta__text">{checked ? '1-Longitud' : '0-No'}</span>
    </label>
  )
}

function LadoSelect({ value, onChange }) {
  return (
    <select className="planilla-select" value={value || 'L1'} onChange={(e) => onChange(e.target.value)}>
      {LADO_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}

function Field({ label, children, wide = false }) {
  return (
    <label className={wide ? 'planilla-field planilla-field--wide' : 'planilla-field'}>
      <span>{label}</span>
      {children}
    </label>
  )
}

function PlanillaRowEditor({ row, index, tableros, cantoOptions, onUpdate, onRemove, canRemove }) {
  return (
    <article className="planilla-row-card">
      <div className="planilla-row-card__head">
        <div className="planilla-row-card__head-left">
          <span className="planilla-row-card__badge">Pieza {index + 1}</span>
          {row.tablero ? <span className="planilla-row-card__preview">{row.tablero}</span> : null}
        </div>
        <button
          type="button"
          className="btn btn--ghost planilla-row-card__remove"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Quitar pieza ${index + 1}`}
        >
          Quitar
        </button>
      </div>

      <div className="planilla-row-card__section planilla-row-card__section--material">
        <h4 className="planilla-row-card__section-title">Material y medidas</h4>
        <div className="planilla-row-card__grid planilla-row-card__grid--material">
          <Field label="Tablero" wide>
            <SearchableSelect
              value={row.tablero}
              onChange={(v) => onUpdate('tablero', v)}
              options={tableros}
              placeholder="Seleccionar tablero"
            />
          </Field>
          <Field label="Cantidad">
            <input
              className="planilla-input planilla-input--block"
              value={row.cantidad}
              onChange={(e) => onUpdate('cantidad', e.target.value)}
              inputMode="numeric"
              placeholder="0"
            />
          </Field>
          <Field label="Largo">
            <input
              className="planilla-input planilla-input--block"
              value={row.largoVeta}
              onChange={(e) => onUpdate('largoVeta', e.target.value)}
              inputMode="numeric"
              placeholder="mm"
            />
          </Field>
          <Field label="Ancho">
            <input
              className="planilla-input planilla-input--block"
              value={row.ancho}
              onChange={(e) => onUpdate('ancho', e.target.value)}
              inputMode="numeric"
              placeholder="mm"
            />
          </Field>
          <div className="planilla-field planilla-field--veta">
            <span>Veta en longitud</span>
            <VetaCheckbox
              checked={Boolean(row.vetaLongitud)}
              onChange={(v) => onUpdate('vetaLongitud', v)}
            />
          </div>
        </div>
      </div>

      <div className="planilla-row-card__section planilla-row-card__section--canto">
        <h4 className="planilla-row-card__section-title">Canto</h4>
        <div className="planilla-row-card__grid planilla-row-card__grid--4">
          {['l1', 'l2', 'a1', 'a2'].map((key) => (
            <Field key={key} label={key.toUpperCase()}>
              <SearchableSelect
                value={row[key]}
                onChange={(v) => onUpdate(key, v)}
                options={cantoOptions}
                placeholder={key.toUpperCase()}
                size="sm"
              />
            </Field>
          ))}
        </div>
      </div>

      <div className="planilla-row-card__sections-inline">
        <div className="planilla-row-card__section planilla-row-card__section--perf">
          <h4 className="planilla-row-card__section-title">Perforación</h4>
          <div className="planilla-row-card__grid planilla-row-card__grid--3">
            <Field label="Cantidad">
              <input
                className="planilla-input planilla-input--block"
                value={row.perforacionCantidad}
                onChange={(e) => onUpdate('perforacionCantidad', e.target.value)}
                inputMode="numeric"
              />
            </Field>
            <Field label="Lado 1">
              <LadoSelect value={row.perforacionLado1} onChange={(v) => onUpdate('perforacionLado1', v)} />
            </Field>
            <Field label="Lado 2">
              <LadoSelect value={row.perforacionLado2} onChange={(v) => onUpdate('perforacionLado2', v)} />
            </Field>
          </div>
        </div>

        <div className="planilla-row-card__section planilla-row-card__section--ranura">
          <h4 className="planilla-row-card__section-title">Ranura</h4>
          <div className="planilla-row-card__grid planilla-row-card__grid--3">
            <Field label="Distancia">
              <select
                className="planilla-select planilla-select--block"
                value={row.ranuraDist || '10'}
                onChange={(e) => onUpdate('ranuraDist', e.target.value)}
              >
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="18">18</option>
              </select>
            </Field>
            <Field label="Profundidad">
              <select
                className="planilla-select planilla-select--block"
                value={row.ranuraProf || '6'}
                onChange={(e) => onUpdate('ranuraProf', e.target.value)}
              >
                <option value="6">6</option>
                <option value="8">8</option>
                <option value="10">10</option>
              </select>
            </Field>
            <Field label="Espesor">
              <select
                className="planilla-select planilla-select--block"
                value={row.ranuraEs || '4'}
                onChange={(e) => onUpdate('ranuraEs', e.target.value)}
              >
                <option value="4">4</option>
                <option value="7">7</option>
              </select>
            </Field>
          </div>
        </div>
      </div>

      <Field label="Observación" wide>
        <input
          className="planilla-input planilla-input--block"
          value={row.observacion}
          onChange={(e) => onUpdate('observacion', e.target.value)}
          placeholder="Notas opcionales de la pieza"
        />
      </Field>
    </article>
  )
}

export function PlanillaDetalleEditor({
  order,
  projectName,
  backHref,
  rows,
  tableros,
  cantoOptions,
  onBack,
  onSave,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
}) {
  const totalPiezas = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const qty = Number(row.cantidad || 0)
        return Number.isFinite(qty) ? sum + qty : sum
      }, 0),
    [rows],
  )

  return (
    <div className="planilla-detalle-page h-screen flex flex-col">
      <header className="planilla-detalle-page__header">
        <div className="planilla-detalle-page__header-top">
          {backHref ? (
            <Link to={backHref} className="planilla-back-link" onClick={onBack}>
              ← Volver a la planilla
            </Link>
          ) : (
            <button type="button" className="planilla-back-link" onClick={onBack}>
              ← Volver a la planilla
            </button>
          )}
          {projectName ? <span className="planilla-detalle-page__project">{projectName}</span> : null}
        </div>

        <div className="planilla-detalle-page__header-main">
          <div>
            <p className="planilla-modal__eyebrow">Detalle de orden</p>
            <h1 className="planilla-detalle-page__title">{order.codigo}</h1>
            {order.descripcion ? (
              <p className="planilla-modal__subtitle">{order.descripcion}</p>
            ) : null}
          </div>
          <div className="planilla-detalle-page__stats">
            <span className="planilla-stat">
              <strong>{rows.length}</strong> filas
            </span>
            <span className="planilla-stat">
              <strong>{totalPiezas}</strong> piezas
            </span>
          </div>
        </div>
      </header>

      <div className="planilla-detalle-page__toolbar">
        <button type="button" className="btn btn--primary" onClick={onAddRow}>
          + Agregar pieza
        </button>
        <p className="planilla-modal__hint muted small">
          Complete cada pieza en su tarjeta. La veta se guarda como{' '}
          <code className="code-inline">0-No</code> o <code className="code-inline">1-Longitud</code>.
        </p>
      </div>

      <div className="planilla-detalle-page__body">
        <div className="planilla-row-cards">
          {rows.map((row, index) => (
            <PlanillaRowEditor
              key={index}
              row={row}
              index={index}
              tableros={tableros}
              cantoOptions={cantoOptions}
              onUpdate={(key, value) => onUpdateRow(index, key, value)}
              onRemove={() => onRemoveRow(index)}
              canRemove={rows.length > 1}
            />
          ))}
        </div>
      </div>

      <footer className="planilla-detalle-page__footer">
        {backHref ? (
          <Link to={backHref} className="btn btn--ghost" onClick={onBack}>
            Cancelar
          </Link>
        ) : (
          <button type="button" className="btn btn--ghost" onClick={onBack}>
            Cancelar
          </button>
        )}
        <button type="button" className="btn btn--primary" onClick={onSave}>
          Guardar detalle
        </button>
      </footer>
    </div>
  )
}
