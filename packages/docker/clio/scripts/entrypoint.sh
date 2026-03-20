#!/bin/bash
# Start up for xrpld/rippled with minimal configuration

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="${SCRIPT_DIR}"

# Source utility scripts
source "${SCRIPTS_DIR}/utils/logging.sh"

# Source remaining scripts
source "${SCRIPTS_DIR}/startup.sh"
source "${SCRIPTS_DIR}/shutdown.sh"

# If rippled is running, reload the configuration, otherwise start it
if is_running; then
    reload
else
    start "$@"
fi
