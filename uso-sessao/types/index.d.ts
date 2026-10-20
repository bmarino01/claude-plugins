/** Uma janela de limite como a API informou (five_hour, seven_day, spend_limit). */
export type Limite = { kind: string; percentUsed: number; resetsAt?: string }

declare module 'claude-code' {
  interface PluginState {
    'uso-sessao': {
      /** Janelas da última leitura; vazio antes da primeira resposta da API. */
      limites: Limite[]
      /** Relógio da barra (ms), avançado a cada 30 s para a contagem regressiva andar. */
      agora: number
    }
  }
}
