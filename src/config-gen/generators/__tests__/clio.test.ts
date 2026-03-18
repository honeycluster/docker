import { describe, it, expect } from 'vitest';
import { generateClioConfig } from '../clio.js';

describe('generateClioConfig', () => {
  // #region Default config

  it('generates a valid default config with no overrides', () => {
    const { config, warnings } = generateClioConfig();
    expect(warnings).toEqual([]);

    // Should be valid JSON
    const parsed = JSON.parse(config);

    // Check database defaults
    expect(parsed.database.type).toBe('cassandra');
    expect(parsed.database.cassandra.contact_points).toBe('127.0.0.1');
    expect(parsed.database.cassandra.port).toBe(9042);
    expect(parsed.database.cassandra.keyspace).toBe('clio');
    expect(parsed.database.cassandra.replication_factor).toBe(1);
    expect(parsed.database.cassandra.threads).toBe(8);

    // Check server defaults
    expect(parsed.server.ip).toBe('0.0.0.0');
    expect(parsed.server.port).toBe(51233);
    expect(parsed.server.processing_policy).toBe('parallel');
    expect(parsed.server.local_admin).toBe(false);

    // Check ETL defaults
    expect(parsed.etl_sources).toHaveLength(1);
    expect(parsed.etl_sources[0].ip).toBe('127.0.0.1');
    expect(parsed.etl_sources[0].ws_port).toBe('6006');
    expect(parsed.etl_sources[0].grpc_port).toBe('50051');

    // Check logging defaults
    expect(parsed.log.level).toBe('info');
    expect(parsed.log.enable_console).toBe(true);

    // Check other defaults
    expect(parsed.allow_no_etl).toBe(false);
    expect(parsed.prometheus.enabled).toBe(true);
    expect(parsed.read_only).toBe(false);
    expect(parsed.workers).toBe(8);
    expect(parsed.api_version.default).toBe(1);
  });

  // #endregion

  // #region Valid JSON output

  it('produces valid JSON output', () => {
    const { config } = generateClioConfig();
    expect(() => JSON.parse(config)).not.toThrow();
  });

  it('produces valid JSON with custom overrides', () => {
    const { config } = generateClioConfig({
      SERVER_PORT: '8080',
      CASSANDRA_KEYSPACE: 'my_clio',
      LOG_LEVEL: 'debug',
    });
    const parsed = JSON.parse(config);
    expect(parsed.server.port).toBe(8080);
    expect(parsed.database.cassandra.keyspace).toBe('my_clio');
    expect(parsed.log.level).toBe('debug');
  });

  // #endregion

  // #region SSL enabled/disabled

  it('generates config with SSL disabled (default, no cert path)', () => {
    const { config } = generateClioConfig();
    const parsed = JSON.parse(config);
    expect(parsed.ssl_cert_file).toBe('');
    expect(parsed.ssl_key_file).toBe('');
  });

  it('generates config with SSL enabled (cert path set)', () => {
    const { config } = generateClioConfig({
      SSL_CERT_PATH: '/opt/clio/certs',
    });
    const parsed = JSON.parse(config);
    expect(parsed.ssl_cert_file).toBe('/opt/clio/certs/clio.crt');
    expect(parsed.ssl_key_file).toBe('/opt/clio/certs/clio.pem');
  });

  // #endregion

  // #region Custom database settings

  it('applies custom Cassandra settings', () => {
    const { config } = generateClioConfig({
      CASSANDRA_CONTACT_POINTS: '10.0.0.1',
      CASSANDRA_PORT: '9043',
      CASSANDRA_KEYSPACE: 'production',
      CASSANDRA_REPLICATION_FACTOR: '3',
      CASSANDRA_THREADS: '16',
      CASSANDRA_USERNAME: 'admin',
      CASSANDRA_PASSWORD: 'secret',
    });
    const parsed = JSON.parse(config);
    expect(parsed.database.cassandra.contact_points).toBe('10.0.0.1');
    expect(parsed.database.cassandra.port).toBe(9043);
    expect(parsed.database.cassandra.keyspace).toBe('production');
    expect(parsed.database.cassandra.replication_factor).toBe(3);
    expect(parsed.database.cassandra.threads).toBe(16);
    expect(parsed.database.cassandra.username).toBe('admin');
    expect(parsed.database.cassandra.password).toBe('secret');
  });

  it('applies custom write batch and connection settings', () => {
    const { config } = generateClioConfig({
      CASSANDRA_WRITE_BATCH_SIZE: '50',
      CASSANDRA_CORE_CONNECTIONS_PER_HOST: '4',
      CASSANDRA_MAX_WRITE_REQUESTS_OUTSTANDING: '50000',
      CASSANDRA_MAX_READ_REQUESTS_OUTSTANDING: '60000',
    });
    const parsed = JSON.parse(config);
    expect(parsed.database.cassandra.write_batch_size).toBe(50);
    expect(parsed.database.cassandra.core_connections_per_host).toBe(4);
    expect(parsed.database.cassandra.max_write_requests_outstanding).toBe(50000);
    expect(parsed.database.cassandra.max_read_requests_outstanding).toBe(60000);
  });

  // #endregion

  // #region Custom ETL source

  it('applies custom ETL source settings', () => {
    const { config } = generateClioConfig({
      ETL_SOURCE_IP: '10.0.0.5',
      ETL_SOURCE_WS_PORT: '6010',
      ETL_SOURCE_GRPC_PORT: '50055',
    });
    const parsed = JSON.parse(config);
    expect(parsed.etl_sources[0].ip).toBe('10.0.0.5');
    expect(parsed.etl_sources[0].ws_port).toBe('6010');
    expect(parsed.etl_sources[0].grpc_port).toBe('50055');
  });

  // #endregion

  // #region Server settings

  it('applies custom server settings', () => {
    const { config } = generateClioConfig({
      SERVER_IP: '10.0.0.1',
      SERVER_PORT: '8080',
      SERVER_MAX_QUEUE_SIZE: '1000',
      SERVER_ADMIN_PASSWORD: 'admin123',
      SERVER_LOCAL_ADMIN: 'true',
      SERVER_PROCESSING_POLICY: 'sequent',
      SERVER_PARALLEL_REQUESTS_LIMIT: '20',
    });
    const parsed = JSON.parse(config);
    expect(parsed.server.ip).toBe('10.0.0.1');
    expect(parsed.server.port).toBe(8080);
    expect(parsed.server.max_queue_size).toBe(1000);
    expect(parsed.server.admin_password).toBe('admin123');
    expect(parsed.server.local_admin).toBe(true);
    expect(parsed.server.processing_policy).toBe('sequent');
    expect(parsed.server.parallel_requests_limit).toBe(20);
  });

  // #endregion

  // #region Boolean fields

  it('handles boolean fields correctly in JSON', () => {
    const { config } = generateClioConfig({
      ALLOW_NO_ETL: 'true',
      READ_ONLY: 'true',
      PROMETHEUS_ENABLED: 'false',
      SERVER_LOCAL_ADMIN: 'true',
    });
    const parsed = JSON.parse(config);
    expect(parsed.allow_no_etl).toBe(true);
    expect(parsed.read_only).toBe(true);
    expect(parsed.prometheus.enabled).toBe(false);
    expect(parsed.server.local_admin).toBe(true);
  });

  // #endregion

  // #region Cache and logging settings

  it('applies custom cache settings', () => {
    const { config } = generateClioConfig({
      CACHE_NUM_DIFFS: '64',
      CACHE_NUM_MARKERS: '96',
      CACHE_PAGE_FETCH_SIZE: '1024',
      CACHE_LOAD: 'sync',
      CACHE_FILE_PATH: '/data/cache.bin',
      CACHE_FILE_MAX_SEQUENCE_AGE: '10000',
    });
    const parsed = JSON.parse(config);
    expect(parsed.cache.num_diffs).toBe(64);
    expect(parsed.cache.num_markers).toBe(96);
    expect(parsed.cache.page_fetch_size).toBe(1024);
    expect(parsed.cache.load).toBe('sync');
    expect(parsed.cache.file.path).toBe('/data/cache.bin');
    expect(parsed.cache.file.max_sequence_age).toBe(10000);
  });

  it('applies custom logging settings', () => {
    const { config } = generateClioConfig({
      LOG_LEVEL: 'debug',
      LOG_ENABLE_CONSOLE: 'false',
      LOG_DIRECTORY: '/var/log/clio',
      LOG_ROTATION_SIZE: '4096',
      LOG_DIRECTORY_MAX_FILES: '50',
      LOG_TAG_STYLE: 'none',
    });
    const parsed = JSON.parse(config);
    expect(parsed.log.level).toBe('debug');
    expect(parsed.log.enable_console).toBe(false);
    expect(parsed.log.directory).toBe('/var/log/clio');
    expect(parsed.log.rotation_size).toBe(4096);
    expect(parsed.log.directory_max_files).toBe(50);
    expect(parsed.log.tag_style).toBe('none');
  });

  // #endregion

  // #region DoS guard and forwarding

  it('applies custom DoS guard settings', () => {
    const { config } = generateClioConfig({
      DOS_GUARD_MAX_FETCHES: '500000',
      DOS_GUARD_MAX_CONNECTIONS: '50',
      DOS_GUARD_MAX_REQUESTS: '50',
      DOS_GUARD_SWEEP_INTERVAL: '2',
    });
    const parsed = JSON.parse(config);
    expect(parsed.dos_guard.max_fetches).toBe(500000);
    expect(parsed.dos_guard.max_connections).toBe(50);
    expect(parsed.dos_guard.max_requests).toBe(50);
    expect(parsed.dos_guard.sweep_interval).toBe(2);
  });

  it('applies custom forwarding and RPC settings', () => {
    const { config } = generateClioConfig({
      FORWARDING_CACHE_TIMEOUT: '0.5',
      FORWARDING_REQUEST_TIMEOUT: '30.0',
      RPC_CACHE_TIMEOUT: '1.0',
    });
    const parsed = JSON.parse(config);
    expect(parsed.forwarding.cache_timeout).toBe(0.5);
    expect(parsed.forwarding.request_timeout).toBe(30.0);
    expect(parsed.rpc.cache_timeout).toBe(1.0);
  });

  // #endregion

  // #region API version

  it('applies custom API version settings', () => {
    const { config } = generateClioConfig({
      API_VERSION_MIN: '1',
      API_VERSION_MAX: '3',
      API_VERSION_DEFAULT: '2',
    });
    const parsed = JSON.parse(config);
    expect(parsed.api_version.min).toBe(1);
    expect(parsed.api_version.max).toBe(3);
    expect(parsed.api_version.default).toBe(2);
  });

  // #endregion

  // #region Validation errors

  it('throws on invalid port', () => {
    expect(() =>
      generateClioConfig({ SERVER_PORT: '99999' }),
    ).toThrow('Clio config validation failed');
  });

  it('throws on invalid boolean field', () => {
    expect(() =>
      generateClioConfig({ ALLOW_NO_ETL: 'maybe' }),
    ).toThrow('Clio config validation failed');
  });

  it('throws on invalid Cassandra port', () => {
    expect(() =>
      generateClioConfig({ CASSANDRA_PORT: '-1' }),
    ).toThrow('Clio config validation failed');
  });

  // #endregion

  // #region Structure verification

  it('contains all required top-level keys', () => {
    const { config } = generateClioConfig();
    const parsed = JSON.parse(config);
    const requiredKeys = [
      'database',
      'allow_no_etl',
      'etl_sources',
      'forwarding',
      'rpc',
      'dos_guard',
      'server',
      'graceful_period',
      'workers',
      'log',
      'cache',
      'prometheus',
      'extractor_threads',
      'read_only',
      'api_version',
      'ssl_cert_file',
      'ssl_key_file',
    ];
    for (const key of requiredKeys) {
      expect(parsed).toHaveProperty(key);
    }
  });

  it('has correct log channels structure', () => {
    const { config } = generateClioConfig();
    const parsed = JSON.parse(config);
    expect(parsed.log.channels).toHaveLength(6);
    const channelNames = parsed.log.channels.map(
      (c: { channel: string }) => c.channel,
    );
    expect(channelNames).toEqual([
      'Backend',
      'WebServer',
      'Subscriptions',
      'RPC',
      'ETL',
      'Performance',
    ]);
  });

  it('has correct dos_guard whitelist', () => {
    const { config } = generateClioConfig();
    const parsed = JSON.parse(config);
    expect(parsed.dos_guard.whitelist).toEqual(['127.0.0.1']);
  });

  it('has correct server proxy structure', () => {
    const { config } = generateClioConfig();
    const parsed = JSON.parse(config);
    expect(parsed.server.proxy).toEqual({ ips: [], tokens: [] });
  });

  // #endregion
});
