#!/bin/bash
# Prepare scylla.yaml: copy /etc/scylla/scylla.yaml to /tmp and patch from ENV

prepare_config() {
  local src="/etc/scylla/scylla.yaml"
  local dst="/tmp/scylla.yaml"

  if [[ ! -f "$src" ]]; then
    return
  fi

  cp "$src" "$dst"
  [[ -n "${SCYLLA_CLUSTER_NAME}" ]]           && sed -i "s/^cluster_name:.*/cluster_name: ${SCYLLA_CLUSTER_NAME}/" "$dst"
  [[ -n "${SCYLLA_SEEDS}" ]]                 && sed -i "s/seeds:.*/seeds: \"${SCYLLA_SEEDS}\"/" "$dst"
  [[ -n "${SCYLLA_LISTEN_ADDRESS}" ]]        && sed -i "s/^listen_address:.*/listen_address: ${SCYLLA_LISTEN_ADDRESS}/" "$dst"
  [[ -n "${SCYLLA_RPC_ADDRESS}" ]]           && sed -i "s/^rpc_address:.*/rpc_address: ${SCYLLA_RPC_ADDRESS}/" "$dst"
  [[ -n "${SCYLLA_BROADCAST_ADDRESS}" ]]     && sed -i "s/^broadcast_address:.*/broadcast_address: ${SCYLLA_BROADCAST_ADDRESS}/" "$dst"
  [[ -n "${SCYLLA_BROADCAST_RPC_ADDRESS}" ]] && sed -i "s/^broadcast_rpc_address:.*/broadcast_rpc_address: ${SCYLLA_BROADCAST_RPC_ADDRESS}/" "$dst"
  [[ -n "${SCYLLA_AUTHENTICATOR}" ]]         && sed -i "s/^authenticator:.*/authenticator: ${SCYLLA_AUTHENTICATOR}/" "$dst"
  [[ -n "${SCYLLA_AUTHORIZER}" ]]            && sed -i "s/^authorizer:.*/authorizer: ${SCYLLA_AUTHORIZER}/" "$dst"
  [[ -n "${SCYLLA_NATIVE_TRANSPORT_PORT}" ]] && sed -i "s/^native_transport_port:.*/native_transport_port: ${SCYLLA_NATIVE_TRANSPORT_PORT}/" "$dst"

  SCYLLA_OPTIONS_FILE="$dst"
}

configure() {
  log_info "Configuring Scylla..."
  if ! validate_inputs; then
    log_error "Validation failed, exiting."
    exit 1
  fi
  prepare_config
  log_info "Configuration complete"
}
