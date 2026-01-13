import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Enable better minification
    minify: 'esbuild',
    // Target modern browsers for smaller output
    target: 'es2020',
    // Optimize CSS
    cssMinify: true,
    // Source maps only in development
    sourcemap: false,
  },
})
