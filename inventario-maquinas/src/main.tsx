import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { initTheme } from './lib/theme'
import { initApi } from './lib/api'
import './index.css'

initTheme()

console.info(
  '%cNovaTech Inventário\n%cProjeto de portfólio desenvolvido por André André\nhttps://www.linkedin.com/in/andrelsandre · https://github.com/andre-tech2/portfolio',
  'font-weight:bold;font-size:14px',
  'font-weight:normal'
)

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
