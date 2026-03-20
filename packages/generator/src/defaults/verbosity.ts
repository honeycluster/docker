import type { LogLevel, XrpldInput } from '../types/xrpld-input.js';

// #region -- Verbosity Preset Defaults --------------------

export const VALID_LOG_LEVELS: ReadonlySet<string> = new Set<string>([
  'silent',
  'fatal',
  'error',
  'warning',
  'info',
  'debug',
  'trace',
]);

const VERBOSITY_MAP: Record<LogLevel, Partial<XrpldInput>> = {
  silent: {
    rpc_startup: [{ command: 'log_level', severity: 'fatal' }],
  },
  fatal: {
    rpc_startup: [{ command: 'log_level', severity: 'fatal' }],
  },
  error: {
    rpc_startup: [{ command: 'log_level', severity: 'error' }],
  },
  warning: {
    rpc_startup: [{ command: 'log_level', severity: 'warning' }],
  },
  info: {
    rpc_startup: [{ command: 'log_level', severity: 'info' }],
  },
  debug: {
    rpc_startup: [{ command: 'log_level', severity: 'debug' }],
  },
  trace: {
    rpc_startup: [{ command: 'log_level', severity: 'trace' }],
  },
};

/**
 * Get verbosity-specific default configuration values.
 * @param level - Target log level
 * @returns Partial XrpldInput with rpc_startup log_level command
 */
export function getVerbosityDefaults(level: LogLevel): Partial<XrpldInput> {
  return VERBOSITY_MAP[level];
}

// #endregion -- Verbosity Preset Defaults -----------------
