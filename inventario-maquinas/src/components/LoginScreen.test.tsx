// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import LoginScreen from './LoginScreen'

afterEach(() => {
  cleanup()
})

function mockApi(loginImpl: (email: string, senha: string) => Promise<Usuario>) {
  ;(window as unknown as { api: Window['api'] }).api = {
    demo: {
      credenciais: () => ({ email: 'admin@novatech.com', senha: 'novatech@123' }),
      resetar: vi.fn()
    },
    auth: {
      login: loginImpl,
      logout: vi.fn(),
      currentUser: vi.fn(),
      changePassword: vi.fn()
    }
  } as unknown as Window['api']
}

const usuarioDemo: Usuario = {
  id: 1,
  nome: 'Administrador NovaTech',
  email: 'admin@novatech.com',
  papel: 'gerenciar',
  ativo: true,
  criado_em: '2026-01-01'
}

describe('LoginScreen', () => {
  it('mostra as credenciais de demonstração', () => {
    mockApi(vi.fn())
    render(<LoginScreen onLogin={vi.fn()} />)
    expect(screen.getAllByText('admin@novatech.com').length).toBeGreaterThan(0)
  })

  it('faz login e chama onLogin ao clicar no acesso rápido de demonstração', async () => {
    const login = vi.fn().mockResolvedValue(usuarioDemo)
    mockApi(login)
    const onLogin = vi.fn()
    render(<LoginScreen onLogin={onLogin} />)

    fireEvent.click(screen.getByText('Entrar como administrador (demo)'))

    await waitFor(() => expect(onLogin).toHaveBeenCalledWith(usuarioDemo))
    expect(login).toHaveBeenCalledWith('admin@novatech.com', 'novatech@123')
  })

  it('mostra a mensagem de erro quando o login falha', async () => {
    const login = vi.fn().mockRejectedValue(new Error('E-mail ou senha inválidos.'))
    mockApi(login)
    render(<LoginScreen onLogin={vi.fn()} />)

    fireEvent.click(screen.getByText('Entrar como administrador (demo)'))

    await waitFor(() => expect(screen.getByText('E-mail ou senha inválidos.')).toBeTruthy())
  })
})
