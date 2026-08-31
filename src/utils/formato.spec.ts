import { describe, it, expect } from 'vitest'
import { formatarData, formatarDataHora, formatarDinheiro, paraDataHoraApi } from './formato'

describe('formatarDataHora', () => {
  it('formata a data ISO sem converter fuso', () => {
    expect(formatarDataHora('2026-12-20T19:00:00')).toBe('20 de dez de 2026, 19:00')
  })

  it('devolve a string original quando o formato é inesperado', () => {
    expect(formatarDataHora('sem-data')).toBe('sem-data')
  })
})

describe('formatarData', () => {
  it('formata como dd/mm/aaaa', () => {
    expect(formatarData('2026-01-05T08:30:00')).toBe('05/01/2026')
  })
})

describe('formatarDinheiro', () => {
  it('formata em reais com 2 casas', () => {
    expect(formatarDinheiro(60)).toBe('R$ 60,00')
    expect(formatarDinheiro(1234.5)).toBe('R$ 1.234,50')
  })
})

describe('paraDataHoraApi', () => {
  it('acrescenta os segundos ao valor do datetime-local', () => {
    expect(paraDataHoraApi('2026-12-20T19:00')).toBe('2026-12-20T19:00:00')
  })

  it('mantém o valor quando já traz segundos', () => {
    expect(paraDataHoraApi('2026-12-20T19:00:30')).toBe('2026-12-20T19:00:30')
  })

  it('devolve string vazia para valor vazio', () => {
    expect(paraDataHoraApi('')).toBe('')
  })
})
