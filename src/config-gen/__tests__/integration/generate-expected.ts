import { readFileSync, writeFileSync } from 'fs';
import { generateXrpldConfig } from '../../generators/xrpld.js';
import { parseEnvFile } from '../../parsers/env-parser.js';
import { parseJsonFile } from '../../parsers/json-parser.js';

const FIXTURES = new URL('./fixtures/', import.meta.url).pathname;
const EXPECTED = new URL('./expected/', import.meta.url).pathname;

function loadEnv(name: string): Record<string, string> {
  const content = readFileSync(`${FIXTURES}${name}`, 'utf-8');
  return parseEnvFile(content);
}

function loadJson(name: string): Record<string, string> {
  const content = readFileSync(`${FIXTURES}${name}`, 'utf-8');
  return parseJsonFile(content);
}

// xrpld scenarios
const xrpldScenarios: [string, Record<string, string>][] = [
  ['xrpld-default.cfg', {}],
  ['xrpld-mainnet.cfg', loadEnv('xrpld-mainnet.env')],
  ['xrpld-testnet.cfg', loadEnv('xrpld-testnet.env')],
  ['xrpld-devnet.cfg', loadEnv('xrpld-devnet.env')],
  ['xrpld-small.cfg', loadEnv('xrpld-small.env')],
  ['xrpld-full.cfg', loadEnv('xrpld-full.env')],
  ['xrpld-ssl.cfg', loadEnv('xrpld-ssl.env')],
  ['xrpld-custom-ports.cfg', loadJson('xrpld-custom-ports.json')],
];

for (const [filename, overrides] of xrpldScenarios) {
  const { config } = generateXrpldConfig(overrides);
  writeFileSync(`${EXPECTED}${filename}`, config);
  console.log(`Generated ${filename}`);
}
