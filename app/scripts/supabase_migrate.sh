#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ACTION="${1:-push}"
PROJECT_REF_FILE="supabase/.temp/project-ref"

if ! command -v supabase >/dev/null 2>&1; then
  echo "Error: Supabase CLI not found. Install it first: brew install supabase/tap/supabase"
  exit 1
fi

ensure_linked() {
  if [[ -f "$PROJECT_REF_FILE" ]]; then
    return 0
  fi

  if [[ -n "${SUPABASE_PROJECT_REF:-}" ]]; then
    echo "Linking to project: ${SUPABASE_PROJECT_REF}"
    supabase link --project-ref "${SUPABASE_PROJECT_REF}"
    return 0
  fi

  echo "Error: no linked Supabase project found."
  echo "Run: supabase link --project-ref <your-project-ref>"
  echo "Or set SUPABASE_PROJECT_REF and rerun this script."
  exit 1
}

case "$ACTION" in
  push)
    ensure_linked
    echo "Applying migrations to linked Supabase project..."
    supabase db push --linked
    ;;
  status)
    ensure_linked
    echo "Migration status for linked Supabase project:"
    supabase migration list --linked
    ;;
  reset-local)
    echo "Resetting local Supabase database..."
    supabase db reset
    ;;
  *)
    echo "Unknown action: $ACTION"
    echo "Usage: bash scripts/supabase_migrate.sh [push|status|reset-local]"
    exit 1
    ;;
esac
