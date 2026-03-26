import { describe, it, expect } from 'vitest';
import { needsSslCerts, injectSslPaths } from '../../src/generators/ssl-cert.js';
import type { XrpldInput, XrpldPortConfig } from '../../src/types/xrpld-input.js';

// #region -- Helper -----------------------------------

function makeConfig(ports: ReadonlyArray<XrpldPortConfig>): XrpldInput {
  return { server: { ports } } as XrpldInput;
}

// #endregion -- Helper --------------------------------

// #region -- needsSslCerts ----------------------------

describe('needsSslCerts', () => {
  it('returns true when port has https protocol without ssl_key/ssl_cert', () => {
    const config = makeConfig([
      { name: 'port_rpc', port: 5005, ip: '0.0.0.0', protocol: 'http,https' },
    ]);
    expect(needsSslCerts(config)).toBe(true);
  });

  it('returns true when port has wss protocol without ssl_key/ssl_cert', () => {
    const config = makeConfig([
      { name: 'port_wss', port: 6005, ip: '0.0.0.0', protocol: 'ws,wss' },
    ]);
    expect(needsSslCerts(config)).toBe(true);
  });

  it('returns false when no ports have ssl protocols', () => {
    const config = makeConfig([
      { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
      { name: 'port_rpc', port: 5005, ip: '0.0.0.0', protocol: 'http' },
    ]);
    expect(needsSslCerts(config)).toBe(false);
  });

  it('returns false when ssl ports have user-provided ssl_key and ssl_cert', () => {
    const config = makeConfig([
      {
        name: 'port_rpc',
        port: 5005,
        ip: '0.0.0.0',
        protocol: 'http,https',
        ssl_key: '/custom/key.pem',
        ssl_cert: '/custom/cert.pem',
      },
    ]);
    expect(needsSslCerts(config)).toBe(false);
  });

  it('returns true when some ssl ports have user certs and others do not', () => {
    const config = makeConfig([
      {
        name: 'port_rpc',
        port: 5005,
        ip: '0.0.0.0',
        protocol: 'http,https',
        ssl_key: '/custom/key.pem',
        ssl_cert: '/custom/cert.pem',
      },
      { name: 'port_wss', port: 6005, ip: '0.0.0.0', protocol: 'ws,wss' },
    ]);
    expect(needsSslCerts(config)).toBe(true);
  });

  it('returns false when config has no server ports', () => {
    const config = {} as XrpldInput;
    expect(needsSslCerts(config)).toBe(false);
  });
});

// #endregion -- needsSslCerts -------------------------

// #region -- injectSslPaths ---------------------------

describe('injectSslPaths', () => {
  it('adds ssl_key and ssl_cert to ports with https protocol', () => {
    const config = makeConfig([
      { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
      { name: 'port_rpc', port: 5005, ip: '0.0.0.0', protocol: 'http,https' },
    ]);
    const result = injectSslPaths(config);
    const rpc = result.server!.ports.find((p) => p.name === 'port_rpc')!;
    expect(rpc.ssl_key).toBe('./certs/server.key');
    expect(rpc.ssl_cert).toBe('./certs/server.crt');
  });

  it('adds ssl_key and ssl_cert to ports with wss protocol', () => {
    const config = makeConfig([
      { name: 'port_wss', port: 6005, ip: '0.0.0.0', protocol: 'ws,wss' },
    ]);
    const result = injectSslPaths(config);
    const wss = result.server!.ports.find((p) => p.name === 'port_wss')!;
    expect(wss.ssl_key).toBe('./certs/server.key');
    expect(wss.ssl_cert).toBe('./certs/server.crt');
  });

  it('does not modify ports without ssl protocols', () => {
    const config = makeConfig([
      { name: 'port_peer', port: 51235, ip: '0.0.0.0', protocol: 'peer' },
      { name: 'port_rpc', port: 5005, ip: '0.0.0.0', protocol: 'http' },
    ]);
    const result = injectSslPaths(config);
    const peer = result.server!.ports.find((p) => p.name === 'port_peer')!;
    const rpc = result.server!.ports.find((p) => p.name === 'port_rpc')!;
    expect(peer.ssl_key).toBeUndefined();
    expect(rpc.ssl_key).toBeUndefined();
  });

  it('does not override user-provided ssl_key and ssl_cert', () => {
    const config = makeConfig([
      {
        name: 'port_rpc',
        port: 5005,
        ip: '0.0.0.0',
        protocol: 'http,https',
        ssl_key: '/custom/key.pem',
        ssl_cert: '/custom/cert.pem',
      },
    ]);
    const result = injectSslPaths(config);
    const rpc = result.server!.ports.find((p) => p.name === 'port_rpc')!;
    expect(rpc.ssl_key).toBe('/custom/key.pem');
    expect(rpc.ssl_cert).toBe('/custom/cert.pem');
  });

  it('returns config unchanged when no server ports exist', () => {
    const config = {} as XrpldInput;
    const result = injectSslPaths(config);
    expect(result).toEqual(config);
  });

  it('is immutable — does not modify original config', () => {
    const originalPorts: XrpldPortConfig[] = [
      { name: 'port_rpc', port: 5005, ip: '0.0.0.0', protocol: 'http,https' },
    ];
    const config = makeConfig(originalPorts);
    injectSslPaths(config);
    expect(originalPorts[0].ssl_key).toBeUndefined();
  });
});

// #endregion -- injectSslPaths ------------------------
