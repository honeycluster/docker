#!/bin/bash
# Default environment variable values for rippled

export NETWORK_ID="${NETWORK_ID:-devnet}"

export IPS="${IPS:-s.devnet.rippletest.net 51235}"

export VALIDATOR_LIST_SITES="${VALIDATOR_LIST_SITES:-https://vl.devnet.rippletest.net}"
export VALIDATOR_LIST_KEYS="${VALIDATOR_LIST_KEYS:-EDBB54B0D9AEE071BB37784AF5A9E7CC49AC7A0EFCE868C54532BCB966B9CFC13B}"
