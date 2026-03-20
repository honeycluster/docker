import { describe, it, expect } from 'vitest';
import { getVerbosityDefaults, VALID_LOG_LEVELS } from '../defaults/verbosity.js';
import type { LogLevel } from '../types/xrpld-input.js';

describe('VALID_LOG_LEVELS', () => {
  it('contains all 7 log levels', () => {
    expect(VALID_LOG_LEVELS.size).toBe(7);
    for (const level of ['silent', 'fatal', 'error', 'warning', 'info', 'debug', 'trace']) {
      expect(VALID_LOG_LEVELS.has(level)).toBe(true);
    }
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

  it('all levels return only rpc_startup (no other fields)', () => {
    const levels: LogLevel[] = ['silent', 'fatal', 'error', 'warning', 'info', 'debug', 'trace'];
    for (const level of levels) {
      const result = getVerbosityDefaults(level);
      expect(Object.keys(result)).toEqual(['rpc_startup']);
    }
  });

  it('all levels have exactly one rpc_startup command', () => {
    const levels: LogLevel[] = ['silent', 'fatal', 'error', 'warning', 'info', 'debug', 'trace'];
    for (const level of levels) {
      const result = getVerbosityDefaults(level);
      expect(result.rpc_startup).toHaveLength(1);
      expect(result.rpc_startup![0]).toHaveProperty('command', 'log_level');
      expect(result.rpc_startup![0]).toHaveProperty('severity');
    }
  });
});
