# 🚀 DÉPLOIEMENT RAPIDE - 10 Minutes Chrono

## 🎯 Objectif

Déployer le scraper en production pour qu'il tourne **24/7** avec **notifications Telegram**.

---

## ⚡ Option 1 : Railway (Recommandé - 10 min)

### Étape 1 : Telegram (2 min)

```bash
# 1. Créer un bot : @BotFather sur Telegram
# 2. Copier le token : 123456789:ABC...
# 3. Créer un channel privé
# 4. Ajouter le bot comme admin
# 5. Obtenir le Chat ID
```

📖 **Guide complet** : [docs/TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md)

### Étape 2 : GitHub Repo (3 min)

```bash
cd /Users/hacker/Desktop/github/github-security-scraper

git init
git add .
git commit -m "feat: GitHub Security Scraper v3.0"

# Créer sur https://github.com/new
git remote add origin https://github.com/VOTRE_USERNAME/github-security-scraper.git
git push -u origin main
```

### Étape 3 : Railway Deploy (5 min)

1. **Aller sur** https://railway.app
2. **Login** avec GitHub
3. **New Project** → Deploy from GitHub repo
4. **Sélectionner** `github-security-scraper`
5. **Ajouter les variables** :

```env
GITHUB_TOKEN=ghp_votre_token
SUPABASE_URL=https://nykctocknzbstdqnfkun.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a2N0b2Nrbnpic3RkcW5ma3VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIzMzAwNiwiZXhwIjoyMDczODA5MDA2fQ.V13I-7UULEr1r-IiHRsEw1ijvQKR1VwHVZextEKPH8s
SCRAPER_INTERVAL_MINUTES=15
MAX_RESULTS_PER_SCAN=100
ENABLE_NOTIFICATIONS=true
TELEGRAM_NOTIFICATIONS=true
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_CHAT_ID=-1001234567890
ALERT_EMAIL=studio@dafnck.com
NODE_ENV=production
LOG_LEVEL=info
```

6. **Deploy** → Attendre 2-3 minutes

✅ **C'est tout ! Le scraper tourne 24/7 !**

---

## ⚡ Option 2 : Supabase Edge Function (2 min)

### Plus rapide mais avec cold starts

```bash
# 1. Install
npm install -g supabase

# 2. Login
supabase login

# 3. Link
supabase link --project-ref nykctocknzbstdqnfkun

# 4. Secrets
supabase secrets set GITHUB_TOKEN=ghp_xxx
supabase secrets set TELEGRAM_BOT_TOKEN=123456789:ABC...
supabase secrets set TELEGRAM_CHAT_ID=-1001234567890
supabase secrets set TELEGRAM_NOTIFICATIONS=true

# 5. Deploy
supabase functions deploy scraper-worker
```

### Configurer le Cron

Dans Supabase SQL Editor :

```sql
SELECT cron.schedule(
  'github-security-scraper-15min',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://nykctocknzbstdqnfkun.supabase.co/functions/v1/scraper-worker',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
  $$
);
```

---

## 🎯 Option 3 : Les Deux (Redondance Maximale)

Suivre **Option 1** ET **Option 2** pour une redondance totale.

**Configuration :**
- **Railway** : Scan toutes les 15 min (primary)
- **Supabase** : Scan toutes les 30 min (backup)

---

## 🧪 Vérification

### 1. Railway Logs

Dashboard Railway → **Logs**
```
✅ Vous devriez voir :
Loaded 95 active patterns
Starting scan...
```

### 2. Telegram Notifications

```
✅ Vous devriez recevoir :
✅ Test de Connexion
Le scraper est correctement configuré !
```

### 3. Supabase Database

```sql
-- Voir les scans récents
SELECT * FROM github_scan_history 
ORDER BY started_at DESC 
LIMIT 5;
```

### 4. Dashboard Web

