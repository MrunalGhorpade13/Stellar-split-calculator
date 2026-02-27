import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    // Exclude from pre-bundling — these use preact/twind/DOM at module init
    exclude: ["@creit.tech/stellar-wallets-kit"],
  },
  build: {
    rollupOptions: {
      // Ensure no issues when building for production
      external: [],
    },
  },
});