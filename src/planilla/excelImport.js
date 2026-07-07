import * as XLSX from 'xlsx'
import { EXCEL_EXPORT_COLUMNS } from './detalleColumns'
import { newDetalle, vetaFromApi } from './helpers'
import { normalizeMeasureInput } from './measureInput'
import {
  PLANILLA_EXCEL_TITLE,
  PLANILLA_TEMPLATE_COLUMN_KEYS,
} from './planillaExcelLayout'

const FIELD_ALIASES = {
  tablero: ['materialcoloryespesor', 'material', 'tablero', 'pcodemat', 'codemat'],
  cantidad: ['cantidad', 'cant', 'cantmin', 'pminq', 'qty', 'cantminima'],
  largoVeta: ['largo', 'largoveta', 'longitud', 'plength', 'length'],
  ancho: ['ancho', 'pwidth', 'width'],
  l1: ['l1', 'lsuperior', 'superior', 'pedgematup', 'matsup'],
  l2: ['l2', 'linferior', 'inferior', 'pedgematlo', 'matinf'],
  a1: ['a1', 'aizquierda', 'izquierda', 'pedgematsx', 'matizq'],
  a2: ['a2', 'aderecha', 'derecha', 'pedgematdx', 'matder'],
  observacion: ['descripcion', 'pdesc', 'observacion', 'descripcio', 'piidesc'],
  perforacionCantidad: ['perfcant', 'perforacioncant'],
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
 * Medidas largo/ancho: en plantilla humana se usan tal cual (560 → 560).
 * En export del optimizador vienen ×10 (560 → 5600) y se divide al importar.
 */
function parseBoardMeasure(raw, { fromOptimizer } = {}) {
  if (raw == null || raw === '') return ''
  const n = parseExcelNumber(raw)
  if (!Number.isFinite(n) || n <= 0) return ''
  let val = Math.round(n)
  if (fromOptimizer) val = Math.round(val / 10)
  return String(val)
}

function parseTextCell(raw) {
  if (raw == null) return ''
  return String(raw).trim()
}

function parseLado(raw) {
  const s = parseTextCell(raw).toUpperCase()
  if (!s || s === 'NA' || s === 'N/A') return ''
  return s
}

function parseVeta(raw) {
  if (raw == null || raw === '') return false
  return vetaFromApi(raw) || ['si', 'sí', 'yes', 'true', '1'].includes(normalizeHeader(raw))
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
    if (columnMatches(header, ['perflado', 'perforacionlado'])) perfLado.push(index)
    if (columnMatches(header, ['ranuralado', 'ranlado'])) ranuraLado.push(index)
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
  const byLayout = mapColumnsFromTemplateLayout()
  const byHeader = mapColumnsFromHeaderRow(headerRow)
  return { ...byLayout, ...byHeader }
}

function hasRequiredMeasureColumns(cols) {
  return cols.cantidad != null && cols.largoVeta != null && cols.ancho != null
}

function detectOptimizerHeader(matrix) {
  for (let i = 0; i < Math.min(6, matrix.length); i += 1) {
    const joined = (matrix[i] ?? []).map(normalizeHeader).join('|')
    if (joined.includes('plength') || joined.includes('pwidth') || joined.includes('pminq')) {
      const cols = {}
      EXCEL_EXPORT_COLUMNS.forEach((col) => {
        const idx = (matrix[i] ?? []).findIndex((cellValue) => {
          const h = normalizeHeader(cellValue)
          return h === normalizeHeader(col.technical) || columnMatches(h, FIELD_ALIASES[col.key] ?? [])
        })
        if (idx >= 0) cols[col.key] = idx
      })
      const legacy = mapColumnsFromHeaderRow(matrix[i])
      return {
        format: 'optimizer',
        headerRowIndex: i,
        dataStart: i + 1,
        cols: {
          tablero: cols.pCodeMat ?? legacy.tablero,
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
  }
  return null
}

function detectPlanillaTemplate(matrix) {
  for (let i = 0; i < Math.min(8, matrix.length); i += 1) {
    const title = normalizeHeader(matrix[i]?.[0])
    const rowJoin = (matrix[i] ?? []).map(normalizeHeader).join(' ')
    if (title.includes('listadodepiezas') || rowJoin.includes('listadodepiezas')) {
      return {
        format: 'planilla',
        headerRowIndex: i + 2,
        dataStart: i + 3,
        cols: mapColumnsFromTemplateLayout(),
      }
    }
  }
  for (let i = 0; i < Math.min(8, matrix.length); i += 1) {
    const labelJoin = (matrix[i] ?? []).map(normalizeHeader).join('|')
    if (labelJoin.includes('cantidad') && labelJoin.includes('largo') && labelJoin.includes('ancho')) {
      const cols = mapColumnsFromTemplateKeys(matrix[i])
      if (hasRequiredMeasureColumns(cols)) {
        return { format: 'planilla', headerRowIndex: i, dataStart: i + 1, cols }
      }
    }
  }
  return null
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

function parsePerforacionRanuraFromDesc(text) {
  const out = {}
  const raw = parseTextCell(text)
  if (!raw) return out
  const perf = raw.match(/P\(([^)]*)\)/i)
  if (perf) {
    const parts = perf[1].split('/').map((p) => p.trim())
    if (parts[0]) out.perforacionCantidad = parseCantidad(parts[0])
    if (parts[1]) out.perforacionLado1 = parseLado(parts[1])
    if (parts[2]) out.perforacionLado2 = parseLado(parts[2])
  }
  const ran = raw.match(/R\(([^)]*)\)/i)
  if (ran) {
    const parts = ran[1].split('/').map((p) => p.trim())
    if (parts[0]) out.ranuraDist = parseTextCell(parts[0])
    if (parts[1]) out.ranuraProf = parseTextCell(parts[1])
    if (parts[2]) out.ranuraEs = parseTextCell(parts[2])
    if (parts[3]) out.ranuraLado = parseLado(parts[3])
  }
  return out
}

function buildRowFromLine(line, cols, { fromOptimizer }) {
  const cantidad = parseCantidad(cell(line, cols.cantidad))
  const largoVeta = parseBoardMeasure(cell(line, cols.largoVeta), { fromOptimizer })
  const ancho = parseBoardMeasure(cell(line, cols.ancho), { fromOptimizer })
  const tablero = parseTextCell(cell(line, cols.tablero))
  const l1 = parseTextCell(cell(line, cols.l1))
  const l2 = parseTextCell(cell(line, cols.l2))
  const a1 = parseTextCell(cell(line, cols.a1))
  const a2 = parseTextCell(cell(line, cols.a2))
  const observacion = parseTextCell(cell(line, cols.observacion))
  const perforacionCantidad = parseCantidad(cell(line, cols.perforacionCantidad))
  const perforacionLado1 = parseLado(cell(line, cols.perforacionLado1))
  const ranuraLado = parseLado(cell(line, cols.ranuraLado))
  const ranuraDist = parseTextCell(cell(line, cols.ranuraDist))
  const ranuraProf = parseTextCell(cell(line, cols.ranuraProf))
  const ranuraEs = parseTextCell(cell(line, cols.ranuraEs))
  const vetaLongitud = parseVeta(cell(line, cols.vetaLongitud))

  const perfRan = parsePerforacionRanuraFromDesc(cell(line, cols.perforacionDesc))

  if (!cantidad && !largoVeta && !ancho && !tablero && !observacion) return null

  return {
    ...newDetalle(),
    tablero,
    cantidad,
    largoVeta,
    ancho,
    vetaLongitud,
    l1,
    l2,
    a1,
    a2,
    observacion,
    perforacionCantidad: perforacionCantidad || perfRan.perforacionCantidad || '',
    perforacionLado1: perforacionLado1 || perfRan.perforacionLado1 || '',
    perforacionLado2: perfRan.perforacionLado2 || '',
    ranuraLado: ranuraLado || perfRan.ranuraLado || '',
    ranuraDist: ranuraDist || perfRan.ranuraDist || '',
    ranuraProf: ranuraProf || perfRan.ranuraProf || '',
    ranuraEs: ranuraEs || perfRan.ranuraEs || '',
  }
}

function resolveLayout(matrix) {
  const optimizer = detectOptimizerHeader(matrix)
  if (optimizer) return optimizer
  const planilla = detectPlanillaTemplate(matrix)
  if (planilla) return planilla
  const generic = detectGenericHeader(matrix)
  if (generic) return generic
  throw new Error(
    `El Excel debe tener columnas «Cantidad», «Largo» y «Ancho» (plantilla «${PLANILLA_EXCEL_TITLE}» o exportación optimizador).`,
  )
}

/**
 * Lee un .xlsx/.xls con el formato plantilla o exportación optimizador.
 * @param {File} file
 * @returns {Promise<{ rows: ReturnType<typeof newDetalle>[], sharedTablero?: string }>}
 */
export async function parsePlanillaDetalleExcel(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error('El archivo Excel no tiene hojas.')
  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
  if (!matrix.length) throw new Error('El archivo Excel está vacío.')

  const layout = resolveLayout(matrix)
  const fromOptimizer = layout.format === 'optimizer'
  const rows = []

  for (let i = layout.dataStart; i < matrix.length; i += 1) {
    const line = matrix[i]
    if (rowIsEmpty(line)) continue
    const row = buildRowFromLine(line, layout.cols, { fromOptimizer })
    if (row) rows.push(row)
  }

  if (!rows.length) {
    throw new Error('No se encontraron filas con datos en el Excel.')
  }

  const sharedTablero = rows.find((r) => r.tablero)?.tablero ?? ''
  return { rows, sharedTablero }
}

/** @deprecated Usar parsePlanillaDetalleExcel */
export const parseSimpleDetalleExcel = parsePlanillaDetalleExcel
