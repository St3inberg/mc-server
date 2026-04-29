#!/usr/bin/env bash
# Run this on YOUR LOCAL PC to create a zip ready to upload
cd "$(dirname "$0")/.."
zip -r netztech.zip mc-server/ \
  --exclude 'mc-server/data/*' \
  --exclude 'mc-server/.agents/*' \
  --exclude 'mc-server/.claude/*' \
  --exclude 'mc-server/minecraft/paper.jar' \
  --exclude 'mc-server/website/backend/node_modules/*'
echo ""
echo "Created: netztech.zip"
echo "Upload this file to Oracle Cloud Shell"
