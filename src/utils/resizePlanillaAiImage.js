/**
 * Redimensiona una imagen de planilla a JPEG ~maxSide px (lado largo) para reducir tokens de visión.
 * @param {File|Blob} file
 * @param {{ maxSide?: number, quality?: number }} [opts]
 * @returns {Promise<File>}
 */
export async function resizePlanillaAiImage(file, opts = {}) {
  const maxSide = opts.maxSide ?? 1600
  const quality = opts.quality ?? 0.82
  if (!file || !(file instanceof Blob)) {
    throw new Error('Archivo de imagen inválido.')
  }

  const bitmap = await loadImageBitmap(file)
  try {
    const { width, height } = bitmap
    const longSide = Math.max(width, height)
    const scale = longSide > maxSide ? maxSide / longSide : 1
    const targetW = Math.max(1, Math.round(width * scale))
    const targetH = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('No se pudo preparar el canvas para comprimir la imagen.')
    }
    ctx.drawImage(bitmap, 0, 0, targetW, targetH)

    const blob = await canvasToJpegBlob(canvas, quality)
    const baseName = (file.name || 'planilla-foto').replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } finally {
    if (typeof bitmap.close === 'function') {
      bitmap.close()
    }
  }
}

async function loadImageBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // fallback below (p. ej. HEIC en algunos navegadores)
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      el.src = url
    })
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function canvasToJpegBlob(canvas, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo comprimir la imagen.'))
          return
        }
        resolve(blob)
      },
      'image/jpeg',
      quality,
    )
  })
}
