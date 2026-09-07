import { useEffect, useState } from 'react'
import Sidebar, { Page } from './components/Sidebar'
import LoginScreen from './components/LoginScreen'
import ChangePasswordModal from './components/ChangePasswordModal'
import MaquinasNovas from './pages/MaquinasNovas'
import MaquinasAntigas from './pages/MaquinasAntigas'
import Configuracoes from './pages/Configuracoes'
import Usuarios from './pages/Usuarios'

function Backdrop() {
  return (
    <div className="app-backdrop">
      <span className="blob-1" />
      <span className="blob-2" />
      <span className="blob-3" />
    </div>
  )
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [trocarSenhaOpen, setTrocarSenhaOpen] = useState(false)
  const [page, setPage] = useState<Page>('novas')
  const [refreshKey, setRefreshKey] = useState(0)
  const [totalNovas, setTotalNovas] = useState(0)
  const [totalAntigas, setTotalAntigas] = useState(0)

  useEffect(() => {
    window.api.auth.currentUser().then((u) => {
      setUsuario(u)
      setAuthChecked(true)
    })
  }, [])

  async function handleLogout() {
    await window.api.auth.logout()
    setUsuario(null)
    setPage('novas')
  }

  if (!authChecked) {
    return <Backdrop />
  }

  if (!usuario) {
    return (
      <>
        <Backdrop />
        <LoginScreen onLogin={setUsuario} />
      </>
    )
  }

  const podeGerenciar = usuario.papel === 'gerenciar'

  return (
    <div className="flex h-screen overflow-hidden">
      <Backdrop />
      <Sidebar
        current={page}
        onNavigate={setPage}
        totalNovas={totalNovas}
        totalAntigas={totalAntigas}
        usuario={usuario}
        onLogout={handleLogout}
        onTrocarSenha={() => setTrocarSenhaOpen(true)}
      />
      <main className="relative z-10 flex-1 overflow-y-auto">
        {page === 'novas' && (
          <MaquinasNovas refreshKey={refreshKey} onCountChange={setTotalNovas} papel={usuario.papel} usuarioNome={usuario.nome} />
        )}
        {page === 'antigas' && (
          <MaquinasAntigas refreshKey={refreshKey} onCountChange={setTotalAntigas} papel={usuario.papel} usuarioNome={usuario.nome} />
        )}
        {page === 'configuracoes' && podeGerenciar && <Configuracoes onChanged={() => setRefreshKey((k) => k + 1)} />}
        {page === 'usuarios' && podeGerenciar && <Usuarios usuarioAtual={usuario} />}
      </main>

      {trocarSenhaOpen && <ChangePasswordModal onClose={() => setTrocarSenhaOpen(false)} />}
    </div>
  )
}
