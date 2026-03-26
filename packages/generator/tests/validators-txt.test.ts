import { describe, it, expect } from 'vitest';
import { generateValidatorsTxt } from '../src/generators/validators-txt.js';
import { resolveXrpldConfig } from '../src/defaults/xrpld.js';
import type { XrpldInput } from '../src/types/xrpld-input.js';

describe('generateValidatorsTxt', () => {
  it('generates validators.txt with validator_list_sites and keys for mainnet', () => {
    const config = resolveXrpldConfig({ presets: { network: 'mainnet' } });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('[validator_list_sites]');
    expect(result).toContain('https://vl.ripple.com');
    expect(result).toContain('[validator_list_keys]');
    expect(result).toContain('ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734');
  });

  it('generates validators.txt for testnet', () => {
    const config = resolveXrpldConfig({ presets: { network: 'testnet' } });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('[validator_list_sites]');
    expect(result).toContain('https://vl.altnet.rippletest.net');
    expect(result).toContain('[validator_list_keys]');
    expect(result).toContain('ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860');
  });

  it('generates validators.txt for devnet', () => {
    const config = resolveXrpldConfig({ presets: { network: 'devnet' } });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('[validator_list_sites]');
    expect(result).toContain('https://vl.devnet.rippletest.net');
    expect(result).toContain('[validator_list_keys]');
    expect(result).toContain('EDBB54B0D9AEE071BB37784AF5A9E7CC49AC7A0EFCE868C54532BCB966B9CFC13B');
  });

  it('includes [validators] section when validators array is provided', () => {
    const config = resolveXrpldConfig({
      presets: { network: 'mainnet' },
      validators: ['nHBidG3pZK11zQD6kpNDoAhDxH6n8KnyoHmSMzPELCRBAeZcmXLP'],
    });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('[validators]');
    expect(result).toContain('nHBidG3pZK11zQD6kpNDoAhDxH6n8KnyoHmSMzPELCRBAeZcmXLP');
  });

  it('omits [validators] section when validators array is empty', () => {
    const config = resolveXrpldConfig({ presets: { network: 'mainnet' }, validators: [] });
    const result = generateValidatorsTxt(config);

    expect(result).not.toContain('[validators]');
  });

  it('omits sections when vl config is missing', () => {
    const config = { presets: { network: 'mainnet' } } as XrpldInput;
    const result = generateValidatorsTxt(config);

    expect(result).not.toContain('[validator_list_sites]');
    expect(result).not.toContain('[validator_list_keys]');
  });

  it('handles multiple validator list sites and keys', () => {
    const config = resolveXrpldConfig({
      presets: { network: 'mainnet' },
      vl: {
        validator_list_sites: ['https://vl1.example.com', 'https://vl2.example.com'],
        validator_list_keys: ['KEY1', 'KEY2'],
      },
    });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('https://vl1.example.com');
    expect(result).toContain('https://vl2.example.com');
    expect(result).toContain('KEY1');
    expect(result).toContain('KEY2');
  });

  it('mainnet includes both vl.ripple.com and unl.xrplf.org VL sites', () => {
    const config = resolveXrpldConfig({ presets: { network: 'mainnet' } });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('https://vl.ripple.com');
    expect(result).toContain('https://unl.xrplf.org');
  });

  it('mainnet includes both validator list keys with source comments', () => {
    const config = resolveXrpldConfig({ presets: { network: 'mainnet' } });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('#vl.ripple.com');
    expect(result).toContain('ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734');
    expect(result).toContain('#unl.xrplf.org');
    expect(result).toContain('ED42AEC58B701EEBB77356FFFEC26F83C1F0407263530F068C7C73D392C7E06FD1');
  });

  it('renders source comment directly before its associated key', () => {
    const config = resolveXrpldConfig({ presets: { network: 'mainnet' } });
    const result = generateValidatorsTxt(config);

    const lines = result.split('\n');
    const rippleCommentIdx = lines.indexOf('#vl.ripple.com');
    const xrplfCommentIdx = lines.indexOf('#unl.xrplf.org');

    expect(rippleCommentIdx).toBeGreaterThan(-1);
    expect(lines[rippleCommentIdx + 1]).toBe(
      'ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734',
    );
    expect(xrplfCommentIdx).toBeGreaterThan(-1);
    expect(lines[xrplfCommentIdx + 1]).toBe(
      'ED42AEC58B701EEBB77356FFFEC26F83C1F0407263530F068C7C73D392C7E06FD1',
    );
  });

  it('renders keys without comments when validator_list_key_sources is absent', () => {
    const config: XrpldInput = {
      vl: {
        validator_list_sites: ['https://example.com'],
        validator_list_keys: ['KEYABC'],
      },
    } as XrpldInput;
    const result = generateValidatorsTxt(config);

    expect(result).toContain('KEYABC');
    expect(result).not.toContain('#');
  });

  it('sections are separated by blank lines', () => {
    const config = resolveXrpldConfig({ presets: { network: 'mainnet' } });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('[validator_list_sites]');
    expect(result).toContain('[validator_list_keys]');
    expect(result).toMatch(/\[validator_list_sites\][\s\S]+?\n\n\[validator_list_keys\]/);
  });
});
