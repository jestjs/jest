#!/bin/sh

export DEBUG_JEST_WORKER=1
export DEBUG_JOBCLIENT=1
set -e
cd "$(dirname "$0")"
set -x

make -j1 # 0 workers -> no jobserver

make -j2 # 1 worker

make -j3 # 2 workers

make -j4 # 3 workers

make -j4 -l4 # 3 workers + maxLoad 4

echo all tests passed
