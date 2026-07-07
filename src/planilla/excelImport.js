import * as XLSX from 'xlsx'
import { EXCEL_EXPORT_COLUMNS } from './detalleColumns'
import { newDetalle } from './helpers'
import { normalizeMeasureInput } from './measureInput'
import {
  PLANILLA_EXCEL_TITLE,
  PLANILLA_TEMPLATE_COLUMN_KEYS,
} from './planillaExcelLayout'
import { applyCantoCatalogToRows } from './cantoImportValidation'

const FIELD_ALIASES = {
  tablero: ['materialcoloryespesor', 'material', 'tablero', 'pcodemat', 'codemat'],
  cantidad: ['cantidad', 'cantmin', 'pminq', 'qty', 'cantminima'],
  largoVeta: ['largo', 'largoveta', 'longitud', 'plength', 'length'],
  ancho: ['ancho', 'pwidth', 'width'],
  l1: ['l1', 'lsuperior', 'superior', 'pedgematup', 'matedgeup', 'matsup'],
  l2: ['l2', 'linferior', 'inferior', 'pedgematlo', 'matedgelo', 'matinf'],
  a1: ['a1', 'aizquierda', 'izquierda', 'pedgematsx', 'matedgel', 'matizq'],
  a2: ['a2', 'aderecha', 'derecha', 'pedgematdx', 'matedger', 'matder'],
  observacion: ['descripcion', 'pdesc', 'observacion', 'descripcio', 'piidesc'],
  perforacionCantidad: ['perfcant', 'perforacioncant', 'cantperf'],
  perforacionLado1: ['perflado', 'perforacionlado'],
  ranuraLado: ['ranuralado', 'ranlado'],
  ranuraDist: ['randist', 'ranuradist', 'dist'],
  ranuraProf: ['ranprof', 'ranuraprof', 'prof'],
  ranuraEs: ['ranes', 'ranuraes', 'esp'],
  vetaLongitud: ['veta', 'pgrain', 'grain'],
}

function normalizeHeader(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_\[\]()\-./]+/g, '')
}

function columnMatches(normalized, aliases) {
  if (!normalized) return false
  return aliases.some((alias) => normalized === alias)
}

function columnMatchesLoose(normalized, aliases) {
  if (!normalized) return false
  return aliases.some((alias) => normalized === alias || normalized.includes(alias))
}

function parseExcelNumber(raw) {
  if (raw == null || raw === '') return NaN
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  const cleaned = String(raw).trim().replace(',', '.')
  const n = Number(cleaned.replace(/[^\d.]/g, ''))
  return Number.isFinite(n) ? n : NaN
}

function parseCantidad(raw) {
  return normalizeMeasureInput(raw)
}

/**
 * Medidas en plantilla: tal cual (560 → 560).
 * Solo export optimizador del sistema (×10) se divide al reimportar.
 */
function parseBoardMeasure(raw, { scaleFromOptimizer } = {}) {
  if (raw == null || raw === '') return ''
  const n = parseExcelNumber(raw)
  if (!Number.isFinite(n) || n <= 0) return ''
  let val = Math.round(n)
  if (scaleFromOptimizer) val = Math.round(val / 10)
  return String(val)
}

function parseTextCell(raw) {
  if (raw == null) return ''
  return String(raw).trim()
}

function cell(row, index) {
  if (index < 0 || !row) return ''
  return row[index] ?? ''
}

function rowLooksNumeric(values) {
  const nums = values.slice(0, 3).filter((v) => v !== '' && v != null)
  if (nums.length < 2) return false
  return nums.every((v) => /^[\d.,]+$/.test(String(v).trim()))
}

function rowIsEmpty(line) {
  return !(line ?? []).some((v) => String(v ?? '').trim() !== '')
}

function rowJoinNormalized(row) {
  return (row ?? []).map(normalizeHeader).join('|')
}

function isPlanillaLabelRow(row) {
  const join = rowJoinNormalized(row)
  return join.includes('cantidad') && join.includes('largo') && join.includes('ancho')
}

function isPlanillaWorkbook(matrix) {
  for (let i = 0; i < Math.min(12, matrix.length); i += 1) {
    const row = matrix[i] ?? []
    const text = row.map(normalizeHeader).join(' ')
    if (text.includes('listadodepiezas')) return true
    if (text.includes('piezasacortar') && text.includes('tablero')) return true
    if (isPlanillaLabelRow(row)) return true
  }
  return false
}

