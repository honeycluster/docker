import { describe, it, expect } from 'vitest';
import { generateValidatorsTxt } from '../generators/validators-txt.js';
import { resolveXrpldConfig } from '../defaults/xrpld.js';
import type { XrpldInput } from '../types/xrpld-input.js';

describe('generateValidatorsTxt', () => {
  it('generates validators.txt with validator_list_sites and keys for mainnet', () => {
    const config = resolveXrpldConfig({ network: 'mainnet' });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('[validator_list_sites]');
    expect(result).toContain('https://vl.ripple.com');
    expect(result).toContain('[validator_list_keys]');
    expect(result).toContain('ED2677ABFFD1B33AC6FBC3062B71F1E8397C1505E1C42C64D11AD1B28FF73F4734');
  });

  it('generates validators.txt for testnet', () => {
    const config = resolveXrpldConfig({ network: 'testnet' });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('[validator_list_sites]');
    expect(result).toContain('https://vl.altnet.rippletest.net');
    expect(result).toContain('[validator_list_keys]');
    expect(result).toContain('ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860');
  });

  it('generates validators.txt for devnet', () => {
    const config = resolveXrpldConfig({ network: 'devnet' });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('[validator_list_sites]');
    expect(result).toContain('https://vl.devnet.rippletest.net');
    expect(result).toContain('[validator_list_keys]');
    expect(result).toContain('EDBB54B0D9AEE071BB37784AF5A9E7CC49AC7A0EFCE868C54532BCB966B9CFC13B');
  });

  it('includes [validators] section when validators array is provided', () => {
    const config = resolveXrpldConfig({
      network: 'mainnet',
      validators: ['nHBidG3pZK11zQD6kpNDoAhDxH6n8KnyoHmSMzPELCRBAeZcmXLP'],
    });
    const result = generateValidatorsTxt(config);

    expect(result).toContain('[validators]');
    expect(result).toContain('nHBidG3pZK11zQD6kpNDoAhDxH6n8KnyoHmSMzPELCRBAeZcmXLP');
  });

  it('omits [validators] section when validators array is empty', () => {
    const config = resolveXrpldConfig({ network: 'mainnet', validators: [] });
    const result = generateValidatorsTxt(config);

    expect(result).not.toContain('[validators]');
  });

  it('omits sections when vl config is missing', () => {
    const config = { network: 'mainnet' } as XrpldInput;
    const result = generateValidatorsTxt(config);

    expect(result).not.toContain('[validator_list_sites]');
    expect(result).not.toContain('[validator_list_keys]');
  });

  it('handles multiple validator list sites and keys', () => {
    const config = resolveXrpldConfig({
      network: 'mainnet',
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
});
