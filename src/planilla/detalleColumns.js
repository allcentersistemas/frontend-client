/** Columnas alineadas con exportación Excel (formato optimizador). */
export const EXCEL_EXPORT_COLUMNS = [
  { key: 'pCodeMat', technical: '[P_CODE_MAT]', label: 'Material' },
  { key: 'pParams', technical: '[P_PARAMS]', label: 'Parámetros' },
  { key: 'pMinq', technical: '[P_MINQ]', label: 'Cant. Mín.' },
  { key: 'pLength', technical: '[P_LENGTH]', label: 'Longitud' },
  { key: 'pWidth', technical: '[P_WIDTH]', label: 'Ancho' },
  { key: 'pGrain', technical: '[P_GRAIN]', label: 'Veta' },
  { key: 'pEdgeMaSup', technical: '[P_EDGE_MAT_UP]', label: 'Mat. Bord. Sup.' },
  { key: 'pEdgeMaInf', technical: '[P_EDGE_MAT_LO]', label: 'Mat. Bord. Inf.' },
  { key: 'pEdgeMaIzq', technical: '[P_EDGE_MAT_SX]', label: 'Mat. Bord. Izq.' },
  { key: 'pEdgeMaDer', technical: '[P_EDGE_MAT_DX]', label: 'Mat. Bord. Dch.' },
  { key: 'pIdesc', technical: '[P_IDESC]', label: 'I Descripción' },
  { key: 'pIidesc', technical: '[P_IIDESC]', label: 'II Descripción' },
]

/** Columnas editables en la tabla de detalle (modal). */
export const DETALLE_TABLE_COLUMNS = [
  { key: 'tablero', label: 'Tablero', wide: true },
  { key: 'cantidad', label: 'Cant.', type: 'number' },
  { key: 'largoVeta', label: 'Largo', type: 'number' },
  { key: 'ancho', label: 'Ancho', type: 'number' },
  { key: 'vetaLongitud', label: 'Veta', type: 'veta' },
  { key: 'l1', label: 'L1', type: 'canto' },
  { key: 'l2', label: 'L2', type: 'canto' },
  { key: 'a1', label: 'A1', type: 'canto' },
  { key: 'a2', label: 'A2', type: 'canto' },
  { key: 'observacion', label: 'Descripción', wide: true },
  { key: 'perforacionCantidad', label: 'Perf. cant.', type: 'number' },
  { key: 'perforacionLado1', label: 'Perf. lado', type: 'lado' },
  { key: 'ranuraDist', label: 'Ran. dist.', type: 'ranuraDist', group: 'ranura' },
  { key: 'ranuraProf', label: 'Ran. prof.', type: 'ranuraProf', group: 'ranura' },
  { key: 'ranuraEs', label: 'Ran. esp.', type: 'ranuraEs', group: 'ranura' },
  { key: 'ranuraLado', label: 'Ran. lado', type: 'lado', group: 'ranura' },
]

export const DETALLE_TABLE_GROUPS = [
  { id: 'material', label: 'Material y medidas', span: 5 },
  { id: 'canto', label: 'Canto', span: 4 },
  { id: 'obs', label: 'Descripción', span: 1 },
  { id: 'perf', label: 'Perforación', span: 2 },
  { id: 'ranura', label: 'Ranura', span: 4 },
]

const LADO_OPTIONS = ['NA', 'L1', 'L2', 'A1', 'A2']
const RANURA_DIST = ['NA', '10', '15', '18']
const RANURA_PROF = ['NA', '6', '8', '10']
const RANURA_ES = ['NA', '4', '7']

export { LADO_OPTIONS, RANURA_DIST, RANURA_PROF, RANURA_ES }
