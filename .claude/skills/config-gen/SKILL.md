# Config Generator Skill

Patterns for the `packages/generator/` config generation system.

## Architecture

```
Input Sources          Pipeline              Output
─────────────         ─────────             ──────
.env file    ──┐
               ├──→ Parse → Validate → Merge Defaults → Generate → Config File
JSON file    ──┘
CLI args     ──┘

Parsers: env-parser.ts, json-parser.ts
Defaults: xrpld.ts, clio.ts (per network)
Generators: xrpld.ts (→ .cfg), clio.ts (→ .json)
Template: envsubst-style ${VAR} substitution
Validation: port, boolean, url, required fields
```

## Adding a New Config Field

1. **Add default** in `src/defaults/<service>.ts`:
   ```typescript
   export const xrpldDefaults = {
     mainnet: {
       // ... existing
       newField: 'default-value',
     },
   }
   ```

2. **Add validation** in `src/validation.ts`:
   ```typescript
   export function validateNewField(value: unknown): boolean {
     // validation logic
   }
   ```

3. **Update generator** in `src/generators/<service>.ts`:
   ```typescript
   // Add to the config output
   result += `new_field = ${input.newField}\n`
   ```

4. **Add test** in `tests/generators/<service>.test.ts`:
   ```typescript
   it('includes new field in output', () => {
     const result = generate({ newField: 'custom' })
     expect(result).toContain('new_field = custom')
   })
   ```

5. **Update integration fixtures** if applicable.

## Template Substitution

The template engine replaces `${VAR_NAME}` placeholders:

```typescript
import { substituteTemplate } from './template'

const template = `
[server]
port = \${SERVER_PORT}
ssl = \${SSL_ENABLED}
`

const result = substituteTemplate(template, {
  SERVER_PORT: '6006',
  SSL_ENABLED: 'true',
})
```

## Network Defaults

Each service has network-specific defaults:

```typescript
// xrpld networks: mainnet, testnet, devnet
// clio networks: mainnet, testnet, devnet

const config = generateXrpldConfig({
  network: 'mainnet',    // Uses mainnet defaults
  port: 6006,            // Overrides default port
  // ... other overrides
})
```

## Testing Config Generators

### Unit test a generator:
```typescript
describe('generateXrpldConfig', () => {
  it('generates valid mainnet config', () => {
    const result = generateXrpldConfig({ network: 'mainnet' })
    expect(result).toContain('[server]')
    expect(result).toContain('[node_db]')
  })
})
```

### Integration test with fixtures:
```typescript
describe('integration', () => {
  it('matches expected output for default config', () => {
    const result = generateXrpldConfig({ network: 'mainnet' })
    const expected = readFileSync('tests/fixtures/xrpld-default.cfg', 'utf8')
    expect(result).toEqual(expected)
  })
})
```

## CLI Usage

```bash
# Generate xrpld config
config-gen --service xrpld --network mainnet --output /opt/xrpl/etc/xrpld.cfg

# Generate clio config
config-gen --service clio --network mainnet --output /opt/clio/etc/config.json

# From environment variables
NETWORK=testnet PORT=6006 config-gen --service xrpld
```
