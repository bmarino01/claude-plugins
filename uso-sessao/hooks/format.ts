import type { Limite } from '../types'

export const LARGURA_BARRA = 20

const NOMES: Record<string, string> = {
  five_hour: 'Sessão (5 h)',
  seven_day: 'Semana',
  spend_limit: 'Limite de gasto'
}

/** A sessão de 5 h primeiro, depois a semana, depois o resto. */
const ORDEM: Record<string, number> = { five_hour: 0, seven_day: 1, spend_limit: 2 }

export function nomeJanela(kind: string) {
  return NOMES[kind] ?? kind
}

export function ordenar(limites: Limite[]) {
  return [...limites].sort((a, b) => (ORDEM[a.kind] ?? 9) - (ORDEM[b.kind] ?? 9))
}

/** Células cheias e vazias da barra para um percentual (0 a 100, limitado). */
export function celulas(percent: number, largura = LARGURA_BARRA) {
  const p = Math.min(100, Math.max(0, percent))
  const cheias = Math.round((p / 100) * largura)
  return { cheias, vazias: largura - cheias }
}

export function percentTexto(percent: number) {
  return `${Number.isInteger(percent) ? percent : percent.toFixed(1).replace('.', ',')}%`
}

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const pad = (n: number) => String(n).padStart(2, '0')

/** Partes de data e hora no horário de Brasília (UTC−3, sem horário de verão). */
function brasilia(ms: number) {
  const d = new Date(ms - 3 * 60 * 60 * 1000)
  return {
    dia: d.getUTCDate(),
    mes: d.getUTCMonth() + 1,
    semana: d.getUTCDay(),
    hora: d.getUTCHours(),
    minuto: d.getUTCMinutes(),
    chaveDia: `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
  }
}

/** "às 16:00" hoje; "amanhã às 09:00"; "seg 27/10 às 09:00" mais adiante. */
export function quandoReseta(resetsAt: string, agora: number) {
  const alvo = Date.parse(resetsAt)
  if (Number.isNaN(alvo)) return null
  const r = brasilia(alvo)
  const hoje = brasilia(agora)
  const amanha = brasilia(agora + 24 * 60 * 60 * 1000)
  const hora = `${pad(r.hora)}:${pad(r.minuto)}`
  if (r.chaveDia === hoje.chaveDia) return `às ${hora}`
  if (r.chaveDia === amanha.chaveDia) return `amanhã às ${hora}`
  return `${DIAS[r.semana]} ${pad(r.dia)}/${pad(r.mes)} às ${hora}`
}

/** "em 1h 12min", "em 3d 4h", "em 5 min"; null se já passou. */
export function faltam(resetsAt: string, agora: number) {
  const alvo = Date.parse(resetsAt)
  if (Number.isNaN(alvo)) return null
  const min = Math.ceil((alvo - agora) / 60_000)
  if (min <= 0) return null
  const dias = Math.floor(min / 1440)
  const horas = Math.floor((min % 1440) / 60)
  const minutos = min % 60
  if (dias > 0) return `em ${dias}d ${horas}h`
  if (horas > 0) return `em ${horas}h ${pad(minutos)}min`
  return `em ${minutos} min`
}

/** Cor do percentual: azul até 79%, âmbar de 80%, vermelho de 95%. A barra fica azul. */
export function corPercentual(percent: number) {
  if (percent >= 95) return '#ff6a5f'
  if (percent >= 80) return '#f0a83a'
  return '#8cc8ff'
}
