import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { app } from './src/locales/en/app'
import { imageCachePlugin } from './build/imageCache.mjs'

export default defineConfig({
  plugins: [react(), imageCachePlugin(), {
    name: 'localised-document-title',
    transformIndexHtml(html) {
      const title = app['app.documentTitle'].replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      return html.replace('__STREET_LIFE_TITLE__', () => title)
    },
  }],
  base: '/street-life-game/',
  server: { allowedHosts: ['terminal.local'] },
})
