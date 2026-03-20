import type { XrpldInput, XrpldPortConfig } from '../types/xrpld-input.js';

// #region -- Section Type Mappings --------------------

type SectionType = 'single-value' | 'key-value' | 'list' | 'server' | 'port';

const SINGLE_VALUE_SECTIONS: ReadonlyArray<string> = [
  'debug_logfile',
  'database_path',
  'ssl_verify',
  'node_size',
  'ledger_history',
  'fetch_depth',
  'peer_private',
  'network_id',
  'network_quorum',
  'fee_default',
  'workers',
  'io_workers',
  'prefetch_workers',
  'sweep_interval',
  'path_search',
  'path_search_old',
  'path_search_fast',
  'path_search_max',
  'peers_max',
  'peers_in_max',
  'peers_out_max',
  'max_transactions',
  'compression',
  'signing_support',
  'beta_rpc_api',
  'ledger_replay',
  'websocket_ping_frequency',
  'server_domain',
  'elb_support',
  'amendment_majority_time',
  'rpc_allow_remote',
  'ssl_verify_file',
  'ssl_verify_dir',
  'validators_file',
  'validation_seed',
  'validator_token',
  'validator_key_revocation',
  'node_seed',
  'relay_proposals',
  'relay_validations',
];

const KEY_VALUE_SECTIONS: ReadonlyArray<string> = [
  'node_db',
  'overlay',
  'transaction_queue',
  'voting',
  'crawl',
  'vl',
  'reduce_relay',
  'insight',
  'perf',
  'sqlite',
  'import_db',
];

const LIST_SECTIONS: ReadonlyArray<string> = [
  'sntp_servers',
  'ips',
  'ips_fixed',
  'cluster_nodes',
  'amendments',
  'veto_amendments',
  'rpc_startup',
];

function getSectionType(name: string, portNames: ReadonlyArray<string>): SectionType {
  if (name === 'server') return 'server';
  if (portNames.includes(name)) return 'port';
  if (SINGLE_VALUE_SECTIONS.includes(name)) return 'single-value';
  if (KEY_VALUE_SECTIONS.includes(name)) return 'key-value';
  if (LIST_SECTIONS.includes(name)) return 'list';
  // Unknown sections default to key-value if they have = signs, otherwise list
  return 'key-value';
}

// #endregion -- Section Type Mappings -----------------

// #region -- Line Parsing Helpers ---------------------

function isComment(line: string): boolean {
  return line.trimStart().startsWith('#');
}

function isBlank(line: string): boolean {
  return line.trim().length === 0;
}

function isSectionHeader(line: string): { name: string } | null {
  const match = line.trim().match(/^\[([^\]]+)\]$/);
  if (match) return { name: match[1] };
  return null;
}

function parseKeyValue(line: string): { key: string; value: string } | null {
  const eqIndex = line.indexOf('=');
  if (eqIndex === -1) return null;
  const key = line.substring(0, eqIndex).trim();
  const value = line.substring(eqIndex + 1).trim();
  if (key.length === 0) return null;
  return { key, value };
}

// #endregion -- Line Parsing Helpers ------------------

// #region -- Section Collectors -----------------------

interface RawSection {
  readonly name: string;
  readonly lines: ReadonlyArray<string>;
}

function collectSections(content: string): ReadonlyArray<RawSection> {
  const lines = content.split(/\r?\n/);
  const sections: RawSection[] = [];
  let currentName: string | null = null;
  let currentLines: string[] = [];

  for (const line of lines) {
    if (isComment(line) || isBlank(line)) continue;

    const header = isSectionHeader(line);
    if (header) {
      if (currentName !== null) {
        sections.push({ name: currentName, lines: currentLines });
      }
      currentName = header.name;
      currentLines = [];
    } else if (currentName !== null) {
      currentLines.push(line.trim());
    }
  }

  if (currentName !== null) {
    sections.push({ name: currentName, lines: currentLines });
  }

  return sections;
}

// #endregion -- Section Collectors --------------------

// #region -- Value Coercion ---------------------------

function tryParseNumber(value: string): number | string {
  if (/^-?\d+$/.test(value)) return parseInt(value, 10);
  return value;
}

// #endregion -- Value Coercion ------------------------

// #region -- Port Parsing -----------------------------

function parsePortSection(name: string, lines: ReadonlyArray<string>): XrpldPortConfig {
  const port: Record<string, unknown> = { name };

  for (const line of lines) {
    const kv = parseKeyValue(line);
    if (kv) {
      const coerced = tryParseNumber(kv.value);
      port[kv.key] = coerced;
    }
  }

  return port as unknown as XrpldPortConfig;
}

// #endregion -- Port Parsing --------------------------

// #region -- Main Parser ------------------------------

/**
 * Parse an xrpld.cfg file string into an XrpldInput object.
 * Handles section headers, key=value pairs, single-value sections, lists, and port definitions.
 * @param content - Raw xrpld.cfg file content
 * @returns Parsed configuration as XrpldInput
 */
export function parseCfgFile(content: string): XrpldInput {
  const rawSections = collectSections(content);

  // First pass: find port names from [server] section
  const portNames: string[] = [];
  for (const section of rawSections) {
    if (section.name === 'server') {
      for (const line of section.lines) {
        const kv = parseKeyValue(line);
        if (!kv) {
          // Plain line = port name
          portNames.push(line);
        }
      }
    }
  }

  const result: Record<string, unknown> = {};
  const ports: XrpldPortConfig[] = [];

  for (const section of rawSections) {
    const sectionType = getSectionType(section.name, portNames);

    switch (sectionType) {
      case 'server':
        // Already processed for port names
        break;

      case 'port':
        ports.push(parsePortSection(section.name, section.lines));
        break;

      case 'single-value': {
        // Single value = first non-empty line
        const value = section.lines[0];
        if (value !== undefined) {
          result[section.name] = tryParseNumber(value);
        }
        break;
      }

      case 'key-value': {
        const obj: Record<string, unknown> = {};
        for (const line of section.lines) {
          const kv = parseKeyValue(line);
          if (kv) {
            obj[kv.key] = tryParseNumber(kv.value);
          }
        }
        if (Object.keys(obj).length > 0) {
          result[section.name] = obj;
        }
        break;
      }

      case 'list': {
        const items: unknown[] = [];
        for (const line of section.lines) {
          if (section.name === 'rpc_startup') {
            try {
              items.push(JSON.parse(line) as Record<string, string>);
            } catch {
              items.push(line);
            }
          } else {
            items.push(line);
          }
        }
        if (items.length > 0) {
          result[section.name] = items;
        }
        break;
      }
    }
  }

  if (ports.length > 0) {
    result.server = { ports };
  }

  return result as unknown as XrpldInput;
}

// #endregion -- Main Parser ---------------------------
