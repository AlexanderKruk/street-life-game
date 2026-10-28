import { language } from './i18n'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'
import './modal.css'
import { warmImageUrls } from './responsiveImages'

document.documentElement.lang = language

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Warm the image cache after the initial page has loaded, without delaying the game.
// Unsupported browsers or unavailable storage keep normal network image loading.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const registerImageCache = () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}image-cache-sw.js`, {
      scope: import.meta.env.BASE_URL,
      updateViaCache: 'none',
    }).then(() => navigator.serviceWorker.ready).then(() => {
      const warmImages = () => navigator.serviceWorker.controller?.postMessage({
        type: 'WARM_IMAGES', urls: warmImageUrls(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1),
      })
      warmImages()
      navigator.serviceWorker.addEventListener('controllerchange', warmImages)
      let resizeTimer: ReturnType<typeof setTimeout>
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(warmImages, 300)
      })
    }).catch(() => { /* Image caching is optional; gameplay must not depend on it. */ })
  }
  if (document.readyState === 'complete') registerImageCache()
  else window.addEventListener('load', registerImageCache, { once: true })
}
