# Connect Supabase — AltoRich

Before Sprint 2 features work with live data, configure your Supabase project.

## 1. Create or link a project

```bash
# Install CLI if needed: brew install supabase/tap/supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in from **Supabase Dashboard → Project Settings → API**:

| Variable | Where |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (server only) |

## 3. Apply migrations

```bash
supabase db push
```

This applies:

- `20260708160000_foundation_schema.sql`
- `20260708170000_sprint1_storage_security.sql`
- `20260708220000_sprint2_investment_engine.sql`

## 4. Create an admin user

1. Sign up at `/signup`
2. In Supabase SQL editor:

```sql
INSERT INTO admin_roles (user_id, role)
VALUES ('YOUR_USER_UUID', 'super_admin');
```

## 5. Verify

```bash
npm run verify:db
npm run verify:rls
npm run dev
```

The yellow setup banner should disappear once env vars are set and the dev server restarted.

## Local development (optional)

Requires Docker Desktop:

```bash
supabase start
supabase db reset
```

Use the local URL and keys printed by `supabase status` in `.env.local`.
