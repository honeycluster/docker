#!/bin/bash
# Start Scylla, wait for CQL, set password and create clio keyspace, then wait on process
# cqlsh always uses 127.0.0.1 (same container); SCYLLA_RPC_ADDRESS is the bind address (e.g. 0.0.0.0)

CQLSH_HOST="${SCYLLA_CQLSH_HOST:-127.0.0.1}"

wait_for_cql() {
  local host="${CQLSH_HOST}"
  local port="${SCYLLA_NATIVE_TRANSPORT_PORT:-9042}"
  local max=60
  local n=0

  until cqlsh -u "$SCYLLA_CQLSH_USER" -p "$SCYLLA_CQLSH_PASSWORD" "${host}" "${port}" -e "describe cluster" 2>/dev/null; do
    n=$((n + 1))
    if [[ $n -ge $max ]]; then
      log_error "Scylla CQL did not become ready in time."
      exit 1
    fi
    sleep 2
  done
}

# When SCYLLA_SUPER_USERNAME and SCYLLA_SUPER_PASSWORD are set: create new superuser and disable
# the default cassandra role (LOGIN = false). When not set: fallback to cassandra/cassandra and
# do not ALTER the cassandra role.
replace_default_superuser() {
  local host="${CQLSH_HOST}"
  local port="${SCYLLA_NATIVE_TRANSPORT_PORT:-9042}"
  local new_super="${SCYLLA_SUPER_USERNAME}"
  local new_pass="${SCYLLA_SUPER_PASSWORD}"

  # Fallback to default cassandra/cassandra: do nothing, do not ALTER role
  [[ -z "$new_super" || -z "$new_pass" ]] && return

  log_info "Creating new superuser \"${new_super}\" and disabling default cassandra role."
  cqlsh -u "$SCYLLA_CQLSH_USER" -p "$SCYLLA_CQLSH_PASSWORD" "${host}" "${port}" -e \
    "CREATE ROLE IF NOT EXISTS \"${new_super}\" WITH PASSWORD = '${new_pass}' AND LOGIN = true AND SUPERUSER = true;"
  cqlsh -u "$SCYLLA_CQLSH_USER" -p "$SCYLLA_CQLSH_PASSWORD" "${host}" "${port}" -e \
    "ALTER ROLE cassandra WITH LOGIN = false;"
}

# Keyspace name: SCYLLA_KEYSPACE or SCYLLA_CLIO_KEYSPACE or clio
keyspace_name() {
  echo "${SCYLLA_KEYSPACE:-${SCYLLA_CLIO_KEYSPACE:-clio}}"
}

# Admin credentials for cqlsh: new superuser when SCYLLA_SUPER_* set, else default cassandra/cassandra.
admin_credentials() {
  if [[ -n "${SCYLLA_SUPER_USERNAME}" && -n "${SCYLLA_SUPER_PASSWORD}" ]]; then
    echo "${SCYLLA_SUPER_USERNAME}" "${SCYLLA_SUPER_PASSWORD}"
  else
    echo "${SCYLLA_CQLSH_USER}" "${SCYLLA_CQLSH_PASSWORD}"
  fi
}

create_keyspace() {
  local host="${CQLSH_HOST}"
  local port="${SCYLLA_NATIVE_TRANSPORT_PORT:-9042}"
  local keyspace
  keyspace="$(keyspace_name)"
  local user pass

  [[ -z "$keyspace" ]] && return

  read -r user pass <<< "$(admin_credentials)"

  log_info "Creating keyspace ${keyspace}."
  cqlsh -u "$user" -p "$pass" "${host}" "${port}" -e \
    "CREATE KEYSPACE IF NOT EXISTS ${keyspace} WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};"
}

# Create keyspace user (e.g. clio-cqlsh for Clio app) when SCYLLA_KEYSPACE_USERNAME and SCYLLA_KEYSPACE_PASSWORD are set.
# Falls back to SCYLLA_APP_USER / SCYLLA_APP_PASSWORD. Grants ALL on the keyspace.
create_keyspace_user() {
  local host="${CQLSH_HOST}"
  local port="${SCYLLA_NATIVE_TRANSPORT_PORT:-9042}"
  local keyspace
  keyspace="$(keyspace_name)"
  local app_user="${SCYLLA_KEYSPACE_USERNAME:-$SCYLLA_APP_USER}"
  local app_pass="${SCYLLA_KEYSPACE_PASSWORD:-$SCYLLA_APP_PASSWORD}"
  local admin_user admin_pass

  [[ -z "$app_user" || -z "$app_pass" ]] && return

  read -r admin_user admin_pass <<< "$(admin_credentials)"

  log_info "Creating keyspace user \"${app_user}\" and granting permissions on keyspace ${keyspace}."
  cqlsh -u "$admin_user" -p "$admin_pass" "${host}" "${port}" -e \
    "CREATE ROLE IF NOT EXISTS \"${app_user}\" WITH PASSWORD = '${app_pass}' AND LOGIN = true;"
  cqlsh -u "$admin_user" -p "$admin_pass" "${host}" "${port}" -e \
    "GRANT ALL PERMISSIONS ON KEYSPACE ${keyspace} TO \"${app_user}\";"
}

start() {
  local scylla_args=("$@")
  if [[ -n "${SCYLLA_OPTIONS_FILE:-}" ]]; then
    scylla_args=(--options-file "$SCYLLA_OPTIONS_FILE" "$@")
  fi

  SCYLLA_BIN="${SCYLLA_BIN:-$(command -v scylla 2>/dev/null || echo /usr/bin/scylla)}"
  log_info "Starting Scylla..."
  "$SCYLLA_BIN" "${scylla_args[@]}" &
  SCYLLA_PID=$!

  wait_for_cql
  replace_default_superuser
  create_keyspace
  create_keyspace_user

  wait "$SCYLLA_PID"
}
