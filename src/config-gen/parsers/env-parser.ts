// #region Types

export interface EnvParseError {
  line: number;
  message: string;
}

// #endregion

// #region Parser

/**
 * Parse a .env file string into key-value pairs.
 * Supports: KEY=VALUE, comments (#), blank lines, single/double quoted values.
 */
export function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i];
    const trimmed = raw.trim();

    // Skip blank lines and comments
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) {
      throw new EnvParseException(`Missing '=' in assignment`, lineNum);
    }

    const key = trimmed.slice(0, eqIndex).trim();
    if (key === '') {
      throw new EnvParseException(`Empty variable name`, lineNum);
    }

    // Validate key format (alphanumeric + underscore, starting with letter or underscore)
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      throw new EnvParseException(
        `Invalid variable name '${key}': must contain only letters, digits, and underscores`,
        lineNum,
      );
    }

    let value = trimmed.slice(eqIndex + 1);

    // Handle quoted values
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Strip inline comments (only for unquoted values)
    if (!trimmed.slice(eqIndex + 1).startsWith('"') && !trimmed.slice(eqIndex + 1).startsWith("'")) {
      const commentIndex = value.indexOf(' #');
      if (commentIndex !== -1) {
        value = value.slice(0, commentIndex).trimEnd();
      }
    }

    result[key] = value;
  }

  return result;
}

// #endregion

// #region Errors

export class EnvParseException extends Error {
  public readonly line: number;

  constructor(message: string, line: number) {
    super(`Line ${line}: ${message}`);
    this.name = 'EnvParseException';
    this.line = line;
  }
}

// #endregion
