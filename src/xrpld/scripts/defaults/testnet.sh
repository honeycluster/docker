#!/bin/bash
# Default environment variable values for rippled

export NETWORK_ID="${NETWORK_ID:-testnet}"

export IPS="${IPS:-s.altnet.rippletest.net 51235}"

export VALIDATOR_LIST_SITES="${VALIDATOR_LIST_SITES:-https://vl.altnet.rippletest.net}"
export VALIDATOR_LIST_KEYS="${VALIDATOR_LIST_KEYS:-ED264807102805220DA0F312E71FC2C69E1552C9C5790F6C25E3729DEB573D5860}"
