# 🚀 Déploiement Supabase Edge Functions

## 🎯 Pourquoi Supabase Edge Functions ?

✅ **Serverless** : Pas de serveur à gérer
✅ **Auto-scaling** : S'adapte automatiquement
✅ **Cron intégré** : Exécution programmée native
✅ **Gratuit** : Jusqu'à 2 millions d'invocations/mois
✅ **Rapide** : Déploiement en 2 minutes

---

## 🚀 Déploiement Rapide (2 minutes)

### 1️⃣ Installer Supabase CLI

```bash
npm install -g supabase
```

### 2️⃣ Login

```bash
supabase login
```

Une fenêtre de navigateur s'ouvrira pour vous connecter.

### 3️⃣ Link au Projet

```bash
cd /Users/hacker/Desktop/github/github-security-scraper
supabase link --project-ref nykctocknzbstdqnfkun
```

Entrez votre **database password** quand demandé.

### 4️⃣ Configurer les Secrets

```bash
# GitHub Token
supabase secrets set GITHUB_TOKEN=ghp_votre_token_ici

# Telegram (si configuré)
supabase secrets set TELEGRAM_BOT_TOKEN=123456789:ABC...
supabase secrets set TELEGRAM_CHAT_ID=-1001234567890
supabase secrets set TELEGRAM_NOTIFICATIONS=true
```

### 5️⃣ Déployer l'Edge Function

```bash
supabase functions deploy scraper-worker
```

Vous devriez voir :
```
Deploying scraper-worker...
✓ Function deployed successfully
Function URL: https://nykctocknzbstdqnfkun.supabase.co/functions/v1/scraper-worker
```

---

## ⏰ Configuration du Cron Job

### Méthode 1 : Via SQL (Recommandé)

Dans le **SQL Editor** de Supabase :

```sql
-- Installer l'extension pg_cron (si pas déjà fait)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Créer le cron job : toutes les 15 minutes
SELECT cron.schedule(
  'github-security-scraper-15min',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://nykctocknzbstdqnfkun.supabase.co/functions/v1/scraper-worker',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := '{}'::jsonb
    );
  $$
);
```

### Méthode 2 : Via Dashboard

1. Aller sur https://supabase.com/dashboard/project/nykctocknzbstdqnfkun
2. Database → Cron Jobs
3. Create a new job :
   - **Name** : `github-security-scraper`
   - **Schedule** : `*/15 * * * *` (toutes les 15 min)
   - **Command** : Voir SQL ci-dessus

---

## 🔍 Vérifier les Cron Jobs

### Lister les jobs actifs

```sql
SELECT 
  jobid,
  schedule,
  command,
  active,
  jobname
FROM cron.job
WHERE jobname LIKE '%github%';
```

### Voir l'historique d'exécution

```sql
SELECT 
  runid,
  jobid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'github-security-scraper-15min')
ORDER BY start_time DESC
LIMIT 10;
```

### Désactiver temporairement

```sql
UPDATE cron.job
SET active = false
WHERE jobname = 'github-security-scraper-15min';
```

### Réactiver

```sql
UPDATE cron.job
SET active = true
WHERE jobname = 'github-security-scraper-15min';
```

---

## 📊 Monitoring

### Logs de l'Edge Function

Dans le dashboard Supabase :
1. **Edge Functions** → `scraper-worker`
2. **Logs** tab
3. Voir les exécutions en temps réel

### Invocations

```sql
-- Voir les statistiques d'invocation
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as invocations,
  AVG(execution_time_ms) as avg_time_ms
FROM edge_functions_logs
WHERE function_name = 'scraper-worker'
GROUP BY hour
ORDER BY hour DESC
LIMIT 24;
```

---

## 🧪 Test Manuel

### Via curl

```bash
curl -X POST \
  'https://nykctocknzbstdqnfkun.supabase.co/functions/v1/scraper-worker' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Via Dashboard

1. Edge Functions → `scraper-worker`
2. **Invoke function** button
3. Body : `{}`
4. Run

Vous devriez recevoir :
```json
{
  "success": true,
  "scanId": "abc-123",
  "totalResults": 42,
  "findingsCount": 5,
  "message": "Scan completed successfully"
}
```

---

## 🔧 Mise à Jour de la Function

### Modifier le code

```bash
# Éditer le fichier
nano supabase/functions/scraper-worker/index.ts

# Redéployer
supabase functions deploy scraper-worker
```

Railway détecte automatiquement les changements !

---

## 💰 Coûts Supabase

### Plan Gratuit

```
✅ 2 millions d'invocations/mois
✅ 500,000 invocations Edge Functions
✅ 1GB de stockage
✅ Parfait pour ce scraper
```

**Avec un scan toutes les 15 min :**
```
60/15 = 4 scans/heure
4 x 24 = 96 scans/jour
96 x 30 = 2,880 scans/mois

