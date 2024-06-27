#!/bin/bash

DOCKER () {
    if [ $type = 'SOURCE' ]; then  
        docker compose up -d --build xrpl-build-$opt
    elif [ $type = 'PREBUILT' ]; then
        docker compose up -d --build xrpl-$opt
    else
        echo 'Not a valid response. Try again.'
        exit 1
    fi
}

CHECK_INPUT() {
    echo "........."
    echo "Does everything look correct? 

    Build-Type: $type
    Node: $opt
    NetworkID: $netId

    To proceed, indicate [Y]/[n] "

    read x

    if [ $x = 'n' ]; then  
        echo "Exiting..."
        exit 1
    elif [ $x = 'Y' ]; then
        echo "Input validated. Proceeding to next step..."
    else
        echo 'Not a valid response. Try again.'
        exit 1
    fi
}

MAINNET() {
    echo "Moving MAINNET configuration files"

    rm -r ../images/xrpl/rippled.cfg
    rm -r ../images/xrpl/validators.txt

    cp ../config/xrpl/mainnet/rippled.cfg ../images/xrpl
    cp ../config/xrpl/mainnet/validators.txt ../images/xrpl
    DOCKER
    exit 1
}

TESTNET() {
    echo "Moving TESTNET configuration files"

    rm -r ../images/xrpl/rippled.cfg
    rm -r ../images/xrpl/validators.txt

    cp ../config/xrpl/testnet/rippled.cfg ../images/xrpl
    cp ../config/xrpl/testnet/validators.txt ../images/xrpl
    DOCKER
    exit 1
}


DEVNET() {
    echo "Moving DEVNET configuration files"

    rm -r ../images/xrpl/rippled.cfg
    rm -r ../images/xrpl/validators.txt

    cp ../config/xrpl/devnet/rippled.cfg ../images/xrpl
    cp ../config/xrpl/devnet/validators.txt ../images/xrpl
    DOCKER
    exit 1
}

AMM() {
    echo "Moving AMM configuration files"

    rm -r ../images/xrpl/rippled.cfg
    rm -r ../images/xrpl/validators.txt

    cp ../config/xrpl/amm/rippled.cfg ../images/xrpl
    cp ../config/xrpl/amm/validators.txt ../images/xrpl
    DOCKER
    exit 1
}

echo "........."
PS3='Indicate whether to build from source or to build for prebuilt package:'
options=("Build from source" "Build from prebuilt image")
select i in "${options[@]}"
do
    case $i in
        "Build from source")
            type='SOURCE'
            break
            ;;
        "Build from prebuilt image")
            type='PREBUILT'
            break
            ;;
        "Exit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done

echo "........."
PS3='Please select one of the possible xrpl nodes: '
options=("mainnet" "testnet" "devnet" "amm")
select opt in "${options[@]}"
do
    case $opt in
        "mainnet")
            netId=0
            CHECK_INPUT
            MAINNET
            ;;
        "testnet")
            netId=1
            CHECK_INPUT
            TESTNET
            ;;
        "devnet")
            netId=2
            CHECK_INPUT
            DEVNET
            ;;
        "amm")
            netId=25
            CHECK_INPUT
            AMM
            ;;
        "Exit")
            break
            ;;
        *) echo "invalid option $REPLY";;
    esac
done