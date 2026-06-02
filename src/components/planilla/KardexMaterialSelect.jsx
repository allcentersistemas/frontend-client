/**
 * Selector de material del kardex (inventario).
 * @param {{ value: string, onChange: (v: string) => void, options: Array<{ id?: number, sku?: string, name: string, stockOnHand?: number|string }>, placeholder?: string, disabled?: boolean, className?: string }} props
 */
export function KardexMaterialSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  disabled = false,
  className = '',
}) {
  const list = Array.isArray(options) ? options : []

  function optionLabel(opt) {
    const name = (opt.name || opt.sku || '').trim()
    const sku = opt.sku && opt.name ? ` · ${opt.sku}` : ''
    const stock = Number(opt.stockOnHand)
    const stockLabel = Number.isFinite(stock) && stock > 0 ? ` (${stock} en stock)` : ''
    return `${name}${sku}${stockLabel}`
  }

  return (
    <select
      className={className ? className : 'planilla-select'}
      value={value || ''}
      disabled={disabled || !list.length}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{list.length ? placeholder : 'Sin artículos en kardex'}</option>
      {list.map((opt) => {
        const val = (opt.name || opt.sku || '').trim()
        if (!val) return null
        return (
          <option key={opt.id ?? val} value={val}>
            {optionLabel(opt)}
          </option>
        )
      })}
      {value && !list.some((o) => (o.name || o.sku || '').trim() === value) ? (
        <option value={value}>{value} (guardado)</option>
      ) : null}
    </select>
  )
}