✅ Largement dans la limite gratuite !
```

### Plan Pro ($25/mois)

Seulement si vous avez besoin de :
- Plus d'invocations
- Support prioritaire
- Analytics avancés

**Pour ce scraper : Plan gratuit suffisant ! 💰**

---

## 🎯 Configurations Multiples

### Option 1 : Edge Function UNIQUEMENT

```
✅ Serverless
✅ Gratuit
✅ Auto-scale
⚠️ Cold starts (~1-2s)
```

**Recommandé pour :** Tests, petits volumes

### Option 2 : Railway UNIQUEMENT

```
✅ Always warm
✅ Logs riches
✅ Contrôle total
⚠️ Coût : $5-10/mois
```

**Recommandé pour :** Production, gros volumes

### Option 3 : Les DEUX (Redondance)

```
✅ Maximum uptime
✅ Backup automatique
✅ Load balancing
⚠️ Coût : $5-10/mois
```

**Configuration :**
- **Railway** : Scan toutes les 15 min
- **Supabase** : Scan toutes les 30 min (backup)

**Recommandé pour :** Production critique

---

## 🔒 Sécurité

### Secrets Management

```bash
# Lister les secrets
supabase secrets list

# Supprimer un secret
supabase secrets unset SECRET_NAME

# Mettre à jour un secret
supabase secrets set SECRET_NAME=new_value
```

### Accès à la Function

Par défaut, l'Edge Function est **publique** mais nécessite l'Anon Key.

Pour restreindre :

```typescript
// Vérifier l'authentification
const authHeader = req.headers.get('authorization');
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return new Response('Unauthorized', { status: 401 });
}
```

---

## 🐛 Troubleshooting

### "Function not found"

```bash
# Vérifier que la function est déployée
supabase functions list
```

### "Secret not found"

```bash
# Vérifier les secrets
supabase secrets list

# Ajouter le secret manquant
supabase secrets set GITHUB_TOKEN=ghp_xxx
```

### "Cold start timeout"

Les cold starts peuvent prendre 1-2 secondes.
→ Normal pour une Edge Function serverless

### "Out of memory"

Edge Functions ont 150MB de RAM par défaut.
→ Réduire `MAX_RESULTS_PER_SCAN` à 50 ou moins

---

## 📊 Monitoring Avancé

### Voir les erreurs

```sql
SELECT 
  timestamp,
  status_code,
  error_message,
  execution_time_ms
FROM edge_functions_logs
WHERE function_name = 'scraper-worker'
  AND status_code >= 400
ORDER BY timestamp DESC
LIMIT 20;
```

### Alertes sur échecs

```sql
-- Créer une function qui envoie une alerte si trop d'échecs
CREATE OR REPLACE FUNCTION check_scraper_health()
RETURNS void AS $$
DECLARE
  failure_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO failure_count
  FROM edge_functions_logs
  WHERE function_name = 'scraper-worker'
    AND status_code >= 400
    AND timestamp > now() - interval '1 hour';
  
  IF failure_count > 3 THEN
    -- Envoyer une alerte (via webhook ou autre)
    PERFORM net.http_post(
      url := 'YOUR_WEBHOOK_URL',
      body := jsonb_build_object(
        'alert', 'Scraper failing',
        'failures', failure_count
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Exécuter toutes les heures
SELECT cron.schedule(
  'check-scraper-health',
  '0 * * * *',
  'SELECT check_scraper_health();'
);
```

---

## 🎯 Stratégies de Déploiement

### Développement

```bash
# Test local
supabase functions serve scraper-worker --env-file .env

# Test dans le navigateur
open http://localhost:54321/functions/v1/scraper-worker
```

### Staging

```bash
# Déployer sur un projet de staging
supabase link --project-ref your-staging-project
supabase functions deploy scraper-worker
```

### Production

```bash
# Déployer sur production
supabase link --project-ref nykctocknzbstdqnfkun
supabase functions deploy scraper-worker
```

---

## 📚 Ressources

- **Supabase Edge Functions** : https://supabase.com/docs/guides/functions
- **pg_cron** : https://github.com/citusdata/pg_cron
- **Deno Deploy** : https://deno.com/deploy

---

## ✅ Checklist de Déploiement

- [ ] Supabase CLI installé
- [ ] Login réussi
- [ ] Projet linké (`nykctocknzbstdqnfkun`)
- [ ] Secrets configurés (GITHUB_TOKEN, TELEGRAM_*)
- [ ] Edge Function déployée
- [ ] Cron job créé (toutes les 15 min)
- [ ] Test manuel réussi
- [ ] Notification Telegram reçue
- [ ] Logs consultés dans dashboard

---

## 🎉 Résultat Final

Une fois déployé :

✅ **Serverless** : Aucun serveur à gérer
✅ **Auto-scale** : S'adapte à la charge
✅ **Cron SQL** : Exécution toutes les 15 min
✅ **Telegram** : Notifications temps réel
✅ **Gratuit** : Plan gratuit suffisant

**Temps de déploiement : 2 minutes** ⏱️
**Coût : $0/mois** (plan gratuit) 💰

---

**Prochaine étape : Déployer !**

```bash
supabase functions deploy scraper-worker
```

Version 3.0 - Supabase Ready
Octobre 2025
