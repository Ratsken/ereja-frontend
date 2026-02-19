#!/usr/bin/env bash
set -e

cd /app

# helper to install deps if missing
ensure_deps() {
  if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock" ]; then
    echo "Installing dependencies inside container... (using legacy peer deps)"
    npm ci --legacy-peer-deps --no-audit --no-fund || npm install --legacy-peer-deps --no-audit --no-fund
  fi
}

case "$1" in
  dev)
    ensure_deps
    echo "Running in dev mode: starting next dev"
    # Run next directly to ensure the port comes from the env (avoid stale package.json values)
    exec sh -c "npx next dev -p ${PORT:-9003} 2>&1 | tee dev.log"
    ;;
  pm2|prod)
    ensure_deps
    # Build if standalone bundle not present
    if [ ! -d ".next/standalone" ]; then
      echo "Building Next.js standalone..."
      npm run build || true
    fi
    echo "Starting pm2 (pm2-runtime) with ecosystem.config.js..."
    exec pm2-runtime /app/ecosystem.config.js
    ;;
  *)
    # If any other command was provided, run it
    if [ "$#" -gt 0 ]; then
      exec "$@"
    else
      ensure_deps
      exec pm2-runtime /app/ecosystem.config.js
    fi
    ;;
esac
