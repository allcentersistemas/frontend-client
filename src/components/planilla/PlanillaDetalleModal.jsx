import { useMemo } from 'react'
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
      <span className="planilla-veta__text">Longitud</span>
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

function PlanillaRowFields({ row, index, tableros, cantoOptions, onUpdate, onRemove, canRemove }) {
  return (
    <>
      <div className="planilla-row-card__head">
        <span className="planilla-row-card__badge">Pieza {index + 1}</span>
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
        <div className="planilla-row-card__grid">
          <label className="planilla-field planilla-field--wide">
            <span>Tablero</span>
            <SearchableSelect
              value={row.tablero}
              onChange={(v) => onUpdate('tablero', v)}
              options={tableros}
              placeholder="Tablero"
            />
          </label>
          <label className="planilla-field">
            <span>Cantidad</span>
            <input
              className="planilla-input"
              value={row.cantidad}
              onChange={(e) => onUpdate('cantidad', e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="planilla-field">
            <span>Largo</span>
            <input
              className="planilla-input"
              value={row.largoVeta}
              onChange={(e) => onUpdate('largoVeta', e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="planilla-field">
            <span>Ancho</span>
            <input
              className="planilla-input"
              value={row.ancho}
              onChange={(e) => onUpdate('ancho', e.target.value)}
              inputMode="numeric"
            />
          </label>
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
          {(['l1', 'l2', 'a1', 'a2']).map((key) => (
            <label key={key} className="planilla-field">
              <span>{key.toUpperCase()}</span>
              <SearchableSelect
                value={row[key]}
                onChange={(v) => onUpdate(key, v)}
                options={cantoOptions}
                placeholder={key.toUpperCase()}
              />
            </label>
          ))}
        </div>
      </div>

      <div className="planilla-row-card__section planilla-row-card__section--perf">
        <h4 className="planilla-row-card__section-title">Perforación</h4>
        <div className="planilla-row-card__grid planilla-row-card__grid--3">
          <label className="planilla-field">
            <span>Cantidad</span>
            <input
              className="planilla-input"
              value={row.perforacionCantidad}
              onChange={(e) => onUpdate('perforacionCantidad', e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="planilla-field">
            <span>Lado 1</span>
            <LadoSelect
              value={row.perforacionLado1}
              onChange={(v) => onUpdate('perforacionLado1', v)}
            />
          </label>
          <label className="planilla-field">
            <span>Lado 2</span>
            <LadoSelect
              value={row.perforacionLado2}
              onChange={(v) => onUpdate('perforacionLado2', v)}
            />
          </label>
        </div>
      </div>

      <div className="planilla-row-card__section planilla-row-card__section--ranura">
        <h4 className="planilla-row-card__section-title">Ranura</h4>
        <div className="planilla-row-card__grid planilla-row-card__grid--3">
          <label className="planilla-field">
            <span>Distancia</span>
            <select
              className="planilla-select"
              value={row.ranuraDist || '10'}
              onChange={(e) => onUpdate('ranuraDist', e.target.value)}
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="18">18</option>
            </select>
          </label>
          <label className="planilla-field">
            <span>Profundidad</span>
            <select
              className="planilla-select"
              value={row.ranuraProf || '6'}
              onChange={(e) => onUpdate('ranuraProf', e.target.value)}
            >
              <option value="6">6</option>
              <option value="8">8</option>
              <option value="10">10</option>
            </select>
          </label>
          <label className="planilla-field">
            <span>Espesor</span>
            <select
              className="planilla-select"
              value={row.ranuraEs || '4'}
              onChange={(e) => onUpdate('ranuraEs', e.target.value)}
            >
              <option value="4">4</option>
              <option value="7">7</option>
            </select>
          </label>
        </div>
      </div>

      <label className="planilla-field planilla-field--wide">
        <span>Observación</span>
        <input
          className="planilla-input planilla-input--full"
          value={row.observacion}
          onChange={(e) => onUpdate('observacion', e.target.value)}
          placeholder="Notas de la pieza"
        />
      </label>
    </>
  )
}

/**
 * @param {{
 *   order: { codigo: string, descripcion?: string },
 *   rows: Array<Record<string, unknown>>,
 *   tableros: Array<{ id?: number|string, sku?: string, name: string }>,
 *   cantoOptions: Array<{ id?: number|string, sku?: string, name: string }>,
 *   onClose: () => void,
 *   onSave: () => void,
 *   onAddRow: () => void,
 *   onUpdateRow: (index: number, key: string, value: unknown) => void,
 *   onRemoveRow: (index: number) => void,
 * }} props
 */
export function PlanillaDetalleModal({
  order,
  rows,
  tableros,
  cantoOptions,
  onClose,
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
    <div className="planilla-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="planilla-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="planilla-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="planilla-modal__header">
          <div className="planilla-modal__header-main">
            <p className="planilla-modal__eyebrow">Detalle de orden</p>
            <h2 id="planilla-modal-title" className="planilla-modal__title">
              {order.codigo}
            </h2>
            {order.descripcion ? (
              <p className="planilla-modal__subtitle">{order.descripcion}</p>
            ) : null}
          </div>
          <div className="planilla-modal__header-meta">
            <span className="planilla-stat">
              <strong>{rows.length}</strong> filas
            </span>
            <span className="planilla-stat">
              <strong>{totalPiezas}</strong> piezas
            </span>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </header>

        <div className="planilla-modal__toolbar">
          <button type="button" className="btn btn--primary" onClick={onAddRow}>
            + Agregar pieza
          </button>
          <p className="planilla-modal__hint muted small">
            Veta desmarcada → <code className="code-inline">0-No</code> · Marcada →{' '}
            <code className="code-inline">1-Longitud</code>
          </p>
        </div>

        <div className="planilla-row-cards lg:hidden">
          {rows.map((row, index) => (
            <article key={index} className="planilla-row-card">
              <PlanillaRowFields
                row={row}
                index={index}
                tableros={tableros}
                cantoOptions={cantoOptions}
                onUpdate={(key, value) => onUpdateRow(index, key, value)}
                onRemove={() => onRemoveRow(index)}
                canRemove={rows.length > 1}
              />
            </article>
          ))}
        </div>

        <div className="planilla-table-shell hidden lg:block">
          <div className="table-wrap planilla-wrap">
            <table className="data-table planilla-table">
              <thead>
                <tr className="planilla-table__group-row">
                  <th rowSpan={2} className="planilla-table__sticky planilla-table__sticky--idx">
                    #
                  </th>
                  <th rowSpan={2} className="planilla-table__sticky planilla-table__sticky--mat">
                    Tablero
                  </th>
                  <th colSpan={4} className="planilla-table__group planilla-table__group--piezas">
                    Piezas
                  </th>
                  <th colSpan={4} className="planilla-table__group planilla-table__group--canto">
                    Canto
                  </th>
                  <th colSpan={3} className="planilla-table__group planilla-table__group--perf">
                    Perforación
                  </th>
                  <th colSpan={3} className="planilla-table__group planilla-table__group--ranura">
                    Ranura
                  </th>
                  <th rowSpan={2}>Obs.</th>
                  <th rowSpan={2} />
                </tr>
                <tr>
                  <th>Cant.</th>
                  <th>Largo</th>
                  <th>Ancho</th>
                  <th>Veta</th>
                  <th>L1</th>
                  <th>L2</th>
                  <th>A1</th>
                  <th>A2</th>
                  <th>Cant.</th>
                  <th>Lado 1</th>
                  <th>Lado 2</th>
                  <th>Dist.</th>
                  <th>Prof.</th>
                  <th>Esp.</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index}>
                    <td className="planilla-table__sticky planilla-table__sticky--idx">{index + 1}</td>
                    <td className="planilla-table__sticky planilla-table__sticky--mat">
                      <SearchableSelect
                        value={row.tablero}
                        onChange={(v) => onUpdateRow(index, 'tablero', v)}
                        options={tableros}
                        placeholder="Tablero"
                      />
                    </td>
                    <td>
                      <input
                        className="planilla-input"
                        value={row.cantidad}
                        onChange={(e) => onUpdateRow(index, 'cantidad', e.target.value)}
                        inputMode="numeric"
                      />
                    </td>
                    <td>
                      <input
                        className="planilla-input"
                        value={row.largoVeta}
                        onChange={(e) => onUpdateRow(index, 'largoVeta', e.target.value)}
                        inputMode="numeric"
                      />
                    </td>
                    <td>
                      <input
                        className="planilla-input"
                        value={row.ancho}
                        onChange={(e) => onUpdateRow(index, 'ancho', e.target.value)}
                        inputMode="numeric"
                      />
                    </td>
                    <td className="planilla-table__veta">
                      <VetaCheckbox
                        checked={Boolean(row.vetaLongitud)}
                        onChange={(v) => onUpdateRow(index, 'vetaLongitud', v)}
                      />
                    </td>
                    <td>
                      <SearchableSelect
                        value={row.l1}
                        onChange={(v) => onUpdateRow(index, 'l1', v)}
                        options={cantoOptions}
                        placeholder="L1"
                      />
                    </td>
                    <td>
                      <SearchableSelect
                        value={row.l2}
                        onChange={(v) => onUpdateRow(index, 'l2', v)}
                        options={cantoOptions}
                        placeholder="L2"
                      />
                    </td>
                    <td>
                      <SearchableSelect
                        value={row.a1}
                        onChange={(v) => onUpdateRow(index, 'a1', v)}
                        options={cantoOptions}
                        placeholder="A1"
                      />
                    </td>
                    <td>
                      <SearchableSelect
                        value={row.a2}
                        onChange={(v) => onUpdateRow(index, 'a2', v)}
                        options={cantoOptions}
                        placeholder="A2"
                      />
                    </td>
                    <td>
                      <input
                        className="planilla-input"
                        value={row.perforacionCantidad}
                        onChange={(e) => onUpdateRow(index, 'perforacionCantidad', e.target.value)}
                        inputMode="numeric"
                      />
                    </td>
                    <td>
                      <LadoSelect
                        value={row.perforacionLado1}
                        onChange={(v) => onUpdateRow(index, 'perforacionLado1', v)}
                      />
                    </td>
                    <td>
                      <LadoSelect
                        value={row.perforacionLado2}
                        onChange={(v) => onUpdateRow(index, 'perforacionLado2', v)}
                      />
                    </td>
                    <td>
                      <select
                        className="planilla-select"
                        value={row.ranuraDist || '10'}
                        onChange={(e) => onUpdateRow(index, 'ranuraDist', e.target.value)}
                      >
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="18">18</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="planilla-select"
                        value={row.ranuraProf || '6'}
                        onChange={(e) => onUpdateRow(index, 'ranuraProf', e.target.value)}
                      >
                        <option value="6">6</option>
                        <option value="8">8</option>
                        <option value="10">10</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="planilla-select"
                        value={row.ranuraEs || '4'}
                        onChange={(e) => onUpdateRow(index, 'ranuraEs', e.target.value)}
                      >
                        <option value="4">4</option>
                        <option value="7">7</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="planilla-input planilla-input--wide"
                        value={row.observacion}
                        onChange={(e) => onUpdateRow(index, 'observacion', e.target.value)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost planilla-remove"
                        onClick={() => onRemoveRow(index)}
                        disabled={rows.length === 1}
                        aria-label={`Quitar fila ${index + 1}`}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="planilla-modal__footer">
          <p className="muted small">Los cambios se aplican a la orden al guardar el detalle.</p>
          <button type="button" className="btn btn--primary" onClick={onSave}>
            Guardar detalle
          </button>
        </footer>
      </div>
    </div>
  )
}
