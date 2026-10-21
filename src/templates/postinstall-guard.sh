#!/bin/sh
# vibe-fence postinstall guard (GEM-01 P0) — runs integrity check on npm install
# Installed to .fence/hooks/postinstall-guard.sh by tools/install.ts
# Exits 1 on attestation fail, 0 on pass/unknown.

# Prefer bun if available, fallback to node
if command -v bun >/dev/null 2>&1; then
  bun -e "const { postinstallGuard } = require('./src/framework/integrity.js'); postinstallGuard()" 2>&1
  _rc=$?
  if [ $_rc -ne 0 ]; then exit $_rc; fi
else
  node -e "require('./src/framework/integrity.js').postinstallGuard()" 2>&1
  _rc=$?
  if [ $_rc -ne 0 ]; then exit $_rc; fi
fi
