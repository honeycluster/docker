#!/bin/bash
# Usage: ./up.sh [docker compose arguments]
# Example: ./up.sh up -d

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

set -a
source ../env
set +a

docker compose -f docker-compose.yml "$@"
