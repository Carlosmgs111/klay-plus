import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

const isVercel = !!process.env.VERCEL;

function getAdapter() {
  if (isVercel) {
    return import("@astrojs/vercel").then((m) => m.default());
  }
  return import("@astrojs/node").then((m) => m.default({ mode: "standalone" }));
}

export default defineConfig({
  output: "server",
  adapter: await getAdapter(),
  integrations: [react(), tailwind({ applyBaseStyles: false })],
  vite: {
    define: {
      "import.meta.env.PUBLIC_IS_VERCEL": JSON.stringify(isVercel),
    },
    server: {
      watch: {
        ignored: ["**/data/**"],
      },
    },
    ssr: {
      noExternal: ["@klay/core"],
      external: ["nedb-promises", "pdf-extraction", "@ai-sdk/cohere", "@huggingface/transformers", "@huggingface/inference"],
    },
    optimizeDeps: {
      include: ["pdfjs-dist"],
      exclude: ["nedb-promises", "pdf-extraction", "@ai-sdk/cohere", "@huggingface/transformers", "@huggingface/inference"],
    },
    build: {
      rollupOptions: {
        external: ["nedb-promises", "pdf-extraction", "@ai-sdk/cohere", "@huggingface/transformers", "@huggingface/inference"],
      },
    },
  },
});
