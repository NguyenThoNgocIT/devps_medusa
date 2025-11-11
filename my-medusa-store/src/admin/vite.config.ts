import { defineConfig } from "vite"

export default defineConfig({
  server: {
    host: "0.0.0.0",
    strictPort: true,
    // Allow Azure ACI hostname and localhost
    allowedHosts: [
      'medusa-backend.southeastasia.azurecontainer.io',
      'localhost',
      '127.0.0.1'
    ],
    hmr: {
      clientPort: 9000,
    },
  },
})
