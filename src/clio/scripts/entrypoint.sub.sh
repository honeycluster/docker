#!/bin/bash
set -e

# Docker entrypoint for Clio: envsubst template injection, then clio_server
# Template: CONFIG_DIR/templates/config.json -> CONFIG_DIR/etc/config.json (defaults: scripts/config/defaults.sh, defaults/common.sh)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="${SCRIPT_DIR}"

# Source all utility scripts
source "${SCRIPTS_DIR}/utils/envsubst.sh"
source "${SCRIPTS_DIR}/utils/logging.sh"
source "${SCRIPTS_DIR}/utils/injection.sh"

# Config: defaults define all variables (including SSL inputs)
source "${SCRIPTS_DIR}/config/defaults.sh"

# SSL: generate or discover certs in CLIO_CERTS_DIR (sets SSL_CERT_PATH)
source "${SCRIPTS_DIR}/ssl.sh"
build_ssl_derived

# Source remaining scripts
source "${SCRIPTS_DIR}/startup.sh"
source "${SCRIPTS_DIR}/shutdown.sh"
source "${SCRIPTS_DIR}/validate.sh"
source "${SCRIPTS_DIR}/configure.sh"

# Run configure function (validation, injection, etc.)
configure

# Start clio_server if no command provided, otherwise execute the provided command
if [ $# -eq 0 ]; then
    log_info "No command provided, starting clio_server"
    start
else
    log_info "Executing command: $@"
    exec "$@"
fi
