import type { LogLevel, XrpldInput } from '../types/xrpld-input.js';

export const VALID_LOG_LEVELS: ReadonlySet<string> = new Set<string>([
  'silent',
  'fatal',
  'error',
  'warning',
  'info',
  'debug',
  'trace',
]);

const SEVERITY_MAP: Record<LogLevel, string> = {
  silent: 'fatal',
  fatal: 'fatal',
  error: 'error',
  warning: 'warning',
  info: 'info',
  debug: 'debug',
  trace: 'trace',
};

const VERBOSITY_MAP: Record<LogLevel, Partial<XrpldInput>> = Object.fromEntries(
  (Object.keys(SEVERITY_MAP) as LogLevel[]).map((level) => [
    level,
    {
      rpc_startup: [{ command: 'log_level', severity: SEVERITY_MAP[level] }],
    },
  ]),
) as Record<LogLevel, Partial<XrpldInput>>;

/**
 * Get verbosity-specific default configuration values.
 * @param level - Target log level
 * @returns Partial XrpldInput with rpc_startup log_level command
 */
export function getVerbosityDefaults(level: LogLevel): Partial<XrpldInput> {
  return VERBOSITY_MAP[level];
}