function mapColumnsFromHeaderRow(headerRow) {
  const headers = (headerRow ?? []).map(normalizeHeader)
  const cols = {}
  const perfLado = []
  const ranuraLado = []
  const genericLado = []

  headers.forEach((header, index) => {
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      if (cols[field] != null) continue
      if (columnMatches(header, aliases)) {
        cols[field] = index
        return
      }
    }
    if (header === 'lado') genericLado.push(index)
    if (columnMatchesLoose(header, ['perflado', 'perforacionlado'])) perfLado.push(index)
    if (columnMatchesLoose(header, ['ranuralado', 'ranlado'])) ranuraLado.push(index)
  })

  if (cols.perforacionLado1 == null && perfLado.length) {
    cols.perforacionLado1 = perfLado[0]
  } else if (cols.perforacionLado1 == null && genericLado.length >= 1) {
    cols.perforacionLado1 = genericLado[0]
  }
  if (cols.ranuraLado == null && ranuraLado.length) {
    cols.ranuraLado = ranuraLado[0]
  } else if (cols.ranuraLado == null && genericLado.length >= 2) {
    cols.ranuraLado = genericLado[1]
  } else if (cols.ranuraLado == null && genericLado.length === 1 && cols.perforacionLado1 !== genericLado[0]) {
    cols.ranuraLado = genericLado[0]
  }

  return cols
}

function mapColumnsFromTemplateLayout() {
  const cols = {}
  PLANILLA_TEMPLATE_COLUMN_KEYS.forEach((key, index) => {
    if (!key || key === 'num' || key === '_skip') return
    cols[key] = index
  })
  return cols
}

function mapColumnsFromTemplateKeys(headerRow) {
  return mapColumnsFromTemplateLayout()
}

function hasRequiredMeasureColumns(cols) {
  return cols.cantidad != null && cols.largoVeta != null && cols.ancho != null
}

/** Plantilla LISTADO DE PIEZAS (con o sin fila técnica [P_LENGTH] en encabezados). */
function detectPlanillaTemplate(matrix) {
  for (let i = 0; i < Math.min(12, matrix.length); i += 1) {
    if (!isPlanillaLabelRow(matrix[i])) continue
    const cols = mapColumnsFromTemplateKeys(matrix[i])
    if (hasRequiredMeasureColumns(cols)) {
      return {
        format: 'planilla',
        headerRowIndex: i,
        dataStart: i + 1,
        cols,
      }
    }
  }

  for (let i = 0; i < Math.min(8, matrix.length); i += 1) {
    const text = (matrix[i] ?? []).map(normalizeHeader).join(' ')
    if (!text.includes('listadodepiezas')) continue
    for (let j = i + 1; j < Math.min(i + 5, matrix.length); j += 1) {
      if (!isPlanillaLabelRow(matrix[j])) continue
      const cols = mapColumnsFromTemplateKeys(matrix[j])
      if (hasRequiredMeasureColumns(cols)) {
        return {
          format: 'planilla',
          headerRowIndex: j,
          dataStart: j + 1,
          cols,
        }
      }
    }
    return {
      format: 'planilla',
      headerRowIndex: i + 2,
      dataStart: i + 3,
      cols: mapColumnsFromTemplateLayout(),
    }
  }

  return null
}

/**
 * Export optimizador del sistema (fila 0 técnica, fila 1 etiquetas, datos desde fila 2).
 * No aplica si el libro es plantilla LISTADO DE PIEZAS.
 */
