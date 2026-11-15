# Supabase setup

## 1. Project

1. Create a project (recommend **Mumbai** for Indian customers; latency matters
   more than price at this scale).
2. Save the database password in your password manager.
3. Note the project URL and the publishable key (Project settings → API).
4. Copy the service-role key into Vercel as `SUPABASE_SERVICE_ROLE_KEY`. It is
   shown once and must never appear in a client bundle.

## 2. Schema

Install the CLI, then:

```bash
supabase link --project-ref <ref>
supabase db push                 # applies supabase/migrations/*.sql
psql "$DATABASE_URL" -f supabase/seed.sql
```

Or paste the files in order into the SQL editor:

1. `0001_schema.sql`
2. `0002_functions.sql`
3. `0003_rls.sql`
4. `0004_admin_support.sql`
5. `supabase/seed.sql`

The seed intentionally leaves every model disabled and inserts **no**
generation pricing, so a fresh environment cannot charge anyone.

## 3. Auth settings

* **Site URL**: `https://<domain>`
* **Redirect URLs**: `https://<domain>/api/v1/auth/callback`,
  `http://127.0.0.1:3000/api/v1/auth/callback`, plus the preview pattern.
* **Email confirmation**: on for production.
* **Password minimum**: 8 characters (matches the Zod schema).
* **Email templates**: the confirmation and recovery templates should point at
  `/api/v1/auth/callback?next=/dashboard` and `/login?mode=recovery`.

## 4. First administrator

There is no sign-up path to admin, on purpose. After creating your own account:

```sql
-- 1. promote in the profile mirror
update public.profiles set role = 'admin' where id = '<user-uuid>';

-- 2. write the claim the API actually reads
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
                           || jsonb_build_object('app_role', 'admin', 'admin_role', 'owner')
 where id = '<user-uuid>';
```

The user must sign out and back in for the new JWT to carry the claim. Use
`admin_role` values `owner`, `admin`, `support` or `analyst`; permissions per role
are in `src/lib/auth/security` (`src/lib/auth/session.ts`).

Further role changes should go through `set_user_role(...)` so the audit table
records them.

## 5. Row-level security

Do not disable RLS in the dashboard. Policies live in `0003_rls.sql`. To confirm
after a deploy:

```sql
select tablename, rowsecurity from pg_tables where schemaname = 'public';
```

Every row must be `t`. Then, from a signed-in browser session using only the
publishable key, `select * from credit_wallets` must return only your own row.

## 6. Backups and PITR

Enable point-in-time recovery before the first real payment. Without it, a bad
migration or a mistaken `delete` is unrecoverable. Retention length and plan tier
are owner decisions (`docs/owner-inputs.md` §29).

## 7. Types

```bash
supabase gen types typescript --project-id <ref> --schema public \
  > src/lib/supabase/database.types.ts
```

Then replace the local row interfaces in `src/services/**` with the generated
types.
