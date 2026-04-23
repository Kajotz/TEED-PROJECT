import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "icons/icon-192.png",
        "icons/icon-512.png",
      ],
      manifest: {
        name: "TEED Hub",
        short_name: "TEEDHub",
        description: "Technical Environment for E-Commerce Development",
        theme_color: "#1F75FE",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
  host: true,
  port: 5173,

  allowedHosts: [
    "legginged-unsordid-jonna.ngrok-free.dev"
  ],

  proxy: {
    "/api": {
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
      secure: false,
    },
    "/media": {
      target: "http://127.0.0.1:8000",
      changeOrigin: true,
      secure: false,
    },
  },
},
});