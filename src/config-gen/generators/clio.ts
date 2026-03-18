// #region Template

/**
 * config.json template — bundled from src/clio/etc/config.json.
 * Uses ${VAR} placeholders substituted by the template engine.
 */
const CLIO_TEMPLATE = `{
    "database": {
        "type": "\${DATABASE_TYPE}",
        "cassandra": {
            "contact_points": "\${CASSANDRA_CONTACT_POINTS}",
            "port": \${CASSANDRA_PORT},
            "keyspace": "\${CASSANDRA_KEYSPACE}",
            "replication_factor": \${CASSANDRA_REPLICATION_FACTOR},
            "table_prefix": "\${CASSANDRA_TABLE_PREFIX}",
            "max_write_requests_outstanding": \${CASSANDRA_MAX_WRITE_REQUESTS_OUTSTANDING},
            "max_read_requests_outstanding": \${CASSANDRA_MAX_READ_REQUESTS_OUTSTANDING},
            "threads": \${CASSANDRA_THREADS},
            "core_connections_per_host": \${CASSANDRA_CORE_CONNECTIONS_PER_HOST},
            "write_batch_size": \${CASSANDRA_WRITE_BATCH_SIZE},
            "username": "\${CASSANDRA_USERNAME}",
            "password": "\${CASSANDRA_PASSWORD}"
        }
    },
    "allow_no_etl": \${ALLOW_NO_ETL},
    "etl_sources": [
        {
            "ip": "\${ETL_SOURCE_IP}",
            "ws_port": "\${ETL_SOURCE_WS_PORT}",
            "grpc_port": "\${ETL_SOURCE_GRPC_PORT}"
        }
    ],
    "forwarding": {
        "cache_timeout": \${FORWARDING_CACHE_TIMEOUT},
        "request_timeout": \${FORWARDING_REQUEST_TIMEOUT}
    },
    "rpc": {
        "cache_timeout": \${RPC_CACHE_TIMEOUT}
    },
    "dos_guard": {
        "whitelist": [
            "127.0.0.1"
        ],
        "max_fetches": \${DOS_GUARD_MAX_FETCHES},
        "max_connections": \${DOS_GUARD_MAX_CONNECTIONS},
        "max_requests": \${DOS_GUARD_MAX_REQUESTS},
        "sweep_interval": \${DOS_GUARD_SWEEP_INTERVAL}
    },
    "server": {
        "ip": "\${SERVER_IP}",
        "port": \${SERVER_PORT},
        "max_queue_size": \${SERVER_MAX_QUEUE_SIZE},
        "admin_password": "\${SERVER_ADMIN_PASSWORD}",
        "local_admin": \${SERVER_LOCAL_ADMIN},
        "processing_policy": "\${SERVER_PROCESSING_POLICY}",
        "parallel_requests_limit": \${SERVER_PARALLEL_REQUESTS_LIMIT},
        "ws_max_sending_queue_size": \${SERVER_WS_MAX_SENDING_QUEUE_SIZE},
        "proxy": {
            "ips": [],
            "tokens": []
        }
    },
    "graceful_period": \${GRACEFUL_PERIOD},
    "workers": \${WORKERS},
    "log": {
        "channels": [
            {"channel": "Backend", "level": "fatal"},
            {"channel": "WebServer", "level": "info"},
            {"channel": "Subscriptions", "level": "info"},
            {"channel": "RPC", "level": "error"},
            {"channel": "ETL", "level": "debug"},
            {"channel": "Performance", "level": "trace"}
        ],
        "level": "\${LOG_LEVEL}",
        "format": "%Y-%m-%d %H:%M:%S.%f %^%3!l:%n%$ - %v",
        "is_async": true,
        "enable_console": \${LOG_ENABLE_CONSOLE},
        "rotation_size": \${LOG_ROTATION_SIZE},
        "directory_max_files": \${LOG_DIRECTORY_MAX_FILES},
        "tag_style": "\${LOG_TAG_STYLE}",
        "directory": "\${LOG_DIRECTORY}"
    },
    "cache": {
        "num_diffs": \${CACHE_NUM_DIFFS},
        "num_markers": \${CACHE_NUM_MARKERS},
        "page_fetch_size": \${CACHE_PAGE_FETCH_SIZE},
        "load": "\${CACHE_LOAD}",
        "file": {
            "path": "\${CACHE_FILE_PATH}",
            "max_sequence_age": \${CACHE_FILE_MAX_SEQUENCE_AGE}
        }
    },
    "prometheus": {
        "enabled": \${PROMETHEUS_ENABLED},
        "compress_reply": \${PROMETHEUS_COMPRESS_REPLY}
    },
    "extractor_threads": \${EXTRACTOR_THREADS},
    "read_only": \${READ_ONLY},
    "api_version": {
        "min": \${API_VERSION_MIN},
        "max": \${API_VERSION_MAX},
        "default": \${API_VERSION_DEFAULT}
    },
    "ssl_cert_file": "\${SSL_CERT_FILE}",
    "ssl_key_file": "\${SSL_KEY_FILE}"
}`;

// #endregion

// #region Generator

import { getClioDefaults } from '../defaults/clio.js';
import { validateClioInputs, type ValidationError } from '../validation.js';
import { substitute } from '../template.js';

export interface ClioGeneratorResult {
  config: string;
  warnings: string[];
}

/**
 * Generates a valid Clio config.json from input overrides.
 * Pipeline: load defaults -> merge overrides -> compute derived -> validate -> substitute template.
 *
 * @throws Error if validation produces errors
 */
export function generateClioConfig(
  overrides: Record<string, string> = {},
): ClioGeneratorResult {
  // 1. Load defaults merged with overrides (handles SSL-derived computation)
  const resolved = getClioDefaults(overrides);

  // 2. Validate
  const validation = validateClioInputs(
    resolved as unknown as Record<string, string | undefined>,
  );
  if (validation.errors.length > 0) {
    const messages = validation.errors
      .map((e: ValidationError) => `${e.field}: ${e.message} (got: ${e.value})`)
      .join('\n');
    throw new Error(`Clio config validation failed:\n${messages}`);
  }

  // 3. Substitute template
  const vars: Record<string, string> = { ...resolved };
  const config = substitute(CLIO_TEMPLATE, vars);

  // 4. Collect warnings
  const warnings = validation.warnings.map(
    (w: ValidationError) => `${w.field}: ${w.message}`,
  );

  return { config, warnings };
}

// #endregion
