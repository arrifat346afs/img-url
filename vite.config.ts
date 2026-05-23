import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

const config = defineConfig({
  plugins: [
    devtools(),
    nitro(),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart({
      // SPA mode with prerendering to generate a static index.html for Tauri
      spa: {
        prerender: {
          enabled: true,
          // Output to /index.html so Tauri can find the entry point
          outputPath: '/index.html',
          crawlLinks: false,
          retryCount: 0,
        },
      },
    }),
    viteReact(),
  ],
  // Prevent Vite from obscuring rust errors during tauri build
  clearScreen: false,
  server: {
    port: 3000,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
})

export default config
