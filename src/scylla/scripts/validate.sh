#!/bin/bash
# Validate Scylla runtime prerequisites

validate_inputs() {
  local bin="${SCYLLA_BIN:-$(command -v scylla 2>/dev/null || echo /usr/bin/scylla)}"
  if [[ ! -x "$bin" ]] && ! command -v scylla >/dev/null 2>&1; then
    log_error "Scylla binary not found or not executable: $bin"
    return 1
  fi
  if ! command -v cqlsh >/dev/null 2>&1; then
    log_error "cqlsh not found"
    return 1
  fi
  return 0
}
