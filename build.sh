#!/bin/bash
# Build script for Railway - only builds main app if needed, otherwise runs bot

if [ -f "vite.config.ts" ]; then
  # Build main TypeScript server if needed
  npm run build 2>/dev/null || true
else
  # Just prepare bot dependencies
  cd bot
  npm ci
  cd ..
fi
