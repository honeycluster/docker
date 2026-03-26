import type { XrpldInput } from '../types/xrpld-input.js';

// #region -- Validators.txt Generator -----------------

/**
 * Generate validators.txt content from a resolved xrpld configuration.
 * Includes [validator_list_sites], [validator_list_keys], and [validators] sections.
 * @param config - Resolved xrpld configuration
 * @returns validators.txt file content as a string
 */
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
    const sources = config.vl?.validator_list_key_sources;
    const keyLines = keys.map((key, i) => {
      const source = sources?.[i];
      return source ? `#${source}\n${key}` : key;
    });
    sections.push(`[validator_list_keys]\n${keyLines.join('\n')}`);
  }

  // [validators]
  const validators = config.validators;
  if (validators && validators.length > 0) {
    sections.push(`[validators]\n${validators.join('\n')}`);
  }

  return sections.join('\n\n') + '\n';
}

// #endregion -- Validators.txt Generator --------------
