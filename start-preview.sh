#!/usr/bin/env bash
set -e
[ -f .env.local ] || cp .env.example .env.local
[ -d node_modules ] || npm install
( sleep 4; printf 'Open http://localhost:3000 in your browser\n' ) &
npm run dev
