import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const BASE_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
}

const CSP_PRODUCTION =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'"

const CSP_DEVELOPMENT =
  "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* wss://localhost:* wss://127.0.0.1:*; frame-ancestors 'none'; base-uri 'self'"

function securityHeadersPlugin(csp) {
  const headers = { ...BASE_SECURITY_HEADERS, 'Content-Security-Policy': csp }
  const apply = (server) => {
    server.middlewares.use((_req, res, next) => {
      for (const [k, v] of Object.entries(headers)) {
        res.setHeader(k, v)
      }
      next()
    })
  }
  return {
    name: 'allcenter-client-security-headers',
    configureServer: apply,
    configurePreviewServer: apply,
  }
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDevServer = command === 'serve'
  const isProdBuild = mode === 'production' || mode === 'staging'
  const baseFromEnv = (env.VITE_APP_BASE ?? '').trim()
  const base = baseFromEnv
    ? baseFromEnv.endsWith('/')
      ? baseFromEnv
      : `${baseFromEnv}/`
    : '/'
  const systemTarget = env.VITE_PROXY_SYSTEM_TARGET || 'http://localhost:8080'
  const optimizationTarget =
    env.VITE_PROXY_OPTIMIZATION_TARGET || 'http://localhost:8082'

  return {
    base,
    plugins: [
      react(),
      securityHeadersPlugin(isDevServer ? CSP_DEVELOPMENT : CSP_PRODUCTION),
    ],
    server: {
      port: Number(env.VITE_DEV_PORT) || 5174,
      proxy: {
        '/client-api/auth': {
          target: systemTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/client-api\/auth/, '/api/client/auth'),
        },
        '/client-api': {
          target: systemTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/client-api/, '/api'),
        },
        '/order-api': {
          target: systemTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/order-api/, '/api'),
        },
        '/opt-api': {
          target: optimizationTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/opt-api/, '/api'),
        },
        '/api/client/auth': {
          target: systemTarget,
          changeOrigin: true,
        },
        '/api/clients': {
          target: systemTarget,
          changeOrigin: true,
        },
        '/api': {
          target: optimizationTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: Number(env.VITE_PREVIEW_PORT) || 4174,
    },
  }
})
