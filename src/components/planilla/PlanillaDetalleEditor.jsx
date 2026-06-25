import { useEffect, useMemo, useState } from 'react'
import { SearchableSelect } from './SearchableSelect'
import {
  DETALLE_TABLE_COLUMNS,
  DETALLE_TABLE_GROUPS,
  LADO_OPTIONS,
  RANURA_DIST,
  RANURA_ES,
  RANURA_PROF,
} from '../../planilla/detalleColumns'
import { cellNavProps, DETALLE_COLUMN_KEYS, focusDetalleCell } from '../../planilla/detalleTableFocus'
import { normalizeMeasureInput } from '../../planilla/measureInput'

function VetaCheckbox({ checked, onChange, disabled = false, navProps = {} }) {
  return (
    <label className="planilla-veta planilla-veta--compact" title={checked ? '1-Longitud' : '0-No'}>
      <input
        type="checkbox"
        className="planilla-veta__input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        {...navProps}
      />
      <span className="planilla-veta__box" aria-hidden />
      <span className="planilla-veta__text">{checked ? '1-Long' : '0-No'}</span>
    </label>
  )
}

function formatReadonlyCell(value) {
  if (value == null || value === '' || String(value).trim().toUpperCase() === 'NA') return '—'
  return String(value)
}

function DetalleCell({ column, row, rowIndex, tabHandlers, onUpdate, onPatch, tableros, cantoOptions, readOnly }) {
  const { key, type } = column
  const nav = readOnly ? {} : cellNavProps(rowIndex, key, tabHandlers)

  if (readOnly) {
    if (type === 'veta' || type === 'ranuraEspecial') {
      const on = type === 'veta' ? row.vetaLongitud : row.ranuraEspecial
      return (
        <span className="planilla-detalle-table__readonly">
          {type === 'veta' ? (on ? '1-Long' : '0-No') : on ? 'Sí' : 'No'}
        </span>
      )
    }
    return <span className="planilla-detalle-table__readonly">{formatReadonlyCell(row[key])}</span>
  }

  if (type === 'ranuraEspecial') {
    return (
      <label className="planilla-veta planilla-veta--compact" title="Ranura especial (valores manuales)">
        <input
          type="checkbox"
          className="planilla-veta__input"
          checked={Boolean(row.ranuraEspecial)}
          onChange={(e) => {
            const checked = e.target.checked
            const patch = { ranuraEspecial: checked }
            if (!checked) {
              patch.ranuraDist = RANURA_DIST.includes(row.ranuraDist) ? row.ranuraDist || 'NA' : 'NA'
              patch.ranuraProf = RANURA_PROF.includes(row.ranuraProf) ? row.ranuraProf || 'NA' : 'NA'
              patch.ranuraEs = RANURA_ES.includes(row.ranuraEs) ? row.ranuraEs || 'NA' : 'NA'
            } else {
              if (!row.ranuraDist || row.ranuraDist === 'NA') patch.ranuraDist = ''
              if (!row.ranuraProf || row.ranuraProf === 'NA') patch.ranuraProf = ''
              if (!row.ranuraEs || row.ranuraEs === 'NA') patch.ranuraEs = ''
            }
            onPatch(patch)
          }}
          {...nav}
        />
        <span className="planilla-veta__box" aria-hidden />
        <span className="planilla-veta__text">Esp.</span>
      </label>
    )
  }

  if (type === 'veta') {
    return (
      <VetaCheckbox
        checked={Boolean(row.vetaLongitud)}
        onChange={(v) => onUpdate('vetaLongitud', v)}
        navProps={nav}
      />
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
        triggerProps={nav}
      />
    )
  }

  if (type === 'lado') {
    return (
      <select
        className="planilla-select planilla-select--block planilla-select--table"
        value={row[key] || 'NA'}
        onChange={(e) => onUpdate(key, e.target.value)}
        {...nav}
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
    if (row.ranuraEspecial) {
      return (
        <input
          className="planilla-input planilla-input--block planilla-input--table"
          value={row.ranuraDist || ''}
          onChange={(e) => onUpdate('ranuraDist', normalizeMeasureInput(e.target.value))}
          inputMode="numeric"
          placeholder="—"
          {...nav}
        />
      )
    }
    return (
      <select
        className="planilla-select planilla-select--block planilla-select--table"
        value={row.ranuraDist || 'NA'}
        onChange={(e) => onUpdate('ranuraDist', e.target.value)}
        {...nav}
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
    if (row.ranuraEspecial) {
      return (
        <input
          className="planilla-input planilla-input--block planilla-input--table"
          value={row.ranuraProf || ''}
          onChange={(e) => onUpdate('ranuraProf', normalizeMeasureInput(e.target.value))}
          inputMode="numeric"
          placeholder="—"
          {...nav}
        />
      )
    }
    return (
      <select
        className="planilla-select planilla-select--block planilla-select--table"
        value={row.ranuraProf || 'NA'}
        onChange={(e) => onUpdate('ranuraProf', e.target.value)}
        {...nav}
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
    if (row.ranuraEspecial) {
      return (
        <input
          className="planilla-input planilla-input--block planilla-input--table"
          value={row.ranuraEs || ''}
          onChange={(e) => onUpdate('ranuraEs', normalizeMeasureInput(e.target.value))}
          inputMode="numeric"
          placeholder="—"
          {...nav}
        />
      )
    }
    return (
      <select
        className="planilla-select planilla-select--block planilla-select--table"
        value={row.ranuraEs || 'NA'}
        onChange={(e) => onUpdate('ranuraEs', e.target.value)}
        {...nav}
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
        triggerProps={nav}
      />
    )
  }

  return (
    <input
      className="planilla-input planilla-input--block planilla-input--table"
      value={row[key] || ''}
      onChange={(e) =>
        onUpdate(key, type === 'number' ? normalizeMeasureInput(e.target.value) : e.target.value)
      }
      inputMode={type === 'number' ? 'numeric' : undefined}
      placeholder="—"
      {...nav}
    />
  )
}

export function PlanillaDetalleEditor({
  order,
  projectName,
  rows,
  sharedTablero = '',
  onSharedTableroChange,
  tableros,
  cantoOptions,
  readOnly = false,
  onClose,
  onSave,
  onAddRow,
  onUpdateRow,
  onPatchRow,
  onRemoveRow,
  onDownloadExcel,
  maquinaParametros,
}) {
  const [pendingFocus, setPendingFocus] = useState(null)

  const tabHandlers = useMemo(
    () => ({
      onEndOfRow: (rowIndex) => {
        if (!onAddRow) return
        onAddRow()
        setPendingFocus({ row: rowIndex + 1, col: DETALLE_COLUMN_KEYS[0] })
      },
    }),
    [onAddRow],
  )

  useEffect(() => {
    if (!pendingFocus) return
    const frame = requestAnimationFrame(() => {
      if (focusDetalleCell(pendingFocus.row, pendingFocus.col)) {
        setPendingFocus(null)
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [pendingFocus, rows])

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
        <div className="flex flex-wrap items-end gap-3">
          {!readOnly ? (
            <label className="field" style={{ minWidth: 'min(100%, 280px)', flex: '1 1 240px' }}>
              <span>Material (tablero) · toda la orden</span>
              <SearchableSelect
                value={sharedTablero}
                onChange={onSharedTableroChange}
                options={tableros}
                placeholder="Seleccione tablero"
                size="sm"
              />
            </label>
          ) : sharedTablero ? (
            <p className="small muted m-0">
              Material: <strong>{sharedTablero}</strong>
            </p>
          ) : null}
          {!readOnly ? (
            <button type="button" className="btn btn--primary btn--sm" onClick={onAddRow}>
              + Agregar fila
            </button>
          ) : (
            <span className="tag tag--ok">Solo lectura</span>
          )}
        </div>
        <p className="planilla-modal__hint small muted m-0">
          Cada fila es una pieza. Use Tab para avanzar entre columnas; al final de la fila se crea una nueva.
        </p>
      </div>

      <div className="planilla-modal__body planilla-modal__body--table">
        <div className="planilla-table-shell planilla-table-shell--detalle">
          <table className="planilla-detalle-table">
            <thead>
              <tr className="planilla-detalle-table__group-row">
                <th className="planilla-detalle-table__num" rowSpan={2}>
                  #
                </th>
                {DETALLE_TABLE_GROUPS.map((g) => (
                  <th
                    key={g.id}
                    colSpan={g.span}
                    className={`planilla-detalle-table__group planilla-detalle-table__group--${g.id}`}
                  >
                    {g.label}
                  </th>
                ))}
                {!readOnly ? (
                  <th className="planilla-detalle-table__actions" rowSpan={2}>
                    {' '}
                  </th>
                ) : null}
              </tr>
              <tr>
                {DETALLE_TABLE_COLUMNS.map((col) => (
                  <th key={col.key} className={col.wide ? 'planilla-detalle-table__wide' : undefined}>
                    {col.label}
                  </th>
                ))}
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
                        rowIndex={index}
                        tabHandlers={tabHandlers}
                        tableros={tableros}
                        cantoOptions={cantoOptions}
                        readOnly={readOnly}
                        onUpdate={(key, value) => onUpdateRow(index, key, value)}
                        onPatch={(patch) => onPatchRow?.(index, patch)}
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
                        aria-label={`Quitar fila ${index + 1}`}
                        title="Quitar fila"
                        tabIndex={-1}
                      >
                        ×
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
