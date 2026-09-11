import { useEffect, useRef, useState } from 'react'
import { fetchProyectoPlanosPdfData } from '../../api/orderApi'
import { renderPdfToContainer } from './pdfViewer'

/**
 * Visor de planos PDF (solo lectura) renderizado con pdf.js en canvas.
 * Evita el iframe/object nativo, que en muchos navegadores queda en blanco con blob:.
 */
export function PlanoViewerModal({ proyectoId, proyectoNombre, open, onClose }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pageCount, setPageCount] = useState(0)
  const pagesRef = useRef(null)

  useEffect(() => {
    if (!open || !proyectoId) {
      setError('')
      setLoading(false)
      setPageCount(0)
      if (pagesRef.current) pagesRef.current.innerHTML = ''
      return undefined
    }

    let cancelled = false
    let pdfDoc = null
    setLoading(true)
    setError('')
    setPageCount(0)
    if (pagesRef.current) pagesRef.current.innerHTML = ''

    ;(async () => {
      try {
        const data = await fetchProyectoPlanosPdfData(proyectoId)
        if (cancelled) return
        const host = pagesRef.current
        if (!host) return
        const result = await renderPdfToContainer(data, host, {
          cancelled: () => cancelled,
        })
        pdfDoc = result.pdfDoc
        if (!cancelled) setPageCount(result.pageCount || 0)
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'No se pudieron cargar los planos.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      if (pdfDoc) {
        pdfDoc.destroy().catch(() => {})
      }
    }
  }, [open, proyectoId])

  if (!open) return null

  return (
    <div
      className="planilla-modal-backdrop plano-viewer-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="planilla-modal plano-viewer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plano-viewer-title"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <header className="planilla-modal__header plano-viewer-modal__header">
          <div className="min-w-0 flex-1">
            <p className="planilla-modal__eyebrow">Solo visualización · no descargable</p>
            <h2 id="plano-viewer-title" className="planilla-modal__title">
              Planos{proyectoNombre ? ` · ${proyectoNombre}` : ''}
            </h2>
            {pageCount > 0 ? (
              <p className="muted small" style={{ margin: '0.25rem 0 0' }}>
                {pageCount} página{pageCount === 1 ? '' : 's'}
              </p>
            ) : null}
          </div>
          <button type="button" className="btn btn--ghost planilla-modal__close" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <div className="plano-viewer-modal__body">
          {loading ? (
            <p className="muted pad plano-viewer-modal__status">Cargando planos…</p>
          ) : null}
          {error ? <p className="form-error pad plano-viewer-modal__status">{error}</p> : null}
          <div
            ref={pagesRef}
            className="plano-viewer-modal__pages"
            hidden={loading || Boolean(error)}
          />
        </div>
      </div>
    </div>
  )
}
