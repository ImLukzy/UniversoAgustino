import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
  build: {
    chunkSizeWarningLimit: 500,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "vendor-react", test: /node_modules\/(?:react|react-dom|react-router-dom|react-router)\// },
            { name: "vendor-query", test: /node_modules\/@tanstack\/react-query\// },
            { name: "vendor-pdf", test: /node_modules\/pdfjs-dist\//, includeDependenciesRecursively: false },
          ],
        },
      },
    },
  },
});
