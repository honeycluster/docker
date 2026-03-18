import { describe, it, expect } from 'vitest';
import { substitute } from '../template.js';

describe('substitute', () => {
  // #region Simple substitution

  it('replaces a single variable', () => {
    expect(substitute('Hello ${NAME}!', { NAME: 'World' })).toBe(
      'Hello World!',
    );
  });

  it('replaces multiple different variables', () => {
    const template = '${HOST}:${PORT}';
    const vars = { HOST: 'localhost', PORT: '8080' };
    expect(substitute(template, vars)).toBe('localhost:8080');
  });

  it('replaces the same variable multiple times', () => {
    const template = '${VAR} and ${VAR}';
    expect(substitute(template, { VAR: 'x' })).toBe('x and x');
  });

  it('returns template unchanged when no variables present', () => {
    expect(substitute('no variables here', { FOO: 'bar' })).toBe(
      'no variables here',
    );
  });

  it('handles empty template', () => {
    expect(substitute('', { FOO: 'bar' })).toBe('');
  });

  it('handles empty vars', () => {
    expect(substitute('Hello ${NAME}!', {})).toBe('Hello !');
  });

  // #endregion

  // #region Missing variables

  it('replaces unresolved variables with empty string', () => {
    expect(substitute('${MISSING}', {})).toBe('');
  });

  it('replaces mix of resolved and unresolved variables', () => {
    const template = '${A}-${B}-${C}';
    expect(substitute(template, { A: '1', C: '3' })).toBe('1--3');
  });

  // #endregion

  // #region Variable name validation

  it('does not replace lowercase variable names', () => {
    expect(substitute('${foo}', { foo: 'bar' })).toBe('${foo}');
  });

  it('does not replace variables starting with a digit', () => {
    expect(substitute('${1VAR}', { '1VAR': 'val' })).toBe('${1VAR}');
  });

  it('replaces variables with digits after first letter', () => {
    expect(substitute('${PORT1}', { PORT1: '8080' })).toBe('8080');
  });

  it('replaces variables with underscores', () => {
    expect(substitute('${MY_VAR}', { MY_VAR: 'val' })).toBe('val');
  });

  it('does not replace $VAR without braces', () => {
    expect(substitute('$VAR', { VAR: 'val' })).toBe('$VAR');
  });

  // #endregion

  // #region Multi-line section variables

  it('handles multi-line values (section variables)', () => {
    const template = '[node_size]\n${NODE_SIZE_SECTION}\n[next]';
    const vars = {
      NODE_SIZE_SECTION: 'node_size=medium\nledger_history=1024',
    };
    expect(substitute(template, vars)).toBe(
      '[node_size]\nnode_size=medium\nledger_history=1024\n[next]',
    );
  });

  it('handles multi-line SSL_LINES variable', () => {
    const template = '[ssl]\n${SSL_LINES}\n[end]';
    const vars = {
      SSL_LINES: 'ssl_cert=/path/cert.pem\nssl_key=/path/key.pem',
    };
    expect(substitute(template, vars)).toBe(
      '[ssl]\nssl_cert=/path/cert.pem\nssl_key=/path/key.pem\n[end]',
    );
  });

  // #endregion

  // #region Empty sections cleanup

  it('collapses 3+ consecutive blank lines to 2', () => {
    const template = 'before\n\n\n\nafter';
    expect(substitute(template, {})).toBe('before\n\n\nafter');
  });

  it('collapses many blank lines from empty sections', () => {
    const template = '[section1]\n${OPT_A}\n\n\n\n\n[section2]';
    expect(substitute(template, {})).toBe('[section1]\n\n\n[section2]');
  });

  it('preserves 2 consecutive blank lines', () => {
    const template = 'a\n\n\nb';
    expect(substitute(template, {})).toBe('a\n\n\nb');
  });

  it('preserves single blank line', () => {
    const template = 'a\n\nb';
    expect(substitute(template, {})).toBe('a\n\nb');
  });

  // #endregion

  // #region Real-world patterns

  it('handles a realistic xrpld config snippet', () => {
    const template = `[server]
port_rpc_admin_local
port_peer
port_ws_admin_local

[port_rpc_admin_local]
port = \${PORT_RPC}
ip = 0.0.0.0
admin = 127.0.0.1
protocol = \${PORT_RPC_PROTOCOL}

\${VALIDATION_SEED_SECTION}

[node_db]
type=NuDB
path=/var/lib/rippled/db/nudb
\${NODE_DB_OPTIONS}`;

    const vars = {
      PORT_RPC: '5005',
      PORT_RPC_PROTOCOL: 'http',
      VALIDATION_SEED_SECTION: '',
      NODE_DB_OPTIONS:
        'advisory_delete=1\nonline_delete=512\nledger_history=512',
    };

    const result = substitute(template, vars);
    expect(result).toContain('port = 5005');
    expect(result).toContain('protocol = http');
    expect(result).toContain('advisory_delete=1');
    // Empty VALIDATION_SEED_SECTION should not leave excessive blank lines
    expect(result).not.toMatch(/\n{4,}/);
  });

  // #endregion
});
