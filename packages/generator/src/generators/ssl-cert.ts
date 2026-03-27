import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { hostname } from 'node:os';
import type { XrpldInput, XrpldPortConfig } from '../types/xrpld-input.js';

// #region -- Types ------------------------------------

export interface SslCertOptions {
  readonly email?: string;
  readonly validityDays?: number;
  readonly commonName?: string;
}

export interface SslCertResult {
  readonly keyPath: string;
  readonly certPath: string;
}

// #endregion -- Types ---------------------------------

// #region -- Port SSL Helpers -------------------------

function hasSslProtocol(port: XrpldPortConfig): boolean {
  const protocols = port.protocol.split(',').map((p) => p.trim());
  return protocols.includes('https') || protocols.includes('wss');
}

function portHasUserSslPaths(port: XrpldPortConfig): boolean {
  return port.ssl_key !== undefined && port.ssl_cert !== undefined;
}

/**
 * Check if any port uses SSL protocols (https or wss).
 * Returns true if at least one port has https/wss protocol.
 */
export function hasSslPorts(config: XrpldInput): boolean {
  const ports = config.server?.ports;
  if (!ports) return false;
  return ports.some((port) => hasSslProtocol(port));
}

/**
 * Check if any dual-protocol port needs auto-generated SSL certificates.
 * Returns true if SSL ports exist and no ssl_key/ssl_cert paths are provided
 * (either top-level or per-port).
 */
export function needsSslCerts(config: XrpldInput): boolean {
  const ports = config.server?.ports;
  if (!ports) return false;
  if (config.ssl_key && config.ssl_cert) return false;
  return ports.some((port) => hasSslProtocol(port) && !portHasUserSslPaths(port));
}

/**
 * Inject ssl_key and ssl_cert paths into dual-protocol ports that don't already have them.
 * Returns a new config with updated ports (immutable).
 */
export function injectSslPaths(config: XrpldInput): XrpldInput {
  const ports = config.server?.ports;
  if (!ports) return config;

  const sslKeyPath = config.ssl_key ?? './certs/server.key';
  const sslCertPath = config.ssl_cert ?? './certs/server.crt';

  const updatedPorts = ports.map((port) => {
    if (hasSslProtocol(port) && !portHasUserSslPaths(port)) {
      return {
        ...port,
        ssl_key: sslKeyPath,
        ssl_cert: sslCertPath,
      };
    }
    return port;
  });

  return {
    ...config,
    ssl_key: sslKeyPath,
    ssl_cert: sslCertPath,
    server: { ...config.server, ports: updatedPorts },
  };
}

// #endregion -- Port SSL Helpers ----------------------

// #region -- Cert Generation --------------------------

/**
 * Generate self-signed SSL certificate and private key using OpenSSL.
 * Creates a certs/ directory in the specified output directory.
 * @param outputDir - Directory where certs/ subdirectory will be created
 * @param options - Certificate options (email, validity days, common name)
 * @returns Paths to the generated key and certificate files
 */
export function generateSslCerts(outputDir: string, options: SslCertOptions = {}): SslCertResult {
  const certsDir = join(outputDir, 'certs');
  const keyPath = join(certsDir, 'server.key');
  const certPath = join(certsDir, 'server.crt');

  mkdirSync(certsDir, { recursive: true });

  const validityDays = options.validityDays ?? 365;
  const commonName = options.commonName ?? (hostname() || 'xrpld');

  // Build subject string
  const subjectParts = [`/CN=${commonName}`];
  if (options.email) {
    subjectParts.push(`/emailAddress=${options.email}`);
  }
  const subject = subjectParts.join('');

  // Generate RSA 2048-bit private key
  const keyPem = execFileSync('openssl', ['genrsa', '2048']);

  writeFileSync(keyPath, keyPem);
  chmodSync(keyPath, 0o600);

  // Generate self-signed certificate
  execFileSync('openssl', [
    'req',
    '-new',
    '-x509',
    '-key',
    keyPath,
    '-out',
    certPath,
    '-days',
    String(validityDays),
    '-subj',
    subject,
    '-batch',
  ]);

  return { keyPath, certPath };
}

// #endregion -- Cert Generation -----------------------
