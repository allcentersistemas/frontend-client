/** Buscar y reemplazar en una columna del detalle: solo filas con match exacto (trim, sin distinguir mayúsculas). */
export function replaceColumnValue(rows, key, searchValue, replaceValue) {
  const needle = String(searchValue ?? '').trim().toUpperCase()
  if (!needle) return rows
  return rows.map((row) =>
    String(row[key] ?? '').trim().toUpperCase() === needle ? { ...row, [key]: replaceValue } : row,
  )
}
