import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

let workerSetup = null

/**
 * Nginx a veces sirve `.mjs` como `application/octet-stream` y el Worker falla.
 * Reempaquetamos el worker en un blob con MIME `text/javascript`.
 */
export function ensurePdfWorker() {
  if (workerSetup) return workerSetup
  workerSetup = (async () => {
    const res = await fetch(pdfWorkerUrl)
    if (!res.ok) {
      throw new Error(`No se pudo cargar el visor PDF (worker ${res.status}).`)
    }
    const buf = await res.arrayBuffer()
    const blob = new Blob([buf], { type: 'text/javascript' })
    GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob)
  })().catch((err) => {
    workerSetup = null
    throw err
  })
  return workerSetup
}

export async function renderPdfToContainer(data, host, { cancelled } = {}) {
  await ensurePdfWorker()
  const pdfDoc = await getDocument({ data, disableAutoFetch: true, disableStream: true }).promise
  if (cancelled?.()) {
    await pdfDoc.destroy().catch(() => {})
    return { pdfDoc: null, pageCount: 0 }
  }
  const total = pdfDoc.numPages
  host.innerHTML = ''
  for (let pageNum = 1; pageNum <= total; pageNum += 1) {
    if (cancelled?.()) break
    const page = await pdfDoc.getPage(pageNum)
    const base = page.getViewport({ scale: 1 })
    const maxWidth = Math.min(host.clientWidth || 900, 1100)
    const scale = Math.min(2, Math.max(1, maxWidth / base.width))
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.className = 'plano-viewer-modal__page'
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    canvas.setAttribute('aria-label', `Página ${pageNum} de ${total}`)
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('No se pudo inicializar el lienzo del PDF.')
    await page.render({ canvasContext: ctx, viewport }).promise
    if (cancelled?.()) break
    host.appendChild(canvas)
  }
  return { pdfDoc, pageCount: total }
}
