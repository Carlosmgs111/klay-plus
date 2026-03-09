import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react(), tailwind({ applyBaseStyles: false })],
  vite: {
    ssr: {
      // Bundle @klay/core (source .ts files need transpilation)
      noExternal: ["@klay/core"],
      // Server-only / optional providers — keep external (resolved at runtime or tree-shaken)
      external: ["nedb-promises", "@ai-sdk/cohere", "@ai-sdk/huggingface"],
    },
    optimizeDeps: {
      include: ["pdfjs-dist"],
    },
    build: {
      rollupOptions: {
        external: ["nedb-promises", "@ai-sdk/cohere", "@ai-sdk/huggingface"],
      },
    },
  },
});
