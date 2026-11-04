#!/bin/sh
# Launch Muse without printing or persisting the optional key-file credential.
set -eu
set +x
if [ "$#" -gt 1 ]; then
  printf 'Usage: sh launch.sh [path-to-env-file]\n' >&2
  exit 2
fi
if [ "$#" -eq 1 ]; then
  VF_META_KEY=$(node --env-file="$1" -e 'process.stdout.write(process.env.MUSE_API_KEY || process.env.META_API_KEY || "")')
  if [ -z "$VF_META_KEY" ]; then
    printf 'No MUSE_API_KEY or META_API_KEY was found in the supplied environment.\n' >&2
    exit 1
  fi
  META_API_KEY=$VF_META_KEY
  export META_API_KEY
  unset VF_META_KEY
fi
MUSE_NO_AUTO_UPDATE=1
export MUSE_NO_AUTO_UPDATE
# The recording deliberately exercises Muse's file-editing tools in the
# disposable project; shell access is disabled for this rehearsal.
exec muse --model muse-spark-1.3 --contributor-mode off --disable-shell --trust-workspace
