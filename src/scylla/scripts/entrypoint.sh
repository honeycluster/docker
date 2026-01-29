#!/bin/bash
# Scylla entrypoint: configure from ENV, then start Scylla and run post-start setup (password, clio keyspace).
# ENV: see scripts/config/defaults.sh and comments in configure.sh / startup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS_DIR="${SCRIPT_DIR}"

source "${SCRIPTS_DIR}/utils/logging.sh"
source "${SCRIPTS_DIR}/config/defaults.sh"
source "${SCRIPTS_DIR}/shutdown.sh"
source "${SCRIPTS_DIR}/validate.sh"
source "${SCRIPTS_DIR}/configure.sh"
source "${SCRIPTS_DIR}/startup.sh"

configure
start "$@"