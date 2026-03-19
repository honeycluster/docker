import type { XrpldInput } from '../types/xrpld-input.js';

// #region Validators.txt Generator

export function generateValidatorsTxt(config: XrpldInput): string {
  const sections: string[] = [];

  // [validator_list_sites]
  const sites = config.vl?.validator_list_sites;
  if (sites && sites.length > 0) {
    sections.push(`[validator_list_sites]\n${sites.join('\n')}`);
  }

  // [validator_list_keys]
  const keys = config.vl?.validator_list_keys;
  if (keys && keys.length > 0) {
    sections.push(`[validator_list_keys]\n${keys.join('\n')}`);
  }

  // [validators]
  const validators = config.validators;
  if (validators && validators.length > 0) {
    sections.push(`[validators]\n${validators.join('\n')}`);
  }

  return sections.join('\n\n') + '\n';
}

// #endregion
