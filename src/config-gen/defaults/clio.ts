// #region Types

export interface ClioConfig {
  // Paths
  CONFIG_DIR: string;
  CONFIG_FILE: string;

  // SSL input variables
  CLIO_CERTS_DIR: string;
  SSL_GENERATE: string;
  SSL_GENERATE_OVERWRITE: string;
  SSL_CERT_CN: string;
  SSL_CERT_DAYS: string;
  SSL_CERT_SUBJ: string;
  SSL_CHAIN_ENABLED: string;
  SSL_CERT_PATH: string;

  // SSL-derived (computed by buildClioSslDerived)
  SSL_CERT_FILE: string;
  SSL_KEY_FILE: string;

  // Database
  DATABASE_TYPE: string;
  CASSANDRA_CONTACT_POINTS: string;
  CASSANDRA_PORT: string;
  CASSANDRA_KEYSPACE: string;
  CASSANDRA_REPLICATION_FACTOR: string;
  CASSANDRA_TABLE_PREFIX: string;
  CASSANDRA_MAX_WRITE_REQUESTS_OUTSTANDING: string;
  CASSANDRA_MAX_READ_REQUESTS_OUTSTANDING: string;
  CASSANDRA_THREADS: string;
  CASSANDRA_PROVIDER: string;
  CASSANDRA_CORE_CONNECTIONS_PER_HOST: string;
  CASSANDRA_WRITE_BATCH_SIZE: string;
  CASSANDRA_USERNAME: string;
  CASSANDRA_PASSWORD: string;

  // ETL Sources
  ETL_SOURCE_IP: string;
  ETL_SOURCE_WS_PORT: string;
  ETL_SOURCE_GRPC_PORT: string;

  // Server
  SERVER_IP: string;
  SERVER_PORT: string;
  SERVER_MAX_QUEUE_SIZE: string;
  SERVER_ADMIN_PASSWORD: string;
  SERVER_LOCAL_ADMIN: string;
  SERVER_PROCESSING_POLICY: string;
  SERVER_PARALLEL_REQUESTS_LIMIT: string;
  SERVER_WS_MAX_SENDING_QUEUE_SIZE: string;

  // Forwarding / RPC / DoS Guard / Workers
  ALLOW_NO_ETL: string;
  FORWARDING_CACHE_TIMEOUT: string;
  FORWARDING_REQUEST_TIMEOUT: string;
  RPC_CACHE_TIMEOUT: string;
  DOS_GUARD_MAX_FETCHES: string;
  DOS_GUARD_MAX_CONNECTIONS: string;
  DOS_GUARD_MAX_REQUESTS: string;
  DOS_GUARD_SWEEP_INTERVAL: string;
  WORKERS: string;
  GRACEFUL_PERIOD: string;

  // Logging
  LOG_LEVEL: string;
  LOG_ENABLE_CONSOLE: string;
  LOG_DIRECTORY: string;
  LOG_ROTATION_SIZE: string;
  LOG_DIRECTORY_MAX_FILES: string;
  LOG_TAG_STYLE: string;

  // Cache
  CACHE_NUM_DIFFS: string;
  CACHE_NUM_MARKERS: string;
  CACHE_PAGE_FETCH_SIZE: string;
  CACHE_LOAD: string;
  CACHE_FILE_PATH: string;
  CACHE_FILE_MAX_SEQUENCE_AGE: string;

  // Prometheus / Extractor / Read-only / API Version
  PROMETHEUS_ENABLED: string;
  PROMETHEUS_COMPRESS_REPLY: string;
  EXTRACTOR_THREADS: string;
  READ_ONLY: string;
  API_VERSION_DEFAULT: string;
  API_VERSION_MIN: string;
  API_VERSION_MAX: string;
}

// #endregion

// #region SSL Derived

export interface ClioSslDerived {
  SSL_CERT_FILE: string;
  SSL_KEY_FILE: string;
}

