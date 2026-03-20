#!/bin/bash
# Shutdown handling for rippled

shutdown() {
    log_info "Received shutdown signal, stopping rippled..."
    if [ -n "${RIPPLE_PID:-}" ]; then
        kill -TERM "$RIPPLE_PID" 2>/dev/null || true
        wait "$RIPPLE_PID" 2>/dev/null || true
    fi
    exit 0
}

trap shutdown SIGTERM SIGINT
