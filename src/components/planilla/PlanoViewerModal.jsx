import { useEffect, useState } from 'react'
import { fetchProyectoPlanosViewBlobUrl } from '../../api/orderApi'

/**
 * Visor de planos PDF (solo lectura). Sin botón ni flujo de descarga.
 */
export function PlanoViewerModal({ proyectoId, proyectoNombre, open, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !proyectoId) {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
      setError('')
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError('')
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    ;(async () => {
      try {
        const url = await fetchProyectoPlanosViewBlobUrl(proyectoId)
        if (cancelled) {
          URL.revokeObjectURL(url)
          return
        }
        setBlobUrl(url)
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
    }
  }, [open, proyectoId])

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

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
          </div>
          <button type="button" className="btn btn--ghost planilla-modal__close" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <div className="plano-viewer-modal__body">
          {loading ? (
            <p className="muted pad">Cargando planos…</p>
          ) : error ? (
            <p className="form-error pad">{error}</p>
          ) : blobUrl ? (
            <iframe
              title="Planos del proyecto"
              className="plano-viewer-modal__frame"
              src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
