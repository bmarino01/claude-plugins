export type Sample = {
  cpu: number
  memUsed: number
  memTotal: number
  diskUsed: number
  diskTotal: number
}

declare module 'claude-code' {
  interface PluginState {
    'resources-monitor': { samples: Sample[]; cores: number }
  }
}