export function buildClioSslDerived(sslCertPath: string): ClioSslDerived {
  if (sslCertPath) {
    return {
      SSL_CERT_FILE: `${sslCertPath}/clio.crt`,
      SSL_KEY_FILE: `${sslCertPath}/clio.pem`,
    };
  }
  return {
    SSL_CERT_FILE: '',
    SSL_KEY_FILE: '',
  };
}

// #endregion

// #region Default Config Builder

export function getClioDefaults(
  overrides: Partial<Record<string, string>> = {}
): ClioConfig {
  const configDir = overrides.CONFIG_DIR || '/opt/clio';
  const sslCertPath = overrides.SSL_CERT_PATH || '';

  // SSL-derived
  const ssl = buildClioSslDerived(sslCertPath);

  return {
    // Paths
    CONFIG_DIR: configDir,
    CONFIG_FILE: overrides.CONFIG_FILE || `${configDir}/etc/config.json`,

    // SSL inputs
    CLIO_CERTS_DIR: overrides.CLIO_CERTS_DIR || `${configDir}/certs`,
    SSL_GENERATE: overrides.SSL_GENERATE || '0',
    SSL_GENERATE_OVERWRITE: overrides.SSL_GENERATE_OVERWRITE || '0',
    SSL_CERT_CN: overrides.SSL_CERT_CN || 'localhost',
    SSL_CERT_DAYS: overrides.SSL_CERT_DAYS || '365',
    SSL_CERT_SUBJ: overrides.SSL_CERT_SUBJ || '',
    SSL_CHAIN_ENABLED: overrides.SSL_CHAIN_ENABLED || '0',
    SSL_CERT_PATH: sslCertPath,

    // SSL-derived
    SSL_CERT_FILE: ssl.SSL_CERT_FILE,
    SSL_KEY_FILE: ssl.SSL_KEY_FILE,

    // Database
    DATABASE_TYPE: overrides.DATABASE_TYPE || 'cassandra',
    CASSANDRA_CONTACT_POINTS:
      overrides.CASSANDRA_CONTACT_POINTS || '127.0.0.1',
    CASSANDRA_PORT: overrides.CASSANDRA_PORT || '9042',
    CASSANDRA_KEYSPACE: overrides.CASSANDRA_KEYSPACE || 'clio',
    CASSANDRA_REPLICATION_FACTOR:
      overrides.CASSANDRA_REPLICATION_FACTOR || '1',
    CASSANDRA_TABLE_PREFIX: overrides.CASSANDRA_TABLE_PREFIX || '',
    CASSANDRA_MAX_WRITE_REQUESTS_OUTSTANDING:
      overrides.CASSANDRA_MAX_WRITE_REQUESTS_OUTSTANDING || '25000',
    CASSANDRA_MAX_READ_REQUESTS_OUTSTANDING:
      overrides.CASSANDRA_MAX_READ_REQUESTS_OUTSTANDING || '30000',
    CASSANDRA_THREADS: overrides.CASSANDRA_THREADS || '8',
    CASSANDRA_PROVIDER: overrides.CASSANDRA_PROVIDER || 'cassandra',
    CASSANDRA_CORE_CONNECTIONS_PER_HOST:
      overrides.CASSANDRA_CORE_CONNECTIONS_PER_HOST || '1',
    CASSANDRA_WRITE_BATCH_SIZE:
      overrides.CASSANDRA_WRITE_BATCH_SIZE || '20',
    CASSANDRA_USERNAME: overrides.CASSANDRA_USERNAME || '',
    CASSANDRA_PASSWORD: overrides.CASSANDRA_PASSWORD || '',

    // ETL Sources
    ETL_SOURCE_IP: overrides.ETL_SOURCE_IP || '127.0.0.1',
    ETL_SOURCE_WS_PORT: overrides.ETL_SOURCE_WS_PORT || '6006',
    ETL_SOURCE_GRPC_PORT: overrides.ETL_SOURCE_GRPC_PORT || '50051',

    // Server
    SERVER_IP: overrides.SERVER_IP || '0.0.0.0',
    SERVER_PORT: overrides.SERVER_PORT || '51233',
    SERVER_MAX_QUEUE_SIZE: overrides.SERVER_MAX_QUEUE_SIZE || '500',
    SERVER_ADMIN_PASSWORD: overrides.SERVER_ADMIN_PASSWORD || '',
    SERVER_LOCAL_ADMIN: overrides.SERVER_LOCAL_ADMIN || 'false',
    SERVER_PROCESSING_POLICY:
      overrides.SERVER_PROCESSING_POLICY || 'parallel',
    SERVER_PARALLEL_REQUESTS_LIMIT:
      overrides.SERVER_PARALLEL_REQUESTS_LIMIT || '10',
    SERVER_WS_MAX_SENDING_QUEUE_SIZE:
      overrides.SERVER_WS_MAX_SENDING_QUEUE_SIZE || '1500',

    // Forwarding / RPC / DoS Guard / Workers
    ALLOW_NO_ETL: overrides.ALLOW_NO_ETL || 'false',
    FORWARDING_CACHE_TIMEOUT:
      overrides.FORWARDING_CACHE_TIMEOUT || '0.25',
    FORWARDING_REQUEST_TIMEOUT:
      overrides.FORWARDING_REQUEST_TIMEOUT || '10.0',
    RPC_CACHE_TIMEOUT: overrides.RPC_CACHE_TIMEOUT || '0.5',
    DOS_GUARD_MAX_FETCHES: overrides.DOS_GUARD_MAX_FETCHES || '1000000',
    DOS_GUARD_MAX_CONNECTIONS:
      overrides.DOS_GUARD_MAX_CONNECTIONS || '20',
    DOS_GUARD_MAX_REQUESTS: overrides.DOS_GUARD_MAX_REQUESTS || '20',
    DOS_GUARD_SWEEP_INTERVAL:
      overrides.DOS_GUARD_SWEEP_INTERVAL || '1',
    WORKERS: overrides.WORKERS || '8',
    GRACEFUL_PERIOD: overrides.GRACEFUL_PERIOD || '10.0',

    // Logging
    LOG_LEVEL: overrides.LOG_LEVEL || 'info',
    LOG_ENABLE_CONSOLE: overrides.LOG_ENABLE_CONSOLE || 'true',
    LOG_DIRECTORY: overrides.LOG_DIRECTORY || '/opt/clio/log',
    LOG_ROTATION_SIZE: overrides.LOG_ROTATION_SIZE || '2048',
    LOG_DIRECTORY_MAX_FILES: overrides.LOG_DIRECTORY_MAX_FILES || '25',
    LOG_TAG_STYLE: overrides.LOG_TAG_STYLE || 'uint',

    // Cache
    CACHE_NUM_DIFFS: overrides.CACHE_NUM_DIFFS || '32',
    CACHE_NUM_MARKERS: overrides.CACHE_NUM_MARKERS || '48',
    CACHE_PAGE_FETCH_SIZE: overrides.CACHE_PAGE_FETCH_SIZE || '512',
    CACHE_LOAD: overrides.CACHE_LOAD || 'async',
    CACHE_FILE_PATH: overrides.CACHE_FILE_PATH || './cache.bin',
    CACHE_FILE_MAX_SEQUENCE_AGE:
      overrides.CACHE_FILE_MAX_SEQUENCE_AGE || '5000',

    // Prometheus / Extractor / Read-only / API Version
    PROMETHEUS_ENABLED: overrides.PROMETHEUS_ENABLED || 'true',
    PROMETHEUS_COMPRESS_REPLY:
      overrides.PROMETHEUS_COMPRESS_REPLY || 'true',
    EXTRACTOR_THREADS: overrides.EXTRACTOR_THREADS || '8',
    READ_ONLY: overrides.READ_ONLY || 'false',
    API_VERSION_DEFAULT: overrides.API_VERSION_DEFAULT || '1',
    API_VERSION_MIN: overrides.API_VERSION_MIN || '1',
    API_VERSION_MAX: overrides.API_VERSION_MAX || '2',
  };
}

// #endregion
