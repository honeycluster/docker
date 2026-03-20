import type { XrpldInput } from '../types/xrpld-input.js';

// #region -- Parser -----------------------------------

/**
 * Parse a JSON string into a Partial<XrpldInput>.
 * Accepts nested structure directly — no flattening.
 * @param content - Raw JSON string representing xrpld configuration
 * @returns Parsed configuration as Partial<XrpldInput>
 * @throws JsonParseException if JSON is invalid or not an object
 */
export function parseJsonFile(content: string): Partial<XrpldInput> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new JsonParseException(`Invalid JSON: ${msg}`);
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new JsonParseException(`Expected a JSON object at root, got ${Array.isArray(parsed) ? 'array' : typeof parsed}`);
  }

  return parsed as Partial<XrpldInput>;
}

// #endregion -- Parser --------------------------------

// #region -- Errors -----------------------------------

export class JsonParseException extends Error {
  public readonly path?: string;

  constructor(message: string, path?: string) {
    const prefix = path ? `At ${path}: ` : '';
    super(`${prefix}${message}`);
    this.name = 'JsonParseException';
    this.path = path;
  }
}

// #endregion -- Errors --------------------------------
