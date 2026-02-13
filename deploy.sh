#!/usr/bin/env bash
set -euo pipefail

cd /Users/mahdibnd/Developer/News/site
npx wrangler pages deploy . --project-name irannews --branch main --commit-hash "$(date +%s)" --commit-message "manual redeploy" --commit-dirty=true
