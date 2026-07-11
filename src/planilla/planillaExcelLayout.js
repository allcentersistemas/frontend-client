/**
 * Layout del Excel «LISTADO DE PIEZAS» (plantilla cliente).
 * Fila 1: título · fila 2: grupos · fila 3: tags técnicos · fila 4: etiquetas.
 * Coincide con la plantilla operativa (sin columna TABLERO).
 */
export const PLANILLA_EXCEL_TITLE = 'LISTADO DE PIEZAS'

export const PLANILLA_EXCEL_GROUP_ROW = [
  'N°',
  'PIEZAS A CORTAR',
  '',
  '',
  'CANTO',
  '',
  '',
  '',
  'DESCRIPCION',
  'PERFORACION',
  '',
  'RANURAS',
  '',
  '',
  '',
]

/** Fila técnica (referencia optimizador); los datos se ingresan en filas siguientes. */
export const PLANILLA_EXCEL_TECH_ROW = [
  '',
  '[P_MINQ]',
  '[P_LENGTH]',
  '[P_WIDTH]',
  '[P_EDGE_MAT_UP]',
  '[P_EGDE_MAT_LO]',
  '[P_EDGE_MAT_SX]',
  '[P_EDGE_MAT_DX]',
  '[P_IDESC]',
  '',
  '',
  '',
  '',
  '',
  '',
]

export const PLANILLA_EXCEL_LABEL_ROW = [
  'N°',
  'CANTIDAD',
  'LARGO',
  'ANCHO',
  'L1 (Superior)',
  'L2 (Inferior)',
  'A1 (Izquierda)',
  'A2 (Derecha)',
  'DESCRIPCION',
  'CANT',
  'LADO',
  'LADO',
  'DIST',
  'PROF',
  'ES',
]

/** Orden de campos en la plantilla (índice de columna) — layout sin TABLERO. */
export const PLANILLA_TEMPLATE_COLUMN_KEYS = [
  'num',
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
