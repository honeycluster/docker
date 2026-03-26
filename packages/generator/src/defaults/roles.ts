import type { NodeRole, XrpldInput } from '../types/xrpld-input.js';

// #region -- Role Preset Defaults -------------------------

export const VALID_ROLES: ReadonlySet<string> = new Set<string>([
  'stock',
  'validator',
  'ephemeral',
  'sentry',
  'clio',
  'feature',
  'hub',
]);

const ROLE_MAP: Record<NodeRole, Partial<XrpldInput>> = {
  stock: {},
  validator: {
    peer_private: '1',
    server: {
      ports: [
        { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
        {
          name: 'port_rpc_admin_local',
          port: 5006,
          ip: '127.0.0.1',
          admin: '127.0.0.1',
          protocol: 'http',
        },
        {
          name: 'port_ws_admin_local',
          port: 6006,
          ip: '127.0.0.1',
          admin: '127.0.0.1',
          protocol: 'ws',
        },
      ],
    },
  },
  ephemeral: {},
  sentry: {
    peer_private: '0',
  },
  clio: {
    ledger_history: 'full',
    server: {
      ports: [
        { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
        {
          name: 'port_rpc',
          port: 5005,
          ip: '0.0.0.0',
          protocol: 'http,https',
        },
        {
          name: 'port_rpc_admin_local',
          port: 5006,
          ip: '127.0.0.1',
          admin: '127.0.0.1',
          protocol: 'http',
        },
        {
          name: 'port_wss',
          port: 6005,
          ip: '0.0.0.0',
          protocol: 'ws,wss',
        },
        {
          name: 'port_ws_admin_local',
          port: 6006,
          ip: '127.0.0.1',
          admin: '127.0.0.1',
          protocol: 'ws',
        },
        {
          name: 'port_grpc',
          port: 50051,
          ip: '0.0.0.0',
          protocol: 'grpc',
          secure_gateway: '0.0.0.0',
        },
      ],
    },
  },
  feature: {
    amendment_majority_time: '5 minutes',
  },
  hub: {
    peer_private: '0',
  },
};

/**
 * Get role-specific default configuration values.
 * @param role - Target node role
 * @returns Partial XrpldInput with role-specific defaults (ports, peer_private, etc.)
 */
export function getRoleDefaults(role: NodeRole): Partial<XrpldInput> {
  return ROLE_MAP[role];
}

// #endregion -- Role Preset Defaults ----------------------
