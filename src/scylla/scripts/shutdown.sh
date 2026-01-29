#!/bin/bash
# Shutdown handling for Scylla

shutdown() {
  log_info "Shutting down Scylla..."
  if [[ -n "${SCYLLA_PID:-}" ]] && kill -0 "$SCYLLA_PID" 2>/dev/null; then
    kill -TERM "$SCYLLA_PID" 2>/dev/null || true
    wait "$SCYLLA_PID" 2>/dev/null || true
  fi
  exit 0
}

trap shutdown SIGTERM SIGINT
