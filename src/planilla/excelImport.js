import * as XLSX from 'xlsx'
import { EXCEL_EXPORT_COLUMNS } from './detalleColumns'
import { newDetalle } from './helpers'
import { normalizeMeasureInput } from './measureInput'
import {
  PLANILLA_EXCEL_TITLE,
  PLANILLA_TEMPLATE_COLUMN_KEYS,
} from './planillaExcelLayout'
import { applyCantoCatalogToRows } from './cantoImportValidation'
import { applyRanuraImportToRows } from './ranuraImportValidation'

/**
 * Alias por campo. Se mapea etiqueta → campo del formulario:
 * CANTIDAD→cantidad, LARGO→largo, ANCHO→ancho, L1→l1, …, DESCRIPCION→observacion.
 */
const FIELD_ALIASES = {
  tablero: ['materialcoloryespesor', 'material', 'tablero', 'pcodemat', 'codemat'],
  cantidad: ['cantidad', 'cantmin', 'pminq', 'qty', 'cantminima'],
  largoVeta: ['largo', 'largoveta', 'longitud', 'plength', 'length'],
  ancho: ['ancho', 'pwidth', 'width'],
  l1: [
    'l1',
    'l1superior',
    'lsuperior',
    'superior',
    'pedgematup',
    'edgematup',
    'matedgeup',
    'matsup',
  ],
  l2: [
    'l2',
    'l2inferior',
    'linferior',
    'inferior',
    'pedgematlo',
    'pegdematlo',
    'edgematlo',
    'matedgelo',
    'matinf',
  ],
  a1: [
    'a1',
    'a1izquierda',
    'aizquierda',
    'izquierda',
    'pedgematsx',
    'edgematsx',
    'matedgel',
    'matizq',
  ],
  a2: [
    'a2',
    'a2derecha',
    'aderecha',
    'derecha',
    'pedgematdx',
    'edgematdx',
    'matedger',
    'matder',
  ],
  observacion: [
    'descripcion',
    'pidesc',
    'piidesc',
    'pdesc',
    'observacion',
    'descripcio',
    'desc',
  ],
  perforacionCantidad: ['cant', 'perfcant', 'perforacioncant', 'cantperf'],
  perforacionLado1: ['perflado', 'perforacionlado', 'perflado1'],
  ranuraLado: ['ranuralado', 'ranlado', 'ranlado1'],
  ranuraDist: ['randist', 'ranuradist', 'dist'],
  ranuraProf: ['ranprof', 'ranuraprof', 'prof'],
  ranuraEs: ['ranes', 'ranuraes', 'esp', 'es'],
  vetaLongitud: ['veta', 'pgrain', 'grain'],
}

/** Orden de prioridad al resolver encabezados (evita que CANT robe CANTIDAD). */
const FIELD_RESOLVE_ORDER = [
  'cantidad',
  'largoVeta',
  'ancho',
  'l1',
  'l2',
  'a1',
  'a2',
  'observacion',
  'tablero',
  'perforacionCantidad',
  'perforacionLado1',
  'ranuraLado',
  'ranuraDist',
  'ranuraProf',
  'ranuraEs',
  'vetaLongitud',
]

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

/** L1 (Superior) → l1superior debe mapear a l1. */
function columnMatchesField(normalized, field, aliases) {
  if (!normalized) return false
  if (columnMatches(normalized, aliases)) return true
  if (['l1', 'l2', 'a1', 'a2'].includes(field) && normalized.startsWith(field)) {
    return true
  }
  return false
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
  if (index < 0 || index == null || !row) return ''
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
    if (text.includes('piezasacortar')) return true
    if (isPlanillaLabelRow(row)) return true
  }
  return false
}

