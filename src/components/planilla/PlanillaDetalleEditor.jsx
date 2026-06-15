import { useMemo } from 'react'
import { SearchableSelect } from './SearchableSelect'
import {
  DETALLE_TABLE_COLUMNS,
  LADO_OPTIONS,
  RANURA_DIST,
  RANURA_ES,
  RANURA_PROF,
} from '../../planilla/detalleColumns'

function VetaCheckbox({ checked, onChange, disabled = false }) {
  return (
    <label className="planilla-veta planilla-veta--compact" title={checked ? '1-Longitud' : '0-No'}>
      <input
        type="checkbox"
        className="planilla-veta__input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="planilla-veta__box" aria-hidden />
      <span className="planilla-veta__text">{checked ? '1-Long' : '0-No'}</span>
    </label>
  )
}

function DetalleCell({ column, row, onUpdate, tableros, cantoOptions, readOnly }) {
  const { key, type } = column

  if (readOnly) {
    if (type === 'veta') {
      return <span className="small">{row.vetaLongitud ? '1-Longitud' : '0-No'}</span>
    }
    return <span className="small">{row[key] || '—'}</span>
  }

  if (type === 'veta') {
    return (
      <VetaCheckbox checked={Boolean(row.vetaLongitud)} onChange={(v) => onUpdate('vetaLongitud', v)} />
    )
  }

  if (type === 'canto') {
    return (
      <SearchableSelect
        value={row[key]}
        onChange={(v) => onUpdate(key, v)}
        options={cantoOptions}
        placeholder="—"
        size="sm"
      />
    )
  }

  if (type === 'lado') {
    return (
      <select
        className="planilla-select planilla-select--block planilla-select--table"
        value={row[key] || 'NA'}
        onChange={(e) => onUpdate(key, e.target.value)}
      >
        {LADO_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (type === 'ranuraDist') {
    return (
      <select
        className="planilla-select planilla-select--block planilla-select--table"
        value={row.ranuraDist || 'NA'}
        onChange={(e) => onUpdate('ranuraDist', e.target.value)}
      >
        {RANURA_DIST.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (type === 'ranuraProf') {
    return (
      <select
        className="planilla-select planilla-select--block planilla-select--table"
        value={row.ranuraProf || 'NA'}
        onChange={(e) => onUpdate('ranuraProf', e.target.value)}
      >
        {RANURA_PROF.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (type === 'ranuraEs') {
    return (
      <select
        className="planilla-select planilla-select--block planilla-select--table"
        value={row.ranuraEs || 'NA'}
        onChange={(e) => onUpdate('ranuraEs', e.target.value)}
      >
        {RANURA_ES.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  if (key === 'tablero') {
    return (
      <SearchableSelect
        value={row.tablero}
        onChange={(v) => onUpdate('tablero', v)}
        options={tableros}
        placeholder="Tablero"
        size="sm"
      />
    )
  }

  return (
    <input
      className="planilla-input planilla-input--block planilla-input--table"
      value={row[key] || ''}
      onChange={(e) => onUpdate(key, e.target.value)}
      inputMode={type === 'number' ? 'numeric' : undefined}
      placeholder="—"
    />
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
        <div className="planilla-table-shell planilla-table-shell--detalle">
          <table className="planilla-detalle-table">
            <thead>
              <tr>
                <th className="planilla-detalle-table__num">#</th>
                {DETALLE_TABLE_COLUMNS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                {!readOnly ? <th className="planilla-detalle-table__actions"> </th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index}>
                  <td className="planilla-detalle-table__num">{index + 1}</td>
                  {DETALLE_TABLE_COLUMNS.map((col) => (
                    <td key={col.key} className={col.wide ? 'planilla-detalle-table__wide' : undefined}>
                      <DetalleCell
                        column={col}
                        row={row}
                        tableros={tableros}
                        cantoOptions={cantoOptions}
                        readOnly={readOnly}
                        onUpdate={(key, value) => onUpdateRow(index, key, value)}
                      />
                    </td>
                  ))}
                  {!readOnly ? (
                    <td className="planilla-detalle-table__actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => onRemoveRow(index)}
                        disabled={rows.length <= 1}
                        aria-label={`Quitar pieza ${index + 1}`}
                      >
                        Quitar
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
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
