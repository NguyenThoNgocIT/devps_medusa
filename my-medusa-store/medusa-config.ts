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
        host: true, // Listen on all network interfaces
        port: 9000,
        strictPort: false,
        hmr: {
          protocol: 'ws',
          host: 'localhost',
          clientPort: 9000
        }
      },
      // Completely disable host check by overriding middleware
      plugins: [
        {
          name: 'disable-host-check',
          configureServer(server) {
            server.middlewares.use((req, res, next) => {
              // Allow all hosts
              next();
            });
          }
        }
      ]
    })
  }
})
