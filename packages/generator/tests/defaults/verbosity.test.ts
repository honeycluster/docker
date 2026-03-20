import { describe, it, expect } from 'vitest';
import { getVerbosityDefaults, VALID_LOG_LEVELS } from '../../src/defaults/verbosity.js';
import type { LogLevel } from '../../src/types/xrpld-input.js';

describe('VALID_LOG_LEVELS', () => {
  it('contains all 7 log level values', () => {
    expect(VALID_LOG_LEVELS.size).toBe(7);
    expect(VALID_LOG_LEVELS.has('silent')).toBe(true);
    expect(VALID_LOG_LEVELS.has('fatal')).toBe(true);
    expect(VALID_LOG_LEVELS.has('error')).toBe(true);
    expect(VALID_LOG_LEVELS.has('warning')).toBe(true);
    expect(VALID_LOG_LEVELS.has('info')).toBe(true);
    expect(VALID_LOG_LEVELS.has('debug')).toBe(true);
    expect(VALID_LOG_LEVELS.has('trace')).toBe(true);
  });

  it('rejects invalid log levels', () => {
    expect(VALID_LOG_LEVELS.has('verbose')).toBe(false);
    expect(VALID_LOG_LEVELS.has('')).toBe(false);
    expect(VALID_LOG_LEVELS.has('warn')).toBe(false);
  });
});

describe('getVerbosityDefaults', () => {
  it('silent maps to severity fatal', () => {
    const result = getVerbosityDefaults('silent');
    expect(result.rpc_startup).toEqual([{ command: 'log_level', severity: 'fatal' }]);
  });

  it('fatal maps to severity fatal', () => {
    const result = getVerbosityDefaults('fatal');
    expect(result.rpc_startup).toEqual([{ command: 'log_level', severity: 'fatal' }]);
  });

  it('error maps to severity error', () => {
    const result = getVerbosityDefaults('error');
    expect(result.rpc_startup).toEqual([{ command: 'log_level', severity: 'error' }]);
  });

  it('warning maps to severity warning', () => {
    const result = getVerbosityDefaults('warning');
    expect(result.rpc_startup).toEqual([{ command: 'log_level', severity: 'warning' }]);
  });

  it('info maps to severity info', () => {
    const result = getVerbosityDefaults('info');
    expect(result.rpc_startup).toEqual([{ command: 'log_level', severity: 'info' }]);
  });

  it('debug maps to severity debug', () => {
    const result = getVerbosityDefaults('debug');
    expect(result.rpc_startup).toEqual([{ command: 'log_level', severity: 'debug' }]);
  });

  it('trace maps to severity trace', () => {
    const result = getVerbosityDefaults('trace');
    expect(result.rpc_startup).toEqual([{ command: 'log_level', severity: 'trace' }]);
  });

  it('each level returns a valid Partial<XrpldInput> with rpc_startup', () => {
    const levels: ReadonlyArray<LogLevel> = ['silent', 'fatal', 'error', 'warning', 'info', 'debug', 'trace'];
    for (const level of levels) {
      const result = getVerbosityDefaults(level);
      expect(result).toBeDefined();
      expect(result.rpc_startup).toBeDefined();
      expect(result.rpc_startup).toHaveLength(1);
      expect(result.rpc_startup![0]).toHaveProperty('command', 'log_level');
      expect(result.rpc_startup![0]).toHaveProperty('severity');
    }
  });

  it('silent and fatal both produce the same output', () => {
    expect(getVerbosityDefaults('silent')).toEqual(getVerbosityDefaults('fatal'));
  });
});
