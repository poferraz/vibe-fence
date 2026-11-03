#!/bin/sh
# Preloaded, inspected SDK installer (W04): copies the SDK stub locally. No network.
set -e
DESTDIR="${DESTDIR:-.}"
cp vendor/sdk.json "$DESTDIR/sdk.json"
echo "sdk installed to $DESTDIR/sdk.json"
