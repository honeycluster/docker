#!/bin/bash
# Bridge: source common Clio defaults. Sets CONFIG_FILE for this image.
# Template: CONFIG_DIR/templates/config.json -> CONFIG_DIR/etc/config.json (defaults: scripts/config/defaults.sh, defaults/common.sh)

# CONFIG_DIR is set in defaults/common.sh; must source it first (required before ssl.sh and build_ssl_derived)
source "${SCRIPTS_DIR}/defaults/common.sh"

export CONFIG_FILE="${CONFIG_FILE:-$CONFIG_DIR/etc/config.json}"
