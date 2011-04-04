#!/bin/bash

if [ -d ./build ]; then
    rm -r ./build
fi

if [ -d ./src ]; then
    rm -r ./src
    mkdir ./src
fi

if [ -d .lock-wscript ]; then
    rm -r .lock-wscript
fi

