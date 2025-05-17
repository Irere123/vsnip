#!/bin/bash -e

if [ "$UID" -eq 0 ]; then
  set +e # disable failing on errror
  ulimit -n 65535
  echo "NEW ULIMIT: $(ulimit -n)"
  set -e # enable failing on error
else
  echo ENTRYPOINT DID NOT RUN AS ROOT
fi

node --max-old-space-size=8192 dist/index.js
