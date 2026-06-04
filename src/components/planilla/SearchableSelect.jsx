import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/cn'

function optionValue(opt) {
  return (opt.name || opt.sku || '').trim()
}

/**
 * @param {{ value: string, onChange: (v: string) => void, options: Array<{ id?: number|string, sku?: string, name: string }>, placeholder?: string, disabled?: boolean, className?: string }} props
 */
export function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar…',
  disabled = false,
  className,
}) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((opt) => {
      const label = `${opt.name || ''} ${opt.sku || ''}`.toLowerCase()
      return label.includes(q)
    })
  }, [options, search])

  const selectedLabel = useMemo(() => {
    if (!value) return placeholder
    const hit = options.find((o) => optionValue(o) === value || String(o.id) === value)
    return hit ? optionValue(hit) || value : value
  }, [options, value, placeholder])

  useEffect(() => {
    if (!open) return
    function onDocClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={rootRef} className={cn('searchable-select', className)}>
      <button
        type="button"
        className="searchable-select__trigger"
        disabled={disabled || !options.length}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="truncate">{options.length ? selectedLabel : 'Sin opciones'}</span>
        <span className="searchable-select__chev" aria-hidden>
          ▾
        </span>
      </button>
      {open ? (
        <div className="searchable-select__panel" role="listbox">
          <input
            type="search"
            className="searchable-select__search"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <ul className="searchable-select__list">
            {filtered.length === 0 ? (
              <li className="searchable-select__empty">Sin resultados</li>
            ) : (
              filtered.map((opt) => {
                const val = optionValue(opt)
                if (!val) return null
                return (
                  <li key={opt.id ?? val}>
                    <button
                      type="button"
                      className={cn(
                        'searchable-select__option',
                        value === val && 'searchable-select__option--active',
                      )}
                      onClick={() => {
                        onChange(val)
                        setOpen(false)
                        setSearch('')
                      }}
                    >
                      <span className="truncate">{opt.name || opt.sku}</span>
                      {opt.sku && opt.name ? (
                        <span className="searchable-select__sku">{opt.sku}</span>
                      ) : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