function detectOptimizerExport(matrix) {
  if (isPlanillaWorkbook(matrix)) return null

  const technical = rowJoinNormalized(matrix[0])
  if (!technical.includes('plength') || !technical.includes('pwidth') || !technical.includes('pminq')) {
    return null
  }

  const cols = {}
  EXCEL_EXPORT_COLUMNS.forEach((col) => {
    const idx = (matrix[0] ?? []).findIndex((cellValue) => {
      const h = normalizeHeader(cellValue)
      return h === normalizeHeader(col.technical) || columnMatches(h, FIELD_ALIASES[col.key] ?? [])
    })
    if (idx >= 0) cols[col.key] = idx
  })
  const legacy = mapColumnsFromHeaderRow(matrix[0])

  return {
    format: 'optimizer',
    headerRowIndex: 0,
    dataStart: 2,
    cols: {
      cantidad: cols.pMinq ?? legacy.cantidad,
      largoVeta: cols.pLength ?? legacy.largoVeta,
      ancho: cols.pWidth ?? legacy.ancho,
      l1: cols.pEdgeMaSup ?? legacy.l1,
      l2: cols.pEdgeMaInf ?? legacy.l2,
      a1: cols.pEdgeMaIzq ?? legacy.a1,
      a2: cols.pEdgeMaDer ?? legacy.a2,
      observacion: cols.pIidesc ?? legacy.observacion,
      vetaLongitud: cols.pGrain ?? legacy.vetaLongitud,
      perforacionDesc: cols.pIdesc,
    },
  }
}

function detectGenericHeader(matrix) {
  for (let i = 0; i < Math.min(6, matrix.length); i += 1) {
    const cols = mapColumnsFromHeaderRow(matrix[i])
    if (hasRequiredMeasureColumns(cols)) {
      return { format: 'planilla', headerRowIndex: i, dataStart: i + 1, cols }
    }
  }
  if (rowLooksNumeric(matrix[0])) {
    return {
      format: 'planilla',
      headerRowIndex: -1,
      dataStart: 0,
      cols: { cantidad: 0, largoVeta: 1, ancho: 2 },
    }
  }
  return null
}

function buildRowFromLine(line, cols, { scaleFromOptimizer }) {
  const cantidad = parseCantidad(cell(line, cols.cantidad))
  const largoVeta = parseBoardMeasure(cell(line, cols.largoVeta), { scaleFromOptimizer })
  const ancho = parseBoardMeasure(cell(line, cols.ancho), { scaleFromOptimizer })
  const l1 = parseTextCell(cell(line, cols.l1))
  const l2 = parseTextCell(cell(line, cols.l2))
  const a1 = parseTextCell(cell(line, cols.a1))
  const a2 = parseTextCell(cell(line, cols.a2))

  if (!cantidad && !largoVeta && !ancho && !l1 && !l2 && !a1 && !a2) return null

  return {
    ...newDetalle(),
    cantidad,
    largoVeta,
    ancho,
    l1,
    l2,
    a1,
    a2,
  }
}

function resolveLayout(matrix) {
  const planilla = detectPlanillaTemplate(matrix)
  if (planilla) return planilla

  const optimizer = detectOptimizerExport(matrix)
  if (optimizer) return optimizer

  const generic = detectGenericHeader(matrix)
  if (generic) return generic

  throw new Error(
    `El Excel debe tener columnas «Cantidad», «Largo» y «Ancho» (plantilla «${PLANILLA_EXCEL_TITLE}» o exportación optimizador).`,
  )
}

/**
 * Lee un .xlsx/.xls (hasta cantos: medidas + L1–A2).
 * @param {File} file
 * @param {{ cantoOptions?: Array<{ name?: string, sku?: string }> }} [opts]
 * @returns {Promise<{ rows: ReturnType<typeof newDetalle>[], cantoErrors: Array<{ row: number, field: string, value: string }> }>}
 */
export async function parsePlanillaDetalleExcel(file, opts = {}) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('El archivo Excel no tiene hojas.')
  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!matrix.length) throw new Error('El archivo Excel está vacío.')

  const layout = resolveLayout(matrix)
  const scaleFromOptimizer = layout.format === 'optimizer'
  const rows = []

  for (let i = layout.dataStart; i < matrix.length; i += 1) {
    const line = matrix[i]
    if (rowIsEmpty(line)) continue
    const row = buildRowFromLine(line, layout.cols, { scaleFromOptimizer })
    if (row) rows.push(row)
  }

  if (!rows.length) {
    throw new Error('No se encontraron filas con datos en el Excel.')
  }

  const { rows: withCantos, errors } = applyCantoCatalogToRows(rows, opts.cantoOptions)

  return { rows: withCantos, cantoErrors: errors }
}

/** @deprecated Usar parsePlanillaDetalleExcel */
export const parseSimpleDetalleExcel = parsePlanillaDetalleExcel
