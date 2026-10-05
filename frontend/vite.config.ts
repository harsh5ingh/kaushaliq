import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Production cookies and OAuth callbacks must stay on the public frontend origin.
  define: mode === "production" ? { "import.meta.env.VITE_API_BASE_URL": JSON.stringify("/api") } : {},
  server: { proxy: { "/api": { target: process.env.API_PROXY_TARGET || "http://127.0.0.1:8000", changeOrigin: true } } },
}));
