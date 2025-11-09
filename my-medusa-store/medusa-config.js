const { loadEnv, defineConfig } = require("@medusajs/framework/utils")

loadEnv(process.env.NODE_ENV || "development", process.cwd())

function requiredEnv(key) {
  const v = process.env[key]
  if (!v) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return v
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: requiredEnv("DATABASE_URL"),
    http: {
      storeCors: process.env.STORE_CORS || "",
      adminCors: process.env.ADMIN_CORS || "",
      authCors: process.env.AUTH_CORS || "",
      jwtSecret: requiredEnv("JWT_SECRET"),
      cookieSecret: requiredEnv("COOKIE_SECRET"),
    },
  },
})
