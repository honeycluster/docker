// #region Types

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
  [key: string]: JsonValue;
}

// #endregion

// #region Parser

/**
 * Parse a JSON file string into flat key-value pairs.
 * Nested objects are flattened using underscore-separated uppercase keys.
 * e.g., { "ssl": { "certFile": "/path" } } -> { "SSL_CERT_FILE": "/path" }
 */
export function parseJsonFile(content: string): Record<string, string> {
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(content) as JsonValue;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new JsonParseException(`Invalid JSON: ${msg}`);
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new JsonParseException(`Expected a JSON object at root, got ${Array.isArray(parsed) ? 'array' : typeof parsed}`);
  }

  const result: Record<string, string> = {};
  flattenObject(parsed, '', result);
  return result;
}

// #endregion

// #region Helpers

function flattenObject(
  obj: JsonObject,
  prefix: string,
  result: Record<string, string>,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}_${toScreamingSnake(key)}` : toScreamingSnake(key);

    if (value === null) {
      result[fullKey] = '';
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value as JsonObject, fullKey, result);
    } else if (Array.isArray(value)) {
      result[fullKey] = JSON.stringify(value);
    } else {
      result[fullKey] = String(value);
    }
  }
}

/**
 * Convert a camelCase or PascalCase key to SCREAMING_SNAKE_CASE.
 * Keys already in SCREAMING_SNAKE_CASE pass through unchanged.
 */
function toScreamingSnake(key: string): string {
  // If already SCREAMING_SNAKE_CASE, return as-is
  if (/^[A-Z][A-Z0-9_]*$/.test(key)) {
    return key;
  }

  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toUpperCase();
}

// #endregion

// #region Errors

export class JsonParseException extends Error {
  public readonly path?: string;

  constructor(message: string, path?: string) {
    const prefix = path ? `At ${path}: ` : '';
    super(`${prefix}${message}`);
    this.name = 'JsonParseException';
    this.path = path;
  }
}

// #endregion
