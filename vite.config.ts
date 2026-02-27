import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // 0.0.0.0 - IPv6 "::"는 일부 환경에서 uv_interface_addresses 오류 유발
    port: 8080,
    strictPort: false, // 8080 사용 중이면 다음 포트 시도
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Supabase URL/키는 .env의 VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY 사용
  define: {},
}));
