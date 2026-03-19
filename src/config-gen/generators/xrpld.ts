import type {
  XrpldInput,
  XrpldGeneratorResult,
} from '../types/xrpld-input.js';
import { resolveXrpldConfig } from '../defaults/xrpld.js';
import { renderXrpldCfg } from '../renderers/cfg-renderer.js';
import { generateValidatorsTxt } from './validators-txt.js';
import { validateXrpldConfig } from '../validation.js';

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
