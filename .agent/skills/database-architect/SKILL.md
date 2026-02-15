---
name: Database & Type Architect
description: Skill for ensuring Supabase schema and TypeScript types are synchronized.
---

# Database & Type Architect

This skill ensures that the database schema (migrations) and the TypeScript definitions in `database.types.ts` are always in sync.

## Capabilities
- **Schema Drift Detection**: Compares `app/supabase/migrations` against `app/src/types/database.types.ts`.
- **Type Generation**: (Manual/Semi-automated) Provides patterns for updating TypeScript types after schema changes.
- **Connection Health**: Verifies connectivity and table accessibility.

## Usage
Use the provided workflows:
- `sync-db-types`: Checks for drift between the SQL schema and TypeScript types.
- `verify-db-connection`: Runs a health check on the live database.

## Related Files
- `app/supabase/migrations/`
- `app/src/types/database.types.ts`
- `app/scripts/db-check.mjs`
