import { optimizationApiPrefix } from '../config/env'
import { fetchJson } from './http'

const baseUrl = optimizationApiPrefix

function authHeaders(accessToken) {
  return { Authorization: `Bearer ${accessToken}` }
}

/**
 * @param {string} accessToken
 * @param {Record<string, unknown>} body
 */
export async function createMaterialRow(accessToken, body) {
  return fetchJson(`${baseUrl}/optimization/material-rows`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

/**
 * @param {string} accessToken
 * @param {Record<string, unknown>[]} rows
 */
export async function createMaterialRowsBulk(accessToken, rows) {
  return fetchJson(`${baseUrl}/optimization/material-rows/bulk`, {
    method: 'POST',
    headers: { ...authHeaders(accessToken), 'Content-Type': 'application/json' },
    body: JSON.stringify(rows),
  })
}

/**
 * @param {string} accessToken
 * @param {File} file
 * @param {{ headerRow?: number, firstDataRow?: number | null }} opts
 */
export async function importMaterialExcel(accessToken, file, opts = {}) {
  const fd = new FormData()
  fd.append('file', file)
  const q = new URLSearchParams()
  q.set('headerRow', String(opts.headerRow ?? 0))
  if (opts.firstDataRow != null && opts.firstDataRow !== '') {
    q.set('firstDataRow', String(opts.firstDataRow))
  }
  return fetchJson(
    `${baseUrl}/optimization/material-rows/import?${q.toString()}`,
    {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: fd,
    },
  )
}

/**
 * @param {string} accessToken
 * @param {{ page?: number, size?: number, search?: string }} page
 */
export async function listMaterialRows(accessToken, page = {}) {
  const q = new URLSearchParams({
    page: String(page.page ?? 0),
    size: String(page.size ?? 20),
  })
  if (page.search != null && String(page.search).trim() !== '') {
    q.set('search', String(page.search).trim())
  }
  return fetchJson(`${baseUrl}/optimization/material-rows?${q}`, {
    headers: authHeaders(accessToken),
  })
}

/**
 * @param {string} accessToken
 * @param {string|number} id
 */
export async function getMaterialRow(accessToken, id) {
  return fetchJson(`${baseUrl}/optimization/material-rows/${id}`, {
    headers: authHeaders(accessToken),
  })
}
