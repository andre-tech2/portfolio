import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initTheme } from './lib/theme'
import { initApi } from './lib/api'
import './index.css'

initTheme()

const rootEl = document.getElementById('root')!

initApi()
  .then(() => {
    ReactDOM.createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
  .catch((err) => {
    rootEl.innerHTML = `<pre style="color:#f87171;padding:24px;font-family:monospace;white-space:pre-wrap;">Falha ao iniciar o app: ${
      err instanceof Error ? err.message : String(err)
    }</pre>`
  })
