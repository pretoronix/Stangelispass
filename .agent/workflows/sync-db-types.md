---
description: Verify that the database schema matches the TypeScript type definitions.
---

1. List most recent migrations
// turbo
```bash
ls -rt app/supabase/migrations | tail -n 5
```

2. Review `database.types.ts` for corresponding tables
// turbo
```bash
grep -n "Tables:" app/src/types/database.types.ts
```

3. Run database health check
// turbo
```bash
node app/scripts/db-check.mjs
```

4. If drift is detected, use the `Database & Type Architect` skill to plan updates.
