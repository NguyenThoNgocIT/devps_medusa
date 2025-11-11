import { defineConfig } from "vite"

export default defineConfig({
  server: {
    host: "0.0.0.0",
    strictPort: true,
    hmr: {
      clientPort: 9000,
      host: "medusa-backend.southeastasia.azurecontainer.io",
    },
  },
})
