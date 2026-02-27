import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],

  define: {
    global: "globalThis",
  },

  resolve: {
    // Force single copy of these packages across the entire dep tree
    dedupe: [
      "@stellar/freighter-api",
      "@stellar/stellar-sdk",
      "@stellar/stellar-base",
      "@albedo-link/intent",
    ],
    alias: {
      // Use project-level ESM versions — NOT the nested bundled .min.js inside stellar-wallets-kit
      "@stellar/freighter-api": resolve("./node_modules/@stellar/freighter-api"),
    },
  },

  optimizeDeps: {
    // Exclude from pre-bundling — uses preact/twind DOM at module init
    exclude: ["@creit.tech/stellar-wallets-kit"],
    include: ["@stellar/freighter-api"],
  },
});