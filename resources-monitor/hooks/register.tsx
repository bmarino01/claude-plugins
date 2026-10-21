import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Sample } from '../types'

const PANE = 'resources-monitor'
const HISTORY = 60
const DISK_EVERY = 5
const samples = atom({ plugin: 'resources-monitor', key: 'samples' } as const, [])
const cores = atom({ plugin: 'resources-monitor', key: 'cores' } as const, 1)
const SPARKS = '▁▂▃▄▅▆▇█'
const AMBER = '#FFB000'
const AMBER_DIM = '#8A5F00'
const CRITICAL = '#FF4D2E'

// Soma dos jiffies da linha agregada "cpu" de /proc/stat: [ocioso, total]
function cpuTimes(stat: string): [number, number] {
  const fields = (stat.split('\n')[0] ?? '').trim().split(/\s+/).slice(1).map(Number)
  const idle = (fields[3] ?? 0) + (fields[4] ?? 0)
  return [idle, fields.reduce((a, b) => a + b, 0)]
}

function memInfo(text: string): { used: number; total: number } {
  const kb = (name: string) => Number(new RegExp(`^${name}:\\s+(\\d+)`, 'm').exec(text)?.[1] ?? 0)
  const total = kb('MemTotal')
  return { used: total - kb('MemAvailable'), total }
}

// Segunda linha de `df -kP /`: total, usado e livre em KiB
function diskInfo(df: string): { used: number; total: number } {
  const [, total = 0, used = 0, avail = 0] = (df.trim().split('\n')[1] ?? '').split(/\s+/).map(Number)
  return { used, total: used + avail || total }
}

const gib = (kb: number) => (kb / 1024 / 1024).toFixed(2)
const pct = (n: number) => `${n.toFixed(1).padStart(5)}%`
const tone = (n: number) => (n >= 85 ? CRITICAL : AMBER)
const bar = (n: number, width: number) => {
  const full = Math.round((Math.min(100, n) / 100) * width)
  return ['█'.repeat(full), '░'.repeat(width - full)] as const
}
const spark = (values: number[]) =>
  values.map(v => SPARKS[Math.min(7, Math.floor((Math.min(100, v) / 100) * 8))]).join('')

export const register: Register = on => {
  let last: [number, number] | undefined
  let disk = { used: 0, total: 0 }
  let tick = 0

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'resources-monitor', description: 'Abre o painel de CPU, memória e disco' })

    const cpuinfo = await $.fs.read('/proc/cpuinfo').catch(() => '')
    await update($, cores, () => Math.max(1, (cpuinfo.match(/^processor\s*:/gm) ?? []).length))

    $.clock.every(1000, () => {
      void (async () => {
        if (tick++ % DISK_EVERY === 0) {
          const df = await $.process.run(['df', '-kP', '/'])
          if (df.exitCode === 0) disk = diskInfo(df.stdout)
        }
        const [stat, mem] = await Promise.all([$.fs.read('/proc/stat'), $.fs.read('/proc/meminfo')])
        const now = cpuTimes(stat)
        const prev = last
        last = now
        if (!prev) return
        const total = now[1] - prev[1]
        const cpu = total > 0 ? (1 - (now[0] - prev[0]) / total) * 100 : 0
        const { used, total: memTotal } = memInfo(mem)
        const sample: Sample = { cpu, memUsed: used, memTotal, diskUsed: disk.used, diskTotal: disk.total }
        await update($, samples, list => [...list, sample].slice(-HISTORY))
      })().catch(() => {})
    })

    void $.ui.open({ id: PANE, title: 'CPU · Memória · Disco', columns: 34 })
    return next(e)
  })

  on('command.run', { command: 'resources-monitor' }, async $ => {
    await $.ui.open({ id: PANE, title: 'CPU · Memória · Disco', columns: 34 })
    return { text: 'Painel de CPU, memória e disco aberto.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const list = await read($, samples)
    const ncores = await read($, cores)
    const width = Math.max(10, Math.min(HISTORY, (e.viewport?.columns ?? 34) - 4))
    const s = list[list.length - 1]
    if (!s) return <Text color={AMBER_DIM}>Coletando…</Text>

    const memPct = (s.memUsed / s.memTotal) * 100
    const diskPct = s.diskTotal > 0 ? (s.diskUsed / s.diskTotal) * 100 : 0
    const history = (pick: (x: Sample) => number) => spark(list.slice(-width).map(pick))
    const meter = (n: number) => {
      const [full, empty] = bar(n, width - 7)
      return (
        <Text>
          <Text color={tone(n)}>{full}</Text>
          <Text color={AMBER_DIM}>{empty}</Text>
          <Text color={tone(n)} bold>{pct(n)}</Text>
        </Text>
      )
    }

    return (
      <Box flexDirection="column">
        <Text color={AMBER} bold>CPU <Text color={AMBER_DIM}>({ncores} {ncores === 1 ? 'núcleo' : 'núcleos'})</Text></Text>
        {meter(s.cpu)}
        <Text color={AMBER}>{history(x => x.cpu)}</Text>
        <Text> </Text>
        <Text color={AMBER} bold>Memória</Text>
        {meter(memPct)}
        <Text color={AMBER_DIM}>{gib(s.memUsed)} / {gib(s.memTotal)} GiB</Text>
        <Text color={AMBER}>{history(x => (x.memUsed / x.memTotal) * 100)}</Text>
        <Text> </Text>
        <Text color={AMBER} bold>Disco <Text color={AMBER_DIM}>(/)</Text></Text>
        {meter(diskPct)}
        <Text color={AMBER_DIM}>{gib(s.diskUsed)} / {gib(s.diskTotal)} GiB</Text>
      </Box>
    )
  })
}
