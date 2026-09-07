import { useState } from 'react'
import Logo from './Logo'
import { IconGrid, IconBox, IconSwap, IconGear } from './icons'
import { getTheme, setTheme } from '../lib/theme'

function IconSun({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function IconMoon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
    </svg>
  )
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.2a3 3 0 010 5.6M21 20c0-2.8-1.9-5.1-4.5-5.8" />
    </svg>
  )
}

function IconKey({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="8" cy="15" r="4" />
      <path d="M10.8 12.2L20 3M16.5 6.5L19 9M13 10l2 2" />
    </svg>
  )
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 00-2 2v12a2 2 0 002 2h6" />
    </svg>
  )
}

function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M6.94 5a2 2 0 11-4-.01A2 2 0 016.94 5zM3.25 8.75h3.5V21h-3.5V8.75zM9.5 8.75h3.35v1.68h.05c.47-.88 1.6-1.8 3.3-1.8 3.53 0 4.18 2.32 4.18 5.35V21h-3.5v-6.35c0-1.51-.03-3.46-2.1-3.46-2.1 0-2.42 1.64-2.42 3.35V21H9.5V8.75z" />
    </svg>
  )
}

function IconGithub({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.58 2 12.2c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.88-2.78.51-3.5-.7-3.72-1.34-.13-.33-.68-1.34-1.16-1.62-.4-.22-.97-.75-.01-.76.9-.01 1.54.85 1.76 1.2 1.03 1.75 2.67 1.26 3.32.96.1-.75.4-1.26.72-1.55-2.5-.29-5.13-1.27-5.13-5.65 0-1.25.44-2.27 1.16-3.07-.12-.29-.5-1.46.11-3.04 0 0 .95-.31 3.12 1.18a10.6 10.6 0 015.68 0c2.16-1.49 3.11-1.18 3.11-1.18.62 1.58.23 2.75.11 3.04.72.8 1.16 1.81 1.16 3.07 0 4.39-2.64 5.36-5.15 5.64.41.36.77 1.07.77 2.16 0 1.56-.01 2.82-.01 3.2 0 .28.18.6.69.49A10.2 10.2 0 0022 12.2C22 6.58 17.52 2 12 2z" />
    </svg>
  )
}

export type Page = 'dashboard' | 'equipamentos' | 'movimentacoes' | 'configuracoes' | 'usuarios'

const PAPEL_LABEL: Record<Papel, string> = { visualizar: 'Visualizar', editar: 'Editar', gerenciar: 'Gerenciar tudo' }

const baseItems: { page: Page; label: string; icon: (p: { className?: string }) => JSX.Element }[] = [
  { page: 'dashboard', label: 'Visão Geral', icon: IconGrid },
  { page: 'equipamentos', label: 'Equipamentos', icon: IconBox },
  { page: 'movimentacoes', label: 'Movimentações', icon: IconSwap }
]

export default function Sidebar({
  current,
  onNavigate,
  alertCount,
  totalEquipamentos,
  usuario,
  onLogout,
  onTrocarSenha
}: {
  current: Page
  onNavigate: (p: Page) => void
  alertCount: number
  totalEquipamentos: number
  usuario: Usuario
  onLogout: () => void
  onTrocarSenha: () => void
}) {
  const [theme, setThemeState] = useState(getTheme())

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    setThemeState(next)
  }

  const items = [...baseItems]
  if (usuario.papel === 'gerenciar') {
    items.push({ page: 'configuracoes', label: 'Configurações', icon: IconGear })
    items.push({ page: 'usuarios', label: 'Usuários', icon: IconUsers })
  }

  return (
    <aside className="w-64 shrink-0 bg-accent flex flex-col overflow-y-auto">
      <div className="px-5 py-5 border-b border-white/15 shrink-0">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight tracking-wide truncate">
              CONTROLE DE ESTOQUE
            </p>
            <a
              href="https://www.linkedin.com/in/andrelsandre"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-white/60 hover:text-white hover:underline"
            >
              por André André
            </a>
          </div>
        </div>
        <p className="text-xs text-white/70 mt-3">
          {totalEquipamentos} equipamentos cadastrados
          {alertCount > 0 ? ` · ${alertCount} alerta${alertCount > 1 ? 's' : ''}` : ''}
        </p>
      </div>

      <nav className="flex-1 py-3 min-h-0 overflow-y-auto">
        {items.map(({ page, label, icon: Icon }) => {
          const active = current === page
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors relative ${
                active
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {active && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#6BFF50]" />}
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{label}</span>
              {page === 'dashboard' && alertCount > 0 && (
                <span className="ml-auto bg-danger text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                  {alertCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="px-5 py-3 border-t border-white/15 shrink-0">
        <p className="text-sm font-semibold text-white truncate">{usuario.nome}</p>
        <p className="text-[11px] text-white/60 truncate">{usuario.email}</p>
        <p className="text-[11px] text-white/60 mt-0.5">{PAPEL_LABEL[usuario.papel]}</p>
      </div>

      <div className="px-3 py-3 border-t border-white/15 space-y-1 shrink-0">
        <button
          onClick={onTrocarSenha}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <IconKey className="w-[18px] h-[18px] shrink-0" />
          <span>Trocar minha senha</span>
        </button>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          {theme === 'dark' ? <IconSun className="w-[18px] h-[18px] shrink-0" /> : <IconMoon className="w-[18px] h-[18px] shrink-0" />}
          <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <IconLogout className="w-[18px] h-[18px] shrink-0" />
          <span>Sair</span>
        </button>
      </div>

      <div className="px-5 py-4 border-t border-white/15 shrink-0 space-y-2">
        <p className="text-[11px] text-white/50">Projeto de portfólio de André André</p>
        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/andrelsandre"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white"
          >
            <IconLinkedin className="w-3.5 h-3.5" />
            LinkedIn
          </a>
          <a
            href="https://github.com/andre-tech2/portfolio"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white"
          >
            <IconGithub className="w-3.5 h-3.5" />
            Ver código
          </a>
        </div>
      </div>
    </aside>
  )
}
