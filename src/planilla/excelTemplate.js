import * as XLSX from 'xlsx'
import {
  PLANILLA_EXCEL_GROUP_ROW,
  PLANILLA_EXCEL_LABEL_ROW,
  PLANILLA_EXCEL_TECH_ROW,
  PLANILLA_EXCEL_TITLE,
  PLANILLA_TEMPLATE_EXAMPLE_ROW,
} from './planillaExcelLayout'

/** Descarga la plantilla vacía «LISTADO DE PIEZAS» para completar e importar. */
export function downloadPlanillaTemplateExcel(filename = 'plantilla_listado_piezas.xlsx') {
  const titleRow = [PLANILLA_EXCEL_TITLE]
  const sheetData = [
    titleRow,
    PLANILLA_EXCEL_GROUP_ROW,
    PLANILLA_EXCEL_TECH_ROW,
    PLANILLA_EXCEL_LABEL_ROW,
    PLANILLA_TEMPLATE_EXAMPLE_ROW,
  ]
  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  ws['!cols'] = [
    { wch: 4 },
    { wch: 28 },
    { wch: 2 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 12 },
    { wch: 22 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 6 },
  ]

  if (!ws['!merges']) ws['!merges'] = []
  ws['!merges'].push(
    { s: { r: 0, c: 0 }, e: { r: 0, c: 16 } },
    { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } },
    { s: { r: 1, c: 3 }, e: { r: 1, c: 5 } },
    { s: { r: 1, c: 6 }, e: { r: 1, c: 9 } },
    { s: { r: 1, c: 10 }, e: { r: 1, c: 12 } },
    { s: { r: 1, c: 13 }, e: { r: 1, c: 16 } },
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Planilla')
  const name = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  XLSX.writeFile(wb, name)
}
