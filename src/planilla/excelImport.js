import * as XLSX from 'xlsx'
import { newDetalle } from './helpers'
import { normalizeMeasureInput } from './measureInput'

const CANTIDAD_ALIASES = ['cantidad', 'cant', 'cantmin', 'pminq', 'qty', 'cantminima']
const LARGO_ALIASES = ['largo', 'largoveta', 'longitud', 'plength', 'length']
const ANCHO_ALIASES = ['ancho', 'pwidth', 'width']

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_\[\]]+/g, '')
}

function columnMatches(normalized, aliases) {
  return aliases.some((alias) => normalized === alias || normalized.includes(alias))
}

function findColumnIndices(headerRow) {
  const headers = (headerRow ?? []).map(normalizeHeader)
  let cantIdx = -1
  let largoIdx = -1
  let anchoIdx = -1
  headers.forEach((header, index) => {
    if (cantIdx < 0 && columnMatches(header, CANTIDAD_ALIASES)) cantIdx = index
    if (largoIdx < 0 && columnMatches(header, LARGO_ALIASES)) largoIdx = index
    if (anchoIdx < 0 && columnMatches(header, ANCHO_ALIASES)) anchoIdx = index
  })
  return { cantIdx, largoIdx, anchoIdx }
}

function rowLooksNumeric(values) {
  const nums = values.slice(0, 3).filter((v) => v !== '' && v != null)
  if (nums.length < 2) return false
  return nums.every((v) => /^[\d.,]+$/.test(String(v).trim()))
}

function parseCantidad(raw) {
  return normalizeMeasureInput(raw)
}

/** Convierte medida del Excel a unidad de planilla (÷10 si viene del export optimizador). */
function parseBoardMeasure(raw) {
  if (raw == null || raw === '') return ''
  const cleaned = String(raw).trim().replace(',', '.')
  const n = Number(cleaned.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return ''
  let val = Math.round(n)
  if (val >= 510) val = Math.round(val / 10)
  return String(val)
}

function cell(row, index) {
  if (index < 0 || !row) return ''
  return row[index] ?? ''
}

/**
 * Lee un .xlsx/.xls con columnas Cantidad, Largo y Ancho.
 * @param {File} file
 * @returns {Promise<{ rows: ReturnType<typeof newDetalle>[] }>}
 */
export async function parseSimpleDetalleExcel(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('El archivo Excel no tiene hojas.')
  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!matrix.length) throw new Error('El archivo Excel está vacío.')

  let headerRowIndex = 0
  let cols = findColumnIndices(matrix[0])
  if (cols.cantIdx < 0 || cols.largoIdx < 0 || cols.anchoIdx < 0) {
    const second = findColumnIndices(matrix[1])
    if (second.cantIdx >= 0 && second.largoIdx >= 0 && second.anchoIdx >= 0) {
      cols = second
      headerRowIndex = 1
    } else if (rowLooksNumeric(matrix[0])) {
      cols = { cantIdx: 0, largoIdx: 1, anchoIdx: 2 }
      headerRowIndex = -1
    } else {
      throw new Error(
        'El Excel debe tener columnas «Cantidad», «Largo» y «Ancho» (primera fila como encabezado).',
      )
    }
  }

  const dataStart = headerRowIndex >= 0 ? headerRowIndex + 1 : 0
  const rows = []
  for (let i = dataStart; i < matrix.length; i += 1) {
    const line = matrix[i]
    const cantidad = parseCantidad(cell(line, cols.cantIdx))
    const largoVeta = parseBoardMeasure(cell(line, cols.largoIdx))
    const ancho = parseBoardMeasure(cell(line, cols.anchoIdx))
    if (!cantidad && !largoVeta && !ancho) continue
    rows.push({ ...newDetalle(), cantidad, largoVeta, ancho })
  }

  if (!rows.length) {
    throw new Error('No se encontraron filas con cantidad, largo o ancho en el Excel.')
  }

  return { rows }
}
