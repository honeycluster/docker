// #region Types

export interface ConfigGenInput {
  env?: string;
  json?: string;
  overrides?: Record<string, string>;
}

export interface ConfigGenResult {
  config: string;
  warnings: string[];
}

// #endregion

// #region Imports

import { parseEnvFile } from './parsers/env-parser.js';
import { parseJsonFile } from './parsers/json-parser.js';
import { generateXrpldConfig } from './generators/xrpld.js';
import { generateClioConfig } from './generators/clio.js';
import { validateXrpldInputs, validateClioInputs } from './validation.js';

// #endregion

// #region Helpers

function mergeInputs(input: ConfigGenInput): Record<string, string> {
  let envVars: Record<string, string> = {};
  if (input.env) {
    envVars = parseEnvFile(input.env);
  }

  let jsonVars: Record<string, string> = {};
  if (input.json) {
    jsonVars = parseJsonFile(input.json);
  }

  return { ...envVars, ...jsonVars, ...(input.overrides ?? {}) };
}

// #endregion

// #region Public API

export { parseEnvFile } from './parsers/env-parser.js';
export { parseJsonFile } from './parsers/json-parser.js';
export { validateXrpldInputs, validateClioInputs } from './validation.js';
export type { ValidationError, ValidationResult } from './validation.js';
export type { XrpldGeneratorResult } from './generators/xrpld.js';
export type { ClioGeneratorResult } from './generators/clio.js';

/**
 * Generate an xrpld.cfg configuration from .env content, JSON content, or direct overrides.
 * Priority: overrides > json > env (highest to lowest).
 */
export function generateXrpldConfigFromInput(input: ConfigGenInput = {}): ConfigGenResult {
  const merged = mergeInputs(input);
  return generateXrpldConfig(merged);
}

/**
 * Generate a Clio config.json from .env content, JSON content, or direct overrides.
 * Priority: overrides > json > env (highest to lowest).
 */
export function generateClioConfigFromInput(input: ConfigGenInput = {}): ConfigGenResult {
  const merged = mergeInputs(input);
  return generateClioConfig(merged);
}

// Re-export the low-level generators for direct use
export { generateXrpldConfig } from './generators/xrpld.js';
export { generateClioConfig } from './generators/clio.js';

// #endregion
