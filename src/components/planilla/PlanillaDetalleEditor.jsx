import { useMemo } from 'react'
import { SearchableSelect } from './SearchableSelect'
import { LADO_OPTIONS, RANURA_DIST, RANURA_ES, RANURA_PROF } from '../../planilla/detalleColumns'

function VetaCheckbox({ checked, onChange, disabled = false }) {
  return (
    <label className="planilla-veta" title={checked ? '1-Longitud' : '0-No'}>
      <input
        type="checkbox"
        className="planilla-veta__input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="planilla-veta__box" aria-hidden />
      <span className="planilla-veta__text">{checked ? '1-Longitud' : '0-No'}</span>
    </label>
  )
}

function LadoSelect({ value, onChange, disabled }) {
  return (
    <select
      className="planilla-select planilla-select--block"
      value={value || 'NA'}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
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

function PlanillaRowEditor({ row, index, tableros, cantoOptions, onUpdate, onRemove, canRemove, readOnly }) {
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
          disabled={!canRemove || readOnly}
          aria-label={`Quitar pieza ${index + 1}`}
        >
          Quitar
        </button>
      </div>

      <fieldset disabled={readOnly} className="planilla-row-card__fieldset">
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
              <span>Veta</span>
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
              <Field label="Lado">
                <LadoSelect
                  value={row.perforacionLado1}
                  onChange={(v) => onUpdate('perforacionLado1', v)}
                />
              </Field>
            </div>
          </div>

          <div className="planilla-row-card__section planilla-row-card__section--ranura">
            <h4 className="planilla-row-card__section-title">Ranura</h4>
            <div className="planilla-row-card__grid planilla-row-card__grid--4">
              <Field label="Distancia">
                <select
                  className="planilla-select planilla-select--block"
                  value={row.ranuraDist || 'NA'}
                  onChange={(e) => onUpdate('ranuraDist', e.target.value)}
                >
                  {RANURA_DIST.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Profundidad">
                <select
                  className="planilla-select planilla-select--block"
                  value={row.ranuraProf || 'NA'}
                  onChange={(e) => onUpdate('ranuraProf', e.target.value)}
                >
                  {RANURA_PROF.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Espesor">
                <select
                  className="planilla-select planilla-select--block"
                  value={row.ranuraEs || 'NA'}
                  onChange={(e) => onUpdate('ranuraEs', e.target.value)}
                >
                  {RANURA_ES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Lado">
                <LadoSelect value={row.ranuraLado} onChange={(v) => onUpdate('ranuraLado', v)} />
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
      </fieldset>
    </article>
  )
}

export function PlanillaDetalleEditor({
  order,
  projectName,
  rows,
  tableros,
  cantoOptions,
  readOnly = false,
  onClose,
  onSave,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  onDownloadExcel,
  maquinaParametros,
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
    <>
      <header className="planilla-modal__header">
        <div className="min-w-0 flex-1">
          <p className="planilla-modal__eyebrow">
            Detalle de orden
            {projectName ? ` · ${projectName}` : ''}
          </p>
          <h1 id="planilla-orden-title" className="planilla-modal__title">
            {order.codigo}
          </h1>
          {order.descripcion ? (
            <p className="planilla-modal__subtitle">{order.descripcion}</p>
          ) : null}
          {maquinaParametros ? (
            <p className="small muted mt-1">Parámetros: {maquinaParametros}</p>
          ) : null}
        </div>
        <div className="planilla-modal__header-meta">
          <span className="planilla-stat">
            <strong>{rows.length}</strong> filas
          </span>
          <span className="planilla-stat">
            <strong>{totalPiezas}</strong> piezas
          </span>
          <button
            type="button"
            className="planilla-modal__close"
            onClick={onClose}
            aria-label="Cerrar ventana"
          >
            ×
          </button>
        </div>
      </header>

      <div className="planilla-modal__toolbar">
        <div className="flex flex-wrap items-center gap-2">
          {!readOnly ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={onAddRow}>
              + Agregar pieza
            </button>
          ) : (
            <span className="tag tag--ok">Solo lectura</span>
          )}
          {onDownloadExcel ? (
            <button type="button" className="btn btn--ghost btn--sm" onClick={onDownloadExcel}>
              Descargar Excel
            </button>
          ) : null}
        </div>
      </div>

      <div className="planilla-modal__body">
        <div className="planilla-row-cards planilla-row-cards--modal">
          {rows.map((row, index) => (
            <PlanillaRowEditor
              key={index}
              row={row}
              index={index}
              tableros={tableros}
              cantoOptions={cantoOptions}
              onUpdate={readOnly ? () => {} : (key, value) => onUpdateRow(index, key, value)}
              onRemove={readOnly ? () => {} : () => onRemoveRow(index)}
              canRemove={rows.length > 1}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      <footer className="planilla-modal__footer planilla-modal__footer--end">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {readOnly ? 'Cerrar' : 'Cancelar'}
        </button>
        {!readOnly ? (
          <button type="button" className="btn btn--primary" onClick={onSave}>
            Guardar detalle
          </button>
        ) : null}
      </footer>
    </>
  )
}
