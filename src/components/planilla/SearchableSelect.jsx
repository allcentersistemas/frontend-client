import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

function optionValue(opt) {
  return (opt.name || opt.sku || '').trim()
}

/**
 * @param {{ value: string, onChange: (v: string) => void, options: Array<{ id?: number|string, sku?: string, name: string }>, placeholder?: string, disabled?: boolean, className?: string, size?: 'sm' | 'md' }} props
 */
export function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar…',
  disabled = false,
  className,
  size = 'md',
}) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [panelRect, setPanelRect] = useState(null)

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

    function updatePosition() {
      if (!rootRef.current) return
      const rect = rootRef.current.getBoundingClientRect()
      const maxH = Math.min(280, window.innerHeight - rect.bottom - 12)
      setPanelRect({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
        maxHeight: maxH > 120 ? maxH : 280,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    function onDocClick(e) {
      const panel = document.getElementById('searchable-select-panel')
      if (
        rootRef.current &&
        !rootRef.current.contains(e.target) &&
        !(panel && panel.contains(e.target))
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', onDocClick)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', onDocClick)
    }
  }, [open])

  const panel =
    open && panelRect
      ? createPortal(
          <div
            id="searchable-select-panel"
            className="searchable-select__panel searchable-select__panel--portal"
            role="listbox"
            style={{
              position: 'fixed',
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
              maxHeight: panelRect.maxHeight,
            }}
          >
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
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <div
        ref={rootRef}
        className={cn(
          'searchable-select',
          size === 'sm' && 'searchable-select--sm',
          className,
        )}
      >
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
      </div>
      {panel}
    </>
  )
}
