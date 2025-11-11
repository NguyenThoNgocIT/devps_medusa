import { defineConfig } from "vite"

export default defineConfig({
  server: {
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: [
      "medusa-backend.southeastasia.azurecontainer.io",
      "localhost",
      "127.0.0.1",
      ".azurecontainer.io",
    ],
    hmr: {
      clientPort: 9000,
    },
  },
})
