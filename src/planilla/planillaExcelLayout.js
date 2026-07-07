/**
 * Layout del Excel «LISTADO DE PIEZAS» (plantilla cliente).
 * Fila 1: título · fila 2: grupos · fila 3: etiquetas de columna.
 */
export const PLANILLA_EXCEL_TITLE = 'LISTADO DE PIEZAS'

export const PLANILLA_EXCEL_GROUP_ROW = [
  'N°',
  'TABLERO',
  '',
  'PIEZAS A CORTAR',
  '',
  '',
  'CANTO',
  '',
  '',
  '',
  'PERFORACIÓN',
  '',
  '',
  'RANURAS',
  '',
  '',
  '',
]

export const PLANILLA_EXCEL_LABEL_ROW = [
  '',
  'MATERIAL COLOR Y ESPESOR',
  '',
  'CANTIDAD',
  'LARGO',
  'ANCHO',
  'L1 (Superior)',
  'L2 (Inferior)',
  'A1 (Izquierda)',
  'A2 (Derecha)',
  'DESCRIPCIÓN',
  'CANT',
  'LADO',
  'LADO',
  'DIST',
  'PROF',
  'ES',
]

/** Orden de campos en la plantilla (índice de columna). */
export const PLANILLA_TEMPLATE_COLUMN_KEYS = [
  'num',
  'tablero',
  '_skip',
  'cantidad',
  'largoVeta',
  'ancho',
  'l1',
  'l2',
  'a1',
  'a2',
  'observacion',
  'perforacionCantidad',
  'perforacionLado1',
  'ranuraLado',
  'ranuraDist',
  'ranuraProf',
  'ranuraEs',
]

export const PLANILLA_TEMPLATE_EXAMPLE_ROW = [
  '1',
  '',
  '',
  '1',
  '560',
  '120',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
]
