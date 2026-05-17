export const isProduction = import.meta.env.PROD
export const isStaging = import.meta.env.MODE === 'staging'

function envFlag(name, defaultValue) {
  const raw = import.meta.env[name]
  if (raw === undefined || raw === '') return defaultValue
  return raw === 'true' || raw === '1'
}

export const registrationEnabled = envFlag('VITE_AUTH_REGISTRATION_ENABLED', !isProduction)

/** Solo desarrollo: rellenar formulario login con credenciales demo. */
export const prefillDemoLogin = envFlag('VITE_PREFILL_DEMO_LOGIN', !isProduction && !isStaging)

export function assertSecureDeployment() {
  if (!isProduction && !isStaging) return

  for (const base of [
    import.meta.env.VITE_CLIENT_API_BASE_URL,
    import.meta.env.VITE_ORDER_API_BASE_URL,
  ]) {
    if (typeof base === 'string' && base.startsWith('http://')) {
      console.error(
        `[seguridad] API en HTTP (${base}). Use HTTPS o rutas relativas con nginx.`,
      )
    }
  }
}
