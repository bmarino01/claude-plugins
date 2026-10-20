import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Limite } from '../types'
import { celulas, corPercentual, faltam, nomeJanela, ordenar, percentTexto, quandoReseta } from './format'

const limites = atom({ plugin: 'uso-sessao', key: 'limites' } as const, [] as Limite[])
const agora = atom({ plugin: 'uso-sessao', key: 'agora' } as const, 0)

const AZUL = '#4ea1ff'
const AZUL_FUNDO = '#1f3550'

const copiar = (lista: readonly Limite[]): Limite[] =>
  lista.map(({ kind, percentUsed, resetsAt }) => (resetsAt ? { kind, percentUsed, resetsAt } : { kind, percentUsed }))

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    // Leitura inicial (vazia até a primeira resposta da API nesta sessão).
    const uso = await $.session.usage()
    await update($, limites, () => copiar(uso.rateLimits))
    const inicio = await $.clock.now()
    await update($, agora, () => inicio)
    // A contagem regressiva anda sozinha, sem depender de uma nova resposta.
    $.clock.every(30_000, () => {
      void $.clock.now().then(ms => update($, agora, () => ms))
    })
    return result
  })

  // Empurrado pelo engine a cada turno e quando uma janela anda um ponto inteiro.
  on('session.measure', async ($, e, next) => {
    await update($, limites, () => copiar(e.rateLimits))
    const ms = await $.clock.now()
    await update($, agora, () => ms)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)

    const lista = ordenar(await read($, limites))
    const relogio = (await read($, agora)) || (await $.clock.now())
    const { Box, Text } = $.ui.resolve(e)

    if (lista.length === 0) {
      return (
        <Box>
          <Text color={AZUL}>Uso da sessão: aparece depois da primeira resposta do Claude.</Text>
        </Box>
      )
    }

    return (
      <Box flexDirection="column">
        {lista.map(l => {
          const { cheias, vazias } = celulas(l.percentUsed)
          const quando = l.resetsAt ? quandoReseta(l.resetsAt, relogio) : null
          const resta = l.resetsAt ? faltam(l.resetsAt, relogio) : null
          return (
            <Box key={l.kind}>
              <Text color={AZUL} weight="semibold">{nomeJanela(l.kind).padEnd(16)}</Text>
              <Text color={AZUL}>{'█'.repeat(cheias)}</Text>
              <Text color={AZUL_FUNDO}>{'█'.repeat(vazias)}</Text>
              <Text color={corPercentual(l.percentUsed)} weight="semibold">{` ${percentTexto(l.percentUsed).padStart(6)}`}</Text>
              {quando ? (
                <Text dimColor>{`   reset ${quando}${resta ? ` (${resta})` : ''}`}</Text>
              ) : (
                <Text dimColor>{'   horário do reset não informado'}</Text>
              )}
            </Box>
          )
        })}
      </Box>
    )
  })
}
