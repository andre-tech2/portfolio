import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatIdade } from './idade'

describe('formatIdade', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-07T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('retorna "0 dias" para a data de hoje', () => {
    expect(formatIdade('2026-09-07')).toBe('0 dias')
  })

  it('retorna dias para menos de 30 dias', () => {
    expect(formatIdade('2026-08-28')).toBe('10 dias')
  })

  it('retorna meses para menos de 1 ano', () => {
    expect(formatIdade('2026-07-07')).toBe('2 meses')
  })

  it('retorna anos e meses combinados', () => {
    expect(formatIdade('2024-06-07')).toBe('2 anos e 3 meses')
  })

  it('retorna anos exatos sem meses quando bate no aniversário', () => {
    expect(formatIdade('2024-09-07')).toBe('2 anos')
  })

  it('retorna "Data futura" para datas no futuro', () => {
    expect(formatIdade('2026-09-12')).toBe('Data futura')
  })

  it('retorna "—" para uma data inválida', () => {
    expect(formatIdade('não-é-uma-data')).toBe('—')
  })
})
