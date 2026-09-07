import { useEffect, useState, useCallback } from 'react'
import Sidebar, { Page } from './components/Sidebar'
import LoginScreen from './components/LoginScreen'
import ChangePasswordModal from './components/ChangePasswordModal'
import Dashboard from './pages/Dashboard'
import Equipamentos from './pages/Equipamentos'
import Movimentacoes from './pages/Movimentacoes'
import Configuracoes from './pages/Configuracoes'
import Usuarios from './pages/Usuarios'

export default function App() {
  const [authChecked, setAuthChecked] = useState(false)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [trocarSenhaOpen, setTrocarSenhaOpen] = useState(false)
  const [page, setPage] = useState<Page>('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [alertCount, setAlertCount] = useState(0)
  const [totalEquipamentos, setTotalEquipamentos] = useState(0)

  useEffect(() => {
    window.api.auth.currentUser().then((u) => {
      setUsuario(u)
      setAuthChecked(true)
    })
  }, [])

  const refreshAlerts = useCallback(async () => {
    if (!usuario) return
    const stats = await window.api.dashboard.stats()
    setAlertCount(stats.alertas.length)
    setTotalEquipamentos(stats.totalEquipamentos)
  }, [usuario])

  useEffect(() => {
    refreshAlerts()
  }, [refreshAlerts, refreshKey])

  function bump() {
    setRefreshKey((k) => k + 1)
  }

  async function handleLogout() {
    await window.api.auth.logout()
    setUsuario(null)
    setPage('dashboard')
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-bg" />
  }

  if (!usuario) {
    return <LoginScreen onLogin={setUsuario} />
  }

  const podeVerConfiguracoes = usuario.papel === 'gerenciar'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        current={page}
        onNavigate={setPage}
        alertCount={alertCount}
        totalEquipamentos={totalEquipamentos}
        usuario={usuario}
        onLogout={handleLogout}
        onTrocarSenha={() => setTrocarSenhaOpen(true)}
      />
      <main className="flex-1 overflow-y-auto bg-bg">
        {page === 'dashboard' && <Dashboard refreshKey={refreshKey} />}
        {page === 'equipamentos' && <Equipamentos papel={usuario.papel} onChanged={bump} />}
        {page === 'movimentacoes' && <Movimentacoes papel={usuario.papel} onChanged={bump} />}
        {page === 'configuracoes' && podeVerConfiguracoes && <Configuracoes onChanged={bump} />}
        {page === 'usuarios' && podeVerConfiguracoes && <Usuarios usuarioAtual={usuario} />}
      </main>

      {trocarSenhaOpen && <ChangePasswordModal onClose={() => setTrocarSenhaOpen(false)} />}
    </div>
  )
}
