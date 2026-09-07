import { useState } from 'react'
import Logo from './Logo'
import {
  IconBoxNew,
  IconChart,
  IconClock,
  IconGear,
  IconSun,
  IconMoon,
  IconUsers,
  IconKey,
  IconLogout,
  IconGithub,
  IconLinkedin
} from './icons'
import { getTheme, setTheme } from '../lib/theme'

export type Page = 'dashboard' | 'novas' | 'antigas' | 'configuracoes' | 'usuarios'

const PAPEL_LABEL: Record<Papel, string> = { visualizar: 'Visualizar', editar: 'Editar', gerenciar: 'Gerenciar tudo' }

const baseItems: { page: Page; label: string; icon: (p: { className?: string }) => JSX.Element }[] = [
  { page: 'dashboard', label: 'Visão Geral', icon: IconChart },
  { page: 'novas', label: 'Máquinas Novas', icon: IconBoxNew },
  { page: 'antigas', label: 'Máquinas Antigas', icon: IconClock }
]

export default function Sidebar({
  current,
  onNavigate,
  totalNovas,
  totalAntigas,
  usuario,
  onLogout,
  onTrocarSenha
}: {
  current: Page
  onNavigate: (p: Page) => void
  totalNovas: number
  totalAntigas: number
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
    <aside className="relative z-10 w-64 shrink-0 glass border-y-0 border-l-0 flex flex-col overflow-y-auto">
      <div className="px-5 py-5 border-b border-surface-border/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <Logo />
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-tight tracking-wide truncate brand-text">NOVATECH</p>
            <p className="text-[11px] text-text-muted -mt-0.5">Inventário de Máquinas</p>
          </div>
        </div>
        <p className="text-xs text-text-secondary mt-3">
          {totalNovas} nova{totalNovas === 1 ? '' : 's'} · {totalAntigas} antiga{totalAntigas === 1 ? '' : 's'}
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
                active ? 'text-text-primary font-semibold bg-accent/10' : 'text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary'
              }`}
            >
              {active && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-cyan to-accent-violet" />}
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-5 py-3 border-t border-surface-border/10 shrink-0">
        <p className="text-sm font-semibold text-text-primary truncate">{usuario.nome}</p>
        <p className="text-[11px] text-text-muted truncate">{usuario.email}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{PAPEL_LABEL[usuario.papel]}</p>
      </div>

      <div className="px-3 py-3 border-t border-surface-border/10 space-y-1 shrink-0">
        <button
          onClick={onTrocarSenha}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary transition-colors"
        >
          <IconKey className="w-[18px] h-[18px] shrink-0" />
          <span>Trocar minha senha</span>
        </button>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary transition-colors"
        >
          {theme === 'dark' ? <IconSun className="w-[18px] h-[18px] shrink-0" /> : <IconMoon className="w-[18px] h-[18px] shrink-0" />}
          <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm text-text-secondary hover:bg-surface-raised/40 hover:text-text-primary transition-colors"
        >
          <IconLogout className="w-[18px] h-[18px] shrink-0" />
          <span>Sair</span>
        </button>
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-surface-border/10 space-y-2">
        <p className="text-[11px] text-text-muted">Projeto de portfólio de André André</p>
        <div className="flex items-center gap-3">
          <a
            href="https://www.linkedin.com/in/andrelsandre"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <IconLinkedin className="w-3.5 h-3.5" />
            LinkedIn
          </a>
          <a
            href="https://github.com/andre-tech2/portfolio"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-text-primary transition-colors"
          >
            <IconGithub className="w-3.5 h-3.5" />
            Ver código
          </a>
        </div>
      </div>
    </aside>
  )
}
