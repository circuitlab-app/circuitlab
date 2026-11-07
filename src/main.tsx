import './index.css'
import { AnimateUIProvider } from '@animate-ui/react/provider'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AnimateUIProvider tempo={1} checkAnimation="draw">
      <App />
    </AnimateUIProvider>
  </StrictMode>,
)

// works offline and installs like an app (the built site only: in development it would cache stale files)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // without it the app still works, just not offline
    })
  })
}
