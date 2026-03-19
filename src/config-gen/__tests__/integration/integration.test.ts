import { describe, it, expect } from 'vitest';
import { resolveXrpldConfig } from '../../defaults/xrpld.js';
import { renderXrpldCfg } from '../../renderers/cfg-renderer.js';

// #region xrpld Integration Tests (using new renderer)

describe('xrpld integration tests', () => {
  it('generates mainnet config with expected sections', () => {
    const config = resolveXrpldConfig({ network: 'mainnet' });
    const cfg = renderXrpldCfg(config);
    expect(cfg).toContain('[server]');
    expect(cfg).toContain('[port_peer]');
    expect(cfg).toContain('[node_db]');
    expect(cfg).toContain('[network_id]');
    expect(cfg).toContain('0');
  });

  it('generates testnet config with correct network_id and ips', () => {
    const config = resolveXrpldConfig({ network: 'testnet' });
    const cfg = renderXrpldCfg(config);
    expect(cfg).toContain('[network_id]\n1');
    expect(cfg).toContain('[ips]\ns.altnet.rippletest.net 51235');
  });

  it('generates devnet config with correct network_id and ips', () => {
    const config = resolveXrpldConfig({ network: 'devnet' });
    const cfg = renderXrpldCfg(config);
    expect(cfg).toContain('[network_id]\n2');
    expect(cfg).toContain('[ips]\ns.devnet.rippletest.net 51235');
  });

  it('default config matches explicit mainnet config', () => {
    const defaultCfg = renderXrpldCfg(resolveXrpldConfig({}));
    const mainnetCfg = renderXrpldCfg(resolveXrpldConfig({ network: 'mainnet' }));
    expect(defaultCfg).toBe(mainnetCfg);
  });
});

// #endregion
