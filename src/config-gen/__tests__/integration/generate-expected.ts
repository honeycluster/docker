import { writeFileSync } from 'fs';
import { generateXrpldConfig } from '../../generators/xrpld.js';
import type { XrpldInput } from '../../types/xrpld-input.js';

const EXPECTED = new URL('./expected/', import.meta.url).pathname;

const scenarios: [string, Partial<XrpldInput>][] = [
  ['xrpld-default.cfg', {}],
  ['xrpld-mainnet.cfg', { presets: { network: 'mainnet' } }],
  ['xrpld-testnet.cfg', { presets: { network: 'testnet' } }],
  ['xrpld-devnet.cfg', { presets: { network: 'devnet' } }],
  [
    'xrpld-custom-ports.cfg',
    {
      presets: { network: 'mainnet' },
      server: {
        ports: [
          { name: 'port_peer', port: 41235, ip: '0.0.0.0', protocol: 'peer' },
          { name: 'port_rpc', port: 41234, ip: '0.0.0.0', protocol: 'http', admin: '127.0.0.1' },
          { name: 'port_ws', port: 4005, ip: '0.0.0.0', protocol: 'ws' },
        ],
      },
    },
  ],
  [
    'xrpld-advanced.cfg',
    {
      presets: { network: 'mainnet' },
      overlay: { ip_limit: 5, max_unknown_time: 300, connect_timeout: 15 },
      transaction_queue: { ledgers_in_queue: 20, minimum_queue_size: 2000, retry_sequence_percent: 25 },
      voting: { reference_fee: 10, account_reserve: 10000000, owner_reserve: 2000000 },
      reduce_relay: { vp_enable: 1, vp_squelch: 600, tx_enable: 1, tx_limit: 300 },
      crawl: { overlay: 1, server: 1, counts: 1, unl: 1 },
      sqlite: { ledger_page_size: 4096, transaction_page_size: 4096, account_page_size: 4096 },
    },
  ],
];

for (const [filename, input] of scenarios) {
  const result = generateXrpldConfig(input);
  writeFileSync(`${EXPECTED}${filename}`, result.config);

  // Write validators.txt for network scenarios
  if (filename.includes('mainnet') || filename.includes('testnet') || filename.includes('devnet')) {
    const baseName = filename.replace('.cfg', '-validators.txt');
    writeFileSync(`${EXPECTED}${baseName}`, result.validatorsTxt);
  }

  console.log(`Generated ${filename}`);
}