Le dashboard peut être déployé sur :
- **Vercel** (gratuit)
- **Netlify** (gratuit)
- **Railway** (avec le même projet)

---

## 📊 Monitoring

### Railway

- **Logs** : En temps réel dans le dashboard
- **Métriques** : CPU, RAM, Network
- **Alertes** : Email si crash

### Supabase

- **Edge Function Logs** : Dashboard → Edge Functions → Logs
- **Database** : Queries, slow queries
- **Cron Jobs** : History des exécutions

### Telegram

- **Notifications** : Résumé de chaque scan
- **Findings** : Alertes critiques
- **Erreurs** : Si le scraper fail

---

## 💰 Coûts Finaux

### Setup Minimal (Gratuit)

```
Supabase : $0/mois
Railway : $0 (crédit gratuit)
Telegram : $0/mois
Total : $0/mois pendant 1 mois
```

### Setup Production (Recommandé)

```
Supabase : $0/mois (plan gratuit suffit)
Railway : $5-10/mois
Telegram : $0/mois
Total : $5-10/mois
```

**ROI :** Protection contre $287,500+ de pertes documentées

---

## 🔄 Workflow de Mise à Jour

```bash
# 1. Modifier le code localement
nano src/services/github-scraper.ts

# 2. Commit et push
git add .
git commit -m "update: amélioration"
git push origin main

# 3. Railway redéploie automatiquement ! ✅

# 4. Supabase : redéployer si nécessaire
supabase functions deploy scraper-worker
```

---

## ✅ Checklist de Déploiement

### Pré-déploiement
- [ ] GitHub token obtenu
- [ ] Telegram bot créé
- [ ] Channel Telegram créé
- [ ] Chat ID obtenu
- [ ] Repo GitHub créé

### Railway
- [ ] Compte Railway créé
- [ ] Projet déployé depuis GitHub
- [ ] Variables d'environnement ajoutées
- [ ] Déploiement réussi
- [ ] Logs consultés

### Supabase (Optionnel)
- [ ] Supabase CLI installé
- [ ] Edge Function déployée
- [ ] Secrets configurés
- [ ] Cron job créé
- [ ] Test manuel réussi

### Vérification
- [ ] Premier scan complété
- [ ] Notification Telegram reçue
- [ ] Findings visibles dans la DB
- [ ] Dashboard accessible
- [ ] Logs sans erreurs

---

## 🎉 Résultat Final

Après 10 minutes de configuration :

✅ **Scraper actif 24/7**
✅ **95 patterns** de détection
✅ **Notifications Telegram** temps réel
✅ **Auto-restart** sur crash
✅ **Logs centralisés**
✅ **Dashboard web** de monitoring

**Votre scraper protège maintenant GitHub 24/7 ! 🔐**

---

## 📞 Support

### Problèmes de Déploiement

1. **Railway** : https://railway.app/help
2. **Supabase** : https://supabase.com/docs
3. **Logs** : Consulter les logs de la plateforme

### Documentation

- [PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md) - Guide complet
- [RAILWAY_DEPLOYMENT.md](docs/RAILWAY_DEPLOYMENT.md) - Railway détaillé
- [SUPABASE_DEPLOYMENT.md](docs/SUPABASE_DEPLOYMENT.md) - Supabase détaillé
- [TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md) - Configuration Telegram

---

## 🚀 Commandes Rapides

```bash
# Vérifier que tout fonctionne localement
npm run verify

# Test local avant deploy
npm run scraper:start

# Deploy Railway (via dashboard)
# https://railway.app → New Project

# Deploy Supabase
supabase functions deploy scraper-worker

# Voir les logs Railway
railway logs

# Voir les logs Supabase
# Dashboard → Edge Functions → Logs
```

---

**Temps total : 10 minutes**
**Coût : $0-10/mois**
**Protection : Inestimable ! 💎**

**GO ! 🚀**

Version 3.0 - Production Deployment
Octobre 2025
