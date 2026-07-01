/**
 * Item 8 (Batch C): App-side structured logger.
 *
 * Mirror of the Foundry-side logger in scripts/utils/logger.js. Same API,
 * same output format. Level gated by localStorage key 'sd20:log-level',
 * default 'info'. Every line prefixed with [SD20][<tag>][<ISO timestamp>].
 *
 * Existing console.log/warn/error call sites stay untouched. New call sites
 * should use this.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function _currentLevel(): number {
  if (typeof window === 'undefined') return LEVEL_ORDER.info
  const stored = window.localStorage.getItem('sd20:log-level') as Level | null
  if (stored && stored in LEVEL_ORDER) return LEVEL_ORDER[stored]
  return LEVEL_ORDER.info
}

function _emit(level: Level, tag: string, message: string, args: unknown[]): void {
  if (LEVEL_ORDER[level] < _currentLevel()) return
  const ts = new Date().toISOString()
  const prefix = `[SD20][${tag}][${ts}]`
  const fn = level === 'debug' ? console.debug
    : level === 'info' ? console.log
    : level === 'warn' ? console.warn
    : console.error
  fn(prefix, message, ...args)
}

export const logger = {
  debug(tag: string, message: string, ...args: unknown[]): void {
    _emit('debug', tag, message, args)
  },
  info(tag: string, message: string, ...args: unknown[]): void {
    _emit('info', tag, message, args)
  },
  warn(tag: string, message: string, ...args: unknown[]): void {
    _emit('warn', tag, message, args)
  },
  error(tag: string, message: string, ...args: unknown[]): void {
    _emit('error', tag, message, args)
  },
  setLevel(level: Level): void {
    if (typeof window === 'undefined') return
    if (!(level in LEVEL_ORDER)) return
    window.localStorage.setItem('sd20:log-level', level)
  },
}