/** Mapeo por nombre de columna: CANTIDAD→cantidad, LARGO→largo, L1→l1, DESCRIPCION→observacion. */
function mapColumnsFromHeaderRow(headerRow) {
  const headers = (headerRow ?? []).map(normalizeHeader)
  const cols = {}
  const used = new Set()
  const perfLado = []
  const ranuraLado = []
  const genericLado = []
  const genericCant = []

  headers.forEach((header, index) => {
    if (!header || used.has(index)) return

    for (const field of FIELD_RESOLVE_ORDER) {
      if (cols[field] != null) continue
      const aliases = FIELD_ALIASES[field] ?? []
      if (columnMatchesField(header, field, aliases)) {
        cols[field] = index
        used.add(index)
        return
      }
    }

    if (header === 'lado') genericLado.push(index)
    if (header === 'cant') genericCant.push(index)
    if (columnMatchesLoose(header, ['perflado', 'perforacionlado'])) perfLado.push(index)
    if (columnMatchesLoose(header, ['ranuralado', 'ranlado'])) ranuraLado.push(index)
  })

  if (cols.perforacionCantidad == null && genericCant.length) {
    cols.perforacionCantidad = genericCant[0]
  }
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

const PLANILLA_PERF_RANURA_KEYS = [
  'perforacionCantidad',
  'perforacionLado1',
  'ranuraLado',
  'ranuraDist',
  'ranuraProf',
  'ranuraEs',
]

/**
 * Plantilla LISTADO DE PIEZAS: tras DESCRIPCION vienen CANT, LADO (perf), LADO (ran), DIST, PROF, ES.
 */
function applyPlanillaPerfRanuraColumnIndices(cols, headers) {
  const layout = mapColumnsFromTemplateLayout()
  const descIdx =
    cols.observacion ??
    headers.findIndex((h) => columnMatchesField(h, 'observacion', FIELD_ALIASES.observacion))

  if (descIdx >= 0) {
    const start = descIdx + 1
    const slice = headers.slice(start, start + PLANILLA_PERF_RANURA_KEYS.length)
    const looksLikePerfSection =
      slice.length >= 3 &&
      (slice[0] === 'cant' ||
        slice.includes('dist') ||
        slice.includes('prof') ||
        slice.filter((h) => h === 'lado').length >= 1)
    if (looksLikePerfSection) {
      PLANILLA_PERF_RANURA_KEYS.forEach((key, offset) => {
        cols[key] = start + offset
      })
      return cols
    }
  }

  for (const key of PLANILLA_PERF_RANURA_KEYS) {
    if (cols[key] == null) cols[key] = layout[key]
  }
  return cols
}

function hasRequiredMeasureColumns(cols) {
  return cols.cantidad != null && cols.largoVeta != null && cols.ancho != null
}

/** Preferir mapeo por etiquetas; si falla, índices fijos de la plantilla. */
function resolvePlanillaColumns(labelRow, { planilla = false } = {}) {
  const headers = (labelRow ?? []).map(normalizeHeader)
  let byHeader = mapColumnsFromHeaderRow(labelRow)
  if (planilla || isPlanillaLabelRow(labelRow)) {
    byHeader = applyPlanillaPerfRanuraColumnIndices(byHeader, headers)
  }
  if (hasRequiredMeasureColumns(byHeader)) {
    return byHeader
  }
  const byLayout = mapColumnsFromTemplateLayout()
  return hasRequiredMeasureColumns(byLayout) ? byLayout : byHeader
}

/** Plantilla LISTADO DE PIEZAS (con o sin fila técnica [P_LENGTH] en encabezados). */
function detectPlanillaTemplate(matrix) {
  for (let i = 0; i < Math.min(12, matrix.length); i += 1) {
    if (!isPlanillaLabelRow(matrix[i])) continue
    const cols = resolvePlanillaColumns(matrix[i], { planilla: true })
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
    for (let j = i + 1; j < Math.min(i + 6, matrix.length); j += 1) {
      if (!isPlanillaLabelRow(matrix[j])) continue
      const cols = resolvePlanillaColumns(matrix[j], { planilla: true })
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
      headerRowIndex: i + 3,
      dataStart: i + 4,
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
    const planilla = isPlanillaLabelRow(matrix[i])
    const cols = resolvePlanillaColumns(matrix[i], { planilla })
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
  const observacion = parseTextCell(cell(line, cols.observacion))
  const tablero = parseTextCell(cell(line, cols.tablero))
  const perforacionCantidad = parseCantidad(cell(line, cols.perforacionCantidad))
  const perforacionLado1 = parseTextCell(cell(line, cols.perforacionLado1))
  const ranuraLado = parseTextCell(cell(line, cols.ranuraLado))
  const ranuraDist = parseTextCell(cell(line, cols.ranuraDist))
  const ranuraProf = parseTextCell(cell(line, cols.ranuraProf))
  const ranuraEs = parseTextCell(cell(line, cols.ranuraEs))

  if (
    !cantidad &&
    !largoVeta &&
    !ancho &&
    !l1 &&
    !l2 &&
    !a1 &&
    !a2 &&
    !observacion &&
    !perforacionCantidad &&
    !perforacionLado1 &&
    !ranuraLado &&
    !ranuraDist &&
    !ranuraProf &&
    !ranuraEs
  ) {
    return null
  }

  return {
    ...newDetalle(),
    ...(tablero ? { tablero } : {}),
    cantidad,
    largoVeta,
    ancho,
    l1,
    l2,
    a1,
    a2,
    observacion,
    perforacionCantidad,
    perforacionLado1,
    ranuraLado,
    ranuraDist,
    ranuraProf,
    ranuraEs,
    ranuraEspecial: false,
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
 * Lee un .xlsx/.xls (medidas + L1–A2 + descripción).
 * @param {File} file
 * @param {{ cantoOptions?: Array<{ name?: string, sku?: string }> }} [opts]
 * @returns {Promise<{ rows: ReturnType<typeof newDetalle>[], cantoErrors: Array, ranuraErrors: Array }>}
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

  const { rows: withCantos, errors: cantoErrors } = applyCantoCatalogToRows(rows, opts.cantoOptions)
  const { rows: withRanuras, errors: ranuraErrors } = applyRanuraImportToRows(withCantos)

  return { rows: withRanuras, cantoErrors, ranuraErrors }
}

/** @deprecated Usar parsePlanillaDetalleExcel */
export const parseSimpleDetalleExcel = parsePlanillaDetalleExcel
