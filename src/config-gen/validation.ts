// #region Types

export interface ValidationError {
  field: string;
  value: string | undefined;
  message: string;
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
}

// #endregion

// #region Core Validators

const VALID_BOOLEANS = new Set([
  'true',
  'false',
  'on',
  'off',
  '1',
  '0',
  'yes',
  'no',
]);

export function validatePort(
  field: string,
  value: string | undefined
): ValidationError | null {
  if (value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > 65535) {
    return {
      field,
      value,
      message: `Invalid port number: must be an integer between 1 and 65535`,
    };
  }
  return null;
}

export function validateBoolean(
  field: string,
  value: string | undefined
): ValidationError | null {
  if (value === undefined || value === '') return null;
  if (!VALID_BOOLEANS.has(value.toLowerCase())) {
    return {
      field,
      value,
      message: `Invalid boolean value: must be one of true/false, on/off, 1/0, yes/no`,
    };
  }
  return null;
}

export function validateUrl(
  field: string,
  value: string | undefined
): ValidationError | null {
  if (value === undefined || value === '') return null;
  if (!/^(https?|wss?):\/\/.+/.test(value)) {
    return {
      field,
      value,
      message: `Invalid URL: must start with http://, https://, ws://, or wss://`,
    };
  }
  return null;
}

export function validateRequired(
  field: string,
  value: string | undefined
): ValidationError | null {
  if (value === undefined || value === '') {
    return {
      field,
      value,
      message: `Required field is missing or empty`,
    };
  }
  return null;
}

// #endregion

// #region Enum Validators

const VALID_NETWORKS = new Set([
  'MAINNET',
  'TESTNET',
  'DEVNET',
]);

const VALID_SIZES = new Set([
  'DEFAULT',
  'SMALL',
  'MEDIUM',
  'LARGE',
  'HUGE',
  'FULL',
]);

function validateNetwork(
  field: string,
  value: string | undefined
): ValidationError | null {
  if (value === undefined || value === '') return null;
  if (!VALID_NETWORKS.has(value.toUpperCase())) {
    return {
      field,
      value,
      message: `Invalid network: must be one of MAINNET, TESTNET, DEVNET`,
    };
  }
  return null;
}

function validateSize(
  field: string,
  value: string | undefined
): ValidationError | null {
  if (value === undefined || value === '') return null;
  if (!VALID_SIZES.has(value.toUpperCase())) {
    return {
      field,
      value,
      message: `Invalid size: must be one of DEFAULT, SMALL, MEDIUM, LARGE, HUGE, FULL`,
    };
  }
  return null;
}

// #endregion

// #region xrpld Validation

export function validateXrpldInputs(
  inputs: Record<string, string | undefined>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Ports
  const portFields = [
    'PORT_PEER',
    'PORT_RPC',
    'PORT_WSS',
    'PORT_GRPC',
    'PORT_RPC_ADMIN_LOCAL',
    'PORT_WSS_ADMIN_LOCAL',
  ];
  for (const field of portFields) {
    const err = validatePort(field, inputs[field]);
    if (err) errors.push(err);
  }

  // Network enum
  const networkErr = validateNetwork('NETWORK', inputs.NETWORK);
  if (networkErr) errors.push(networkErr);

  // Size enum
  const sizeErr = validateSize('SIZE', inputs.SIZE);
  if (sizeErr) errors.push(sizeErr);

  // Booleans
  const boolFields = [
    'SSL_GENERATE',
    'SSL_GENERATE_OVERWRITE',
    'SSL_CHAIN_ENABLED',
    'PEER_PRIVATE',
    'NODE_DB_ADVISORY_DELETE',
  ];
  for (const field of boolFields) {
    const err = validateBoolean(field, inputs[field]);
    if (err) errors.push(err);
  }

  // Optional URL validation
  if (inputs.VALIDATOR_LIST_SITES) {
    const err = validateUrl(
      'VALIDATOR_LIST_SITES',
      inputs.VALIDATOR_LIST_SITES
    );
    if (err) warnings.push(err);
  }

  // Warn on unknown network/size (already caught as errors, but add warnings for near-misses)
  if (
    inputs.NETWORK &&
    !VALID_NETWORKS.has(inputs.NETWORK) &&
    VALID_NETWORKS.has(inputs.NETWORK.toUpperCase())
  ) {
    warnings.push({
      field: 'NETWORK',
      value: inputs.NETWORK,
      message: `Network value has incorrect casing; expected uppercase (e.g., ${inputs.NETWORK.toUpperCase()})`,
    });
  }

  if (
    inputs.SIZE &&
    !VALID_SIZES.has(inputs.SIZE) &&
    VALID_SIZES.has(inputs.SIZE.toUpperCase())
  ) {
    warnings.push({
      field: 'SIZE',
      value: inputs.SIZE,
      message: `Size value has incorrect casing; expected uppercase (e.g., ${inputs.SIZE.toUpperCase()})`,
    });
  }

  return { errors, warnings };
}

// #endregion

// #endregion
