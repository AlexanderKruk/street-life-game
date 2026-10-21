import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { imageCachePlugin } from './build/imageCache.mjs'

export default defineConfig({
  plugins: [react(), imageCachePlugin()],
  base: '/street-life-game/',
  server: { allowedHosts: ['terminal.local'] },
})
