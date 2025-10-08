# Scraper Worker Edge Function

Edge Function qui exécute le scraper GitHub dans Supabase.

## Déploiement

```bash
# 1. Installer Supabase CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link au projet
supabase link --project-ref nykctocknzbstdqnfkun

# 4. Configurer les secrets
supabase secrets set GITHUB_TOKEN=ghp_xxx...

# 5. Déployer
supabase functions deploy scraper-worker
```

## Configuration Cron

Dans le dashboard Supabase, créer un cron job :
```sql
select cron.schedule(
  'github-security-scan',
  '*/15 * * * *', -- Toutes les 15 minutes
  $$
  select
    net.http_post(
      url:='https://nykctocknzbstdqnfkun.supabase.co/functions/v1/scraper-worker',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

## Test local

```bash
supabase functions serve scraper-worker --env-file .env
```
