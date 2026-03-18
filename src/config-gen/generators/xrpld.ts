// #region Template

/**
 * xrpld.cfg template — bundled from src/xrpld/etc/xrpld.cfg.
 * Uses ${VAR} placeholders substituted by the template engine.
 */
const XRPLD_TEMPLATE = `# This is the configuration for rippled.
# Do not edit by hand; it is generated from an envsubst template.
# Source defaults from: scripts/config/defaults.sh

[server]
port_peer
port_rpc
port_wss
port_grpc
port_rpc_admin_local
port_wss_admin_local

\${SSL_LINES}

[port_peer]
port = \${PORT_PEER}
ip = 0.0.0.0
protocol = peer

[port_rpc]
port = \${PORT_RPC}
ip = 0.0.0.0
protocol = \${PORT_RPC_PROTOCOL}

[port_wss]
port = \${PORT_WSS}
ip = 0.0.0.0
protocol = \${PORT_WSS_PROTOCOL}

[port_grpc]
port = \${PORT_GRPC}
ip = 0.0.0.0
secure_gateway = 127.0.0.1
admin = \${ADMIN_IPS}

[port_rpc_admin_local]
port = \${PORT_RPC_ADMIN_LOCAL}
ip = 0.0.0.0
protocol = http
admin = \${ADMIN_IPS}

[port_wss_admin_local]
port = \${PORT_WSS_ADMIN_LOCAL}
ip = 0.0.0.0
protocol = ws
admin = \${ADMIN_IPS}

\${NODE_SIZE_SECTION}

[debug_logfile]
\${DEBUG_LOGFILE}

\${VALIDATION_QUORUM_SECTION}

\${PEERS_MAX_SECTION}

[fetch_depth]
\${FETCH_DEPTH}

[ledger_history]
\${LEDGER_HISTORY}

[ssl_verify]
\${SSL_VERIFY}

[sntp_servers]
\${SNTP_SERVERS}

[rpc_allow_remote]
1

[node_db]
type = \${NODE_DB_TYPE}
\${NODE_DB_OPTIONS}

[database_path]
\${DATABASE_PATH_FULL}

\${LEDGER_TX_TABLES_SECTION}

[rpc_startup]
\${RPC_STARTUP_CMDS}

\${VALIDATION_SEED_SECTION}

[peer_private]
\${PEER_PRIVATE}

\${VALIDATORS_SITE_SECTION}

[validators_file]
\${VALIDATORS_FILE}

[network_id]
\${NETWORK_ID}

\${IPS_SECTION}

\${IPS_FIXED_SECTION}

\${REPORTING_SECTION}
`;

// #endregion

// #region Generator

import { getXrpldDefaults } from '../defaults/xrpld.js';
import { validateXrpldInputs, type ValidationError } from '../validation.js';
import { substitute } from '../template.js';

export interface XrpldGeneratorResult {
  config: string;
  warnings: string[];
}

/**
 * Generates a valid xrpld.cfg from input overrides.
 * Pipeline: load defaults -> merge overrides -> compute derived -> validate -> substitute template.
 *
 * @throws Error if validation produces errors
 */
export function generateXrpldConfig(
  overrides: Record<string, string> = {},
): XrpldGeneratorResult {
  // 1. Load defaults merged with overrides (handles network/size/SSL derived computation)
  const resolved = getXrpldDefaults(overrides);

  // 2. Validate
  const validation = validateXrpldInputs(
    resolved as unknown as Record<string, string | undefined>,
  );
  if (validation.errors.length > 0) {
    const messages = validation.errors
      .map((e: ValidationError) => `${e.field}: ${e.message} (got: ${e.value})`)
      .join('\n');
    throw new Error(`xrpld config validation failed:\n${messages}`);
  }

  // 3. Substitute template
  const vars: Record<string, string> = { ...resolved };
  const config = substitute(XRPLD_TEMPLATE, vars);

  // 4. Collect warnings
  const warnings = validation.warnings.map(
    (w: ValidationError) => `${w.field}: ${w.message}`,
  );

  return { config, warnings };
}

// #endregion
