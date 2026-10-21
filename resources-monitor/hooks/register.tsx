import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Sample } from '../types'

const PANE = 'resources-monitor'
const TITLE = 'CPU · Memory · Disk'
// Fixed bar width, in blocks (the percentage follows it)
const BAR = 14
const DISK_EVERY = 5
// At or above this usage the percentage gets a "!" so it stands out without color
const CRITICAL = 85
const samples = atom({ plugin: 'resources-monitor', key: 'samples' } as const, [])
const cores = atom({ plugin: 'resources-monitor', key: 'cores' } as const, 1)

// Jiffies from the aggregate "cpu" line of /proc/stat: [idle, total]
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

// Second line of `df -kP /`: total, used and available in KiB
function diskInfo(df: string): { used: number; total: number } {
  const [, total = 0, used = 0, avail = 0] = (df.trim().split('\n')[1] ?? '').split(/\s+/).map(Number)
  return { used, total: used + avail || total }
}

const gib = (kb: number) => (kb / 1024 / 1024).toFixed(2)
const pct = (n: number) => `${n.toFixed(1).padStart(5)}%${n >= CRITICAL ? '!' : ''}`
const bar = (n: number, width: number) => {
  const full = Math.round((Math.min(100, n) / 100) * width)
  return ['█'.repeat(full), '░'.repeat(width - full)] as const
}

export const register: Register = on => {
  let last: [number, number] | undefined
  let disk = { used: 0, total: 0 }
  let tick = 0

  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'resources-monitor', description: 'Open the CPU, memory and disk panel' })

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
        await update($, samples, () => [sample])
      })().catch(() => {})
    })

    void $.ui.open({ id: PANE, title: TITLE, columns: 26 })
    return next(e)
  })

  on('command.run', { command: 'resources-monitor' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE, columns: 26 })
    return { text: 'CPU, memory and disk panel opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const list = await read($, samples)
    const ncores = await read($, cores)
    const s = list[list.length - 1]
    if (!s) return <Text dimColor>Collecting…</Text>

    const memPct = (s.memUsed / s.memTotal) * 100
    const diskPct = s.diskTotal > 0 ? (s.diskUsed / s.diskTotal) * 100 : 0
    const meter = (n: number) => {
      const [full, empty] = bar(n, BAR)
      return (
        <Text>
          <Text>{full}</Text>
          <Text dimColor>{empty}</Text>
          <Text bold>{pct(n)}</Text>
        </Text>
      )
    }

    return (
      <Box flexDirection="column">
        <Text bold>CPU <Text dimColor>({ncores} {ncores === 1 ? 'core' : 'cores'})</Text></Text>
        {meter(s.cpu)}
        <Text> </Text>
        <Text bold>Memory</Text>
        {meter(memPct)}
        <Text dimColor>{gib(s.memUsed)} / {gib(s.memTotal)} GiB</Text>
        <Text> </Text>
        <Text bold>Disk <Text dimColor>(/)</Text></Text>
        {meter(diskPct)}
        <Text dimColor>{gib(s.diskUsed)} / {gib(s.diskTotal)} GiB</Text>
      </Box>
    )
  })
}
