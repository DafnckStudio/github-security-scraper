# 🚀 Déploiement Vercel - Instructions Finales

## ✅ **Code Poussé sur GitHub avec Succès !**

**Repository :** https://github.com/DafnckStudio/github-security-scraper

---

## 🎯 **Déploiement en 2 Étapes**

### 1️⃣ **Dashboard UI sur Vercel** (2 min)

#### Option A : Via Dashboard Vercel (Recommandé)

1. Aller sur **https://vercel.com**
2. Cliquer sur **"Add New..."** → **"Project"**
3. **Import Git Repository**
4. Sélectionner : `DafnckStudio/github-security-scraper`
5. **Configuration** :
   ```
   Framework Preset : Other
   Root Directory : ui
   Build Command : (laisser vide)
   Output Directory : .
   Install Command : (laisser vide)
   ```
6. Cliquer sur **"Deploy"**

✅ **Dashboard sera en ligne en 1-2 minutes !**

URL : `https://github-security-scraper.vercel.app`

---

### 2️⃣ **Worker sur Supabase** (OBLIGATOIRE - 2 min)

⚠️ **IMPORTANT** : Vercel ne peut PAS exécuter le worker scraper (timeout 10-60s max)

Le worker DOIT tourner sur Supabase :

```bash
# 1. Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# 2. Login
supabase login

# 3. Link au projet
supabase link --project-ref nykctocknzbstdqnfkun

# 4. Configurer les secrets (remplacer par vos valeurs)
supabase secrets set GITHUB_TOKEN=ghp_votre_token
supabase secrets set TELEGRAM_BOT_TOKEN=votre_bot_token
supabase secrets set TELEGRAM_CHAT_ID=votre_chat_id
supabase secrets set TELEGRAM_NOTIFICATIONS=true

# 5. Déployer
supabase functions deploy scraper-worker
```

### Configurer le Cron (1 min)

Dashboard Supabase → SQL Editor :

```sql
SELECT cron.schedule(
  'github-scraper',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nykctocknzbstdqnfkun.supabase.co/functions/v1/scraper-worker',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

---

## 📱 **Tester Telegram Maintenant**

```bash
npm run test-telegram
```

Vous devriez recevoir 2 messages :
1. ✅ Test de connexion
2. 🔴 Exemple de finding

---

## ✅ **Résultat Final**

Une fois les 2 étapes complétées :

✅ **Dashboard** : https://github-security-scraper.vercel.app
✅ **Worker** : Tourne 24/7 sur Supabase
✅ **Scan** : Automatique toutes les 15 min
✅ **Telegram** : Notifications temps réel
✅ **Coût** : $0/mois (100% gratuit)

---

## 🎯 **Architecture Finale**

```
┌────────────────────────────────┐
│   VERCEL (Dashboard UI)        │
│   https://xxx.vercel.app       │
│   Gratuit - CDN global         │
└────────────────────────────────┘

┌────────────────────────────────┐
│   SUPABASE (Worker + DB)       │
│   Edge Function + Cron         │
│   Gratuit - Auto-run           │
└────────────────────────────────┘

┌────────────────────────────────┐
│   TELEGRAM (Notifications)     │
│   Channel privé                │
│   Gratuit - Temps réel         │
└────────────────────────────────┘
```

**Coût total : $0/mois** 💚
**Auto-run : Oui** (cron SQL) ✅
**Sécurité : Maximale** 🔐

---

## 📊 **Monitoring**

### Vercel Dashboard
- URL : https://vercel.com/dashboard
- Voir les déploiements, analytics, logs

### Supabase Edge Function
- URL : https://supabase.com/dashboard/project/nykctocknzbstdqnfkun
- Edge Functions → scraper-worker → Logs

### Telegram
- Notifications automatiques dans votre channel

---

## 🔧 **Commandes Utiles**

```bash
# Tester Telegram
npm run test-telegram

# Obtenir Chat ID
npm run get-chat-id

# Vérifier setup
npm run verify

# Test manuel worker
curl https://nykctocknzbstdqnfkun.supabase.co/functions/v1/scraper-worker

# Voir les logs Supabase
supabase functions logs scraper-worker
```

---

## ⚠️ **Important**

**Vercel** = Dashboard UI uniquement (parfait pour ça)
**Supabase** = Worker scraper (DOIT être déployé pour que ça tourne 24/7)

Sans Supabase, le scraper ne tournera PAS automatiquement !

---

**Repo GitHub :** https://github.com/DafnckStudio/github-security-scraper
**Dashboard Vercel :** (après déploiement)
**Worker Supabase :** À déployer maintenant

🚀 **C'est parti !**
