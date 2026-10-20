import { expect, test } from 'claude-code/testing'

import { celulas, corPercentual, faltam, nomeJanela, ordenar, percentTexto, quandoReseta } from './format'

// 20/10/2026 15:30 UTC = 12:30 em Brasília.
const AGORA = Date.parse('2026-10-20T15:30:00Z')

test('barra de 20 células proporcional ao uso, limitada a 0..100', () => {
  expect(celulas(42)).toEqual({ cheias: 8, vazias: 12 })
  expect(celulas(0)).toEqual({ cheias: 0, vazias: 20 })
  expect(celulas(130)).toEqual({ cheias: 20, vazias: 0 })
})

test('percentual com vírgula decimal', () => {
  expect(percentTexto(42)).toBe('42%')
  expect(percentTexto(23.5)).toBe('23,5%')
})

test('reset hoje, amanhã e em outro dia, no horário de Brasília', () => {
  expect(quandoReseta('2026-10-20T19:00:00Z', AGORA)).toBe('às 16:00')
  expect(quandoReseta('2026-10-21T12:00:00Z', AGORA)).toBe('amanhã às 09:00')
  expect(quandoReseta('2026-10-26T12:00:00Z', AGORA)).toBe('seg 26/10 às 09:00')
  expect(quandoReseta('não é data', AGORA)).toBe(null)
})

test('contagem regressiva até o reset', () => {
  expect(faltam('2026-10-20T16:42:00Z', AGORA)).toBe('em 1h 12min')
  expect(faltam('2026-10-20T15:35:00Z', AGORA)).toBe('em 5 min')
  expect(faltam('2026-10-23T19:30:00Z', AGORA)).toBe('em 3d 4h')
  expect(faltam('2026-10-20T15:00:00Z', AGORA)).toBe(null)
})

test('sessão de 5 h antes da semana, nomes em português e cor do percentual', () => {
  const lista = ordenar([
    { kind: 'seven_day', percentUsed: 10 },
    { kind: 'five_hour', percentUsed: 50 }
  ])
  expect(lista.map(l => l.kind)).toEqual(['five_hour', 'seven_day'])
  expect(nomeJanela('five_hour')).toBe('Sessão (5 h)')
  expect(nomeJanela('seven_day')).toBe('Semana')
  expect(corPercentual(50)).toBe('#8cc8ff')
  expect(corPercentual(85)).toBe('#f0a83a')
  expect(corPercentual(97)).toBe('#ff6a5f')
})
