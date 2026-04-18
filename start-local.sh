#!/usr/bin/env bash
# ============================================================
# Start ekap-nextjs-mfe for local development
#   Infrastructure + backends: Docker (ports shifted +200)
#   Frontend dev servers: Next.js (port 5100) + Webpack (port 5101)
#   Note: port 5000 is reserved by macOS AirPlay Receiver
# ============================================================
set -uo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

COMPOSE_ARGS="-f docker-compose.yml -f docker-compose.local.yml"
export COMPOSE_PROJECT_NAME=ekap-nextjs

cleanup() {
  echo ""
  echo "Shutting down ekap-nextjs-mfe..."
  [[ -n "${SHELL_PID:-}" ]] && kill "$SHELL_PID" 2>/dev/null || true
  [[ -n "${HR_PID:-}" ]]    && kill "$HR_PID"    2>/dev/null || true
  docker compose $COMPOSE_ARGS down
}
trap cleanup INT TERM

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "⚠  Copied .env.example → .env  — add your ANTHROPIC_API_KEY before first use."
fi

echo "▶  Starting infrastructure and backend services (ports shifted to avoid conflicts)..."
docker compose $COMPOSE_ARGS up -d \
  zookeeper kafka postgres redis weaviate chat-service hr-service doc-processor \
  || echo "⚠  Some Docker services failed to start — run: docker compose $COMPOSE_ARGS ps"

for dir in frontend/remotes/hr-namechange frontend/shell; do
  if [[ ! -d "$REPO_DIR/$dir/node_modules" ]]; then
    echo "▶  Installing $dir dependencies..."
    (cd "$REPO_DIR/$dir" && npm install --legacy-peer-deps) || echo "⚠  npm install failed in $dir"
  fi
done

echo "▶  Starting frontend dev servers..."
(cd "$REPO_DIR/frontend/remotes/hr-namechange" && npm run dev -- --port 5101 2>&1 | sed 's/^/[hr-namechange] /') &
HR_PID=$!

sleep 2

(cd "$REPO_DIR/frontend/shell" && \
  NEXT_PUBLIC_CHAT_SERVICE_URL=http://localhost:8200 \
  NEXT_PUBLIC_HR_SERVICE_URL=http://localhost:8201 \
  NEXT_PUBLIC_DOC_PROCESSOR_URL=http://localhost:8202 \
  NEXT_PUBLIC_REMOTE_HR_NAMECHANGE_URL=http://localhost:5101 \
  npm run dev -- -p 5100 2>&1 | sed 's/^/[shell]        /') &
SHELL_PID=$!

echo ""
echo "✅ ekap-nextjs-mfe is starting up"
echo "   Chat shell:    http://localhost:5100/chat"
echo "   HR namechange: http://localhost:5101"
echo "   Chat API:      http://localhost:8200"
echo ""
echo "Press Ctrl+C to stop."
wait
