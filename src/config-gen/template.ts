// #region Types

/**
 * Regex matching ${VAR} where VAR starts with uppercase letter,
 * followed by uppercase letters, digits, or underscores.
 * Matches the generate_var_list pattern from envsubst.sh.
 */
const VAR_PATTERN = /\$\{([A-Z][A-Z0-9_]*)\}/g;

/**
 * Pattern to collapse 3+ consecutive blank lines to 2.
 */
const EXCESSIVE_BLANK_LINES = /\n{4,}/g;

// #endregion

// #region Substitution

/**
 * Replaces ${VAR} placeholders in a template string with resolved values.
 * Unresolved variables are replaced with empty string (matching envsubst behavior).
 * Cleans up excessive blank lines from empty optional sections.
 */
export function substitute(
  template: string,
  vars: Record<string, string>,
): string {
  const result = template.replace(VAR_PATTERN, (_match, varName: string) => {
    return vars[varName] ?? '';
  });

  // Collapse 3+ consecutive blank lines to 2 (cleans up empty sections)
  return result.replace(EXCESSIVE_BLANK_LINES, '\n\n\n');
}

// #endregion
