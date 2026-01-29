#!/bin/bash
# SSL cert setup for clio_server: generate or use existing certs in CLIO_CERTS_DIR.
# Source after defaults.sh; all variables (CONFIG_DIR, CLIO_CERTS_DIR,
# SSL_GENERATE, SSL_CERT_CN, SSL_CERT_DAYS, SSL_CERT_SUBJ, SSL_GENERATE_OVERWRITE,
# SSL_CERT_PATH) come from defaults.sh. Exports SSL_CERT_PATH when certs exist.
# After this, run build_ssl_derived (from defaults.sh) so SSL_LINES, etc. are set.

KEY_FILE="$CLIO_CERTS_DIR/clio.pem"
CRT_FILE="$CLIO_CERTS_DIR/clio.crt"

# If SSL_CERT_PATH is already set, leave it (caller provides their own certs)
if [ -n "${SSL_CERT_PATH}" ]; then
    if [ -f "${SSL_CERT_PATH}/clio.pem" ] && [ -f "${SSL_CERT_PATH}/clio.crt" ]; then
        log_info "Using existing SSL certs from SSL_CERT_PATH=${SSL_CERT_PATH}"
    else
        log_warn "SSL_CERT_PATH is set but clio.pem/clio.crt not found in ${SSL_CERT_PATH}; SSL may fail"
    fi
    return 0
fi

# SSL_GENERATE=1: generate self-signed certs into CLIO_CERTS_DIR
if [ "${SSL_GENERATE}" = "1" ] || [ "${SSL_GENERATE}" = "true" ] || [ "${SSL_GENERATE}" = "yes" ]; then
    if ! command -v openssl &>/dev/null; then
        log_error "SSL_GENERATE=1 but openssl not found; install openssl or set SSL_CERT_PATH to existing certs"
        return 1
    fi
    mkdir -p "$CLIO_CERTS_DIR"
    SUBJ="${SSL_CERT_SUBJ:-/CN=${SSL_CERT_CN:-localhost}}"
    if [ -f "$KEY_FILE" ] && [ -f "$CRT_FILE" ]; then
        log_info "SSL certs already exist in $CLIO_CERTS_DIR; skipping generation (set SSL_GENERATE_OVERWRITE=1 to replace)"
        if [ "${SSL_GENERATE_OVERWRITE}" != "1" ] && [ "${SSL_GENERATE_OVERWRITE}" != "true" ]; then
            export SSL_CERT_PATH="$CLIO_CERTS_DIR"
            return 0
        fi
    fi
    log_info "Generating self-signed SSL cert and key in $CLIO_CERTS_DIR (CN=${SSL_CERT_CN:-localhost}, days=${SSL_CERT_DAYS:-365})"
    if openssl req -x509 -newkey rsa:4096 -keyout "$KEY_FILE" -out "$CRT_FILE" \
        -days "${SSL_CERT_DAYS:-365}" -nodes -subj "$SUBJ" 2>/dev/null; then
        chmod 600 "$KEY_FILE"
        chmod 644 "$CRT_FILE"
        export SSL_CERT_PATH="$CLIO_CERTS_DIR"
        log_info "SSL certs written: $KEY_FILE, $CRT_FILE"
    else
        log_error "Failed to generate SSL certs in $CLIO_CERTS_DIR"
        return 1
    fi
    return 0
fi          

# If certs already exist in CLIO_CERTS_DIR, use them (e.g. bind-mount or prior run)
if [ -f "$KEY_FILE" ] && [ -f "$CRT_FILE" ]; then
    export SSL_CERT_PATH="$CLIO_CERTS_DIR"
    log_info "Using existing SSL certs in $CLIO_CERTS_DIR"
    return 0
fi

# No SSL: SSL_CERT_PATH stays unset; build_ssl_derived will not add ssl_key/ssl_cert.   
return 0
