/**
 * Columnas alineadas con el Excel / imágenes de referencia y con {@link MaterialRowRequest} en el backend.
 * `key` = clave del formulario en camelCase (materialPayload).
 */
export const MATERIAL_TABLE_COLUMNS = [
  { key: 'pCodeMat', technical: '[P_CODE_MAT]', label: 'Material' },
  { key: 'pMinq', technical: '[P_MINQ]', label: 'Cant. Min.' },
  { key: 'pLength', technical: '[P_LENGTH]', label: 'Longitud' },
  { key: 'pWidth', technical: '[P_WIDTH]', label: 'Ancho' },
  { key: 'pGrain', technical: '[P_GRAIN]', label: 'Veta' },
  { key: 'pEdgeMaSup', technical: '[P_EDGE_MAT_UP]', label: 'Mat. Bord. Sup.' },
  { key: 'pEdgeMaInf', technical: '[P_EDGE_MAT_LO]', label: 'Mat. Bord. Inf.' },
  { key: 'pEdgeMaIzq', technical: '[P_EDGE_MAT_SX]', label: 'Mat. Bord. Izq.' },
  { key: 'pEdgeMaDer', technical: '[P_EDGE_MAT_DX]', label: 'Mat. Bord. Dch.' },
  { key: 'pIdesc', technical: '[P_IDESC]', label: 'I Descripción' },
  { key: 'pIidesc', technical: '[P_IIDESC]', label: 'II Descripción' },
  { key: 'pGroovei', technical: '[P_GROOVEINFO]', label: 'Info. Ranura' },
  { key: 'pFurnCo', technical: '[P_FURN_CODE]', label: 'Código Mueble' },
  { key: 'pFurnInf', technical: '[P_FURN_INFO]', label: 'Inf. Mueble' },
  { key: 'pLabelIa', technical: '[P_LABEL_LAYOUT]', label: 'Layout etiqueta' },
  { key: 'pDrwinfo', technical: '[P_DRWINFO_2]', label: 'Info 2' },
]
