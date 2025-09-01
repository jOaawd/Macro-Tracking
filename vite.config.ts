import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080,
    },
    preview: {
      host: "::",
      port: 8080,
      allowedHosts: [
        "macro-tracking-production.up.railway.app",
        "wjvm8n-8080.csb.app",
      ],
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
