import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({
    emitCss: false
  })],
  build: {
    outDir: "../scripts/",
    lib: {
      // 👇 Entry point for your code
      entry: 'src/main.ts',
      fileName: 'article-editor',   // Output file name (without extension)
      name: "article-editor",
      formats: ["es"]
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // Ensures only ONE JS file
      },
    },
  },
})
