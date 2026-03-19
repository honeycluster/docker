import type {
  XrpldInput,
  XrpldGeneratorResult,
  ValidationResult,
  ValidationEntry,
} from '../types/xrpld-input.js';
import { resolveXrpldConfig } from '../defaults/xrpld.js';
import { renderXrpldCfg } from '../renderers/cfg-renderer.js';
import { generateValidatorsTxt } from './validators-txt.js';

// #region Validation Stub

export function validateXrpldConfig(config: XrpldInput): ValidationResult {
  const errors: ValidationEntry[] = [];
  const warnings: ValidationEntry[] = [];

  // Minimal validation — US-005 will replace with comprehensive rules
  if (config.node_db && !config.node_db.path) {
    errors.push({
      section: 'node_db',
      field: 'path',
      value: config.node_db.path,
      message: 'node_db.path is required',
      severity: 'error',
    });
  }

  if (config.node_db && config.node_db.type !== 'NuDB' && config.node_db.type !== 'RocksDB') {
    errors.push({
      section: 'node_db',
      field: 'type',
      value: config.node_db.type,
      message: 'node_db.type must be NuDB or RocksDB',
      severity: 'error',
    });
  }

  if (config.validation_seed && config.validator_token) {
    errors.push({
      section: 'validators',
      field: 'validation_seed',
      value: config.validation_seed,
      message: 'validation_seed and validator_token are mutually exclusive',
      severity: 'error',
    });
  }

  return { errors, warnings };
}

// #endregion

// #region Main Generator

export function generateXrpldConfig(
  input: Partial<XrpldInput> = {},
): XrpldGeneratorResult {
  const resolved = resolveXrpldConfig(input);
  const validation = validateXrpldConfig(resolved);

  if (validation.errors.length > 0) {
    const messages = validation.errors.map((e) => `${e.section}.${e.field}: ${e.message}`);
    throw new Error(`Validation failed:\n${messages.join('\n')}`);
  }

  const config = renderXrpldCfg(resolved);
  const validatorsTxt = generateValidatorsTxt(resolved);
  const warnings = validation.warnings.map((w) => `${w.section}.${w.field}: ${w.message}`);

  return { config, validatorsTxt, warnings };
}

// #endregion
