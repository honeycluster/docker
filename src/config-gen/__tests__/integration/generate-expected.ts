import { writeFileSync } from 'fs';
import { resolveXrpldConfig } from '../../defaults/xrpld.js';
import { renderXrpldCfg } from '../../renderers/cfg-renderer.js';

const EXPECTED = new URL('./expected/', import.meta.url).pathname;

const scenarios: [string, Parameters<typeof resolveXrpldConfig>[0]][] = [
  ['xrpld-default.cfg', {}],
  ['xrpld-mainnet.cfg', { network: 'mainnet' }],
  ['xrpld-testnet.cfg', { network: 'testnet' }],
  ['xrpld-devnet.cfg', { network: 'devnet' }],
];

for (const [filename, input] of scenarios) {
  const config = resolveXrpldConfig(input);
  const cfg = renderXrpldCfg(config);
  writeFileSync(`${EXPECTED}${filename}`, cfg);
  console.log(`Generated ${filename}`);
}
