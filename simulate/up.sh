#!/bin/bash
# Usage: ./simulate/up.sh [docker compose arguments]
# Example: ./simulate/up.sh up -d

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [ -f ./credentials.env ]; then
    set -a
    source ./credentials.env
    set +a
fi

docker-compose -f compose.yml "$@"
