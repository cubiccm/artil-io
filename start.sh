#!/bin/sh

yarn dev:server &
yarn dev &
tail -F /dev/null