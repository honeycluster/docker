#!/bin/bash
# Bridge: map NETWORK/SIZE from compose to NETWORK_NAME/NODE_SIZE expected by common.sh,
# then source common and network-specific defaults. Sets CONFIG_FILE for this image.

# Network and size are used to determine the network id and validator file
# Options: MAINNET, TESTNET, DEVNET
export NETWORK="${NETWORK:-MAINNET}"

# Size is used to determine the node size
# Options: DEFAULT, SMALL, MEDIUM, LARGE, HUGE, FULL
export SIZE="${SIZE:-DEFAULT}"

# Ledger retention: [ledger_history] and online_delete depth by SIZE. 512 default. Overridable via LEDGER_RETENTION.
case "${SIZE}" in
    FULL)   export LEDGER_RETENTION="${LEDGER_RETENTION:-full}" ;;
    HUGE)   export LEDGER_RETENTION="${LEDGER_RETENTION:-4096}" ;;
    LARGE)  export LEDGER_RETENTION="${LEDGER_RETENTION:-2048}" ;;
    MEDIUM) export LEDGER_RETENTION="${LEDGER_RETENTION:-1024}" ;;
    SMALL)  export LEDGER_RETENTION="${LEDGER_RETENTION:-512}" ;;
    DEFAULT|*) export LEDGER_RETENTION="${LEDGER_RETENTION:-512}" ;;
esac

# source "${SCRIPTS_DIR}/defaults/common.sh" is required before ssl.sh and build_ssl_derived
source "${SCRIPTS_DIR}/defaults/common.sh"

export CONFIG_FILE="${CONFIG_FILE:-/opt/xrpl/etc/xrpld.cfg}"

# Network-specific defaults (devnet, mainnet, testnet)
net_lower="$(echo "${NETWORK:-MAINNET}" | tr '[:upper:]' '[:lower:]')"
if [ -f "${SCRIPTS_DIR}/defaults/${net_lower}.sh" ]; then
    source "${SCRIPTS_DIR}/defaults/${net_lower}.sh"
fi
