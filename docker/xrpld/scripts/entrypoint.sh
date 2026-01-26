#!/bin/bash
set -e

# Docker entrypoint for rippled: envsubst template injection, then rippled
# Template: CONFIG_DIR/conf/rippled.cfg -> CONFIG_DIR/rippled.cfg (defaults: scripts/config/defaults.sh)

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="${SCRIPT_DIR}"

# Source all utility scripts
source "${SCRIPTS_DIR}/utils/envsubst.sh"
source "${SCRIPTS_DIR}/utils/logging.sh"
source "${SCRIPTS_DIR}/utils/injection.sh"

# Config: defaults define all variables (including SSL inputs)
source "${SCRIPTS_DIR}/config/defaults.sh"

# SSL: generate or discover certs in RIPPLE_CERTS_DIR (sets SSL_CERT_PATH)
source "${SCRIPTS_DIR}/ssl.sh"
build_ssl_derived

# Source remaining scripts
source "${SCRIPTS_DIR}/startup.sh"
source "${SCRIPTS_DIR}/shutdown.sh"
source "${SCRIPTS_DIR}/validate.sh"
source "${SCRIPTS_DIR}/configure.sh"

# Run configure function (validation, injection, etc.)
configure

# Start rippled if no command provided, otherwise execute the provided command
if [ $# -eq 0 ]; then
    log_info "No command provided, starting rippled"
    start
else
    # Execute the provided command
    log_info "Executing command: $@"
    exec "$@"
fi
