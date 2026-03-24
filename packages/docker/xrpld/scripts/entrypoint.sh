#!/bin/bash
# Entrypoint for xrpld/rippled container

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="${SCRIPT_DIR}"

# Source utility scripts
source "${SCRIPTS_DIR}/utils/logging.sh"
source "${SCRIPTS_DIR}/startup.sh"
source "${SCRIPTS_DIR}/shutdown.sh"
source "${SCRIPTS_DIR}/logrotate.sh"

# If arguments are passed, exec the binary directly with those args.
# This supports one-off commands like:
#   docker run ... xrpld validation_create
#   docker run ... xrpld --conf /opt/xrpl/etc/xrpld.cfg validation_create
if [ $# -gt 0 ]; then
    exec "$BIN" "$@"
fi

# Daemon mode (no args): configure logrotate and start the node
configure_logrotate

if is_running; then
    reload
else
    start
fi
