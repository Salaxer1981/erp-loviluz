import path from "path";
import { fileURLToPath } from "url"; // 1. Importamos esto
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// 2. Definimos __dirname manualmente para que no de error
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
