import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  admin: {
    backendUrl: process.env.BACKEND_URL || "http://localhost:9000",
    disable: false,
    vite: () => ({
      server: {
        host: '0.0.0.0',
        port: 9000,
        strictPort: false,
        hmr: false,
        // THE KEY FIX: Set allowedHosts to allow all hosts
        allowedHosts: [
          '.azurecontainer.io',
          'medusa-backend.southeastasia.azurecontainer.io',
          'localhost',
          '.localhost'
        ]
      }
    })
  }
})
