import type {
  XrpldInput,
  XrpldGeneratorResult,
} from '../types/xrpld-input.js';
import { resolveXrpldConfig } from '../defaults/xrpld.js';
import { renderXrpldCfg } from '../renderers/cfg-renderer.js';
import { generateValidatorsTxt } from './validators-txt.js';
import { validateXrpldConfig } from '../validation.js';

/**
 * Generate xrpld.cfg and validators.txt from partial input.
 * Resolves defaults, validates, renders cfg, and generates validators.txt.
 * @param input - Partial xrpld configuration (merged with network defaults)
 * @returns Generated config string, validators.txt string, and any warnings
 * @throws Error if validation fails with error-severity issues
 */
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
