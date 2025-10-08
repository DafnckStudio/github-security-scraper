#!/bin/bash

# ╔════════════════════════════════════════════════════════════════╗
# ║  🚀 COMMANDES DE DÉPLOIEMENT RAPIDE - COPIER/COLLER           ║
# ╚════════════════════════════════════════════════════════════════╝

# 🎯 Ce script contient toutes les commandes nécessaires
# ⚠️  NE PAS exécuter tout le script d'un coup !
# ✅ Copier/coller les sections une par une

echo "════════════════════════════════════════════════════════════════"
echo "  GitHub Security Scraper - Quick Deploy Commands"
echo "════════════════════════════════════════════════════════════════"

# ═══════════════════════════════════════════════════════════════
# 📋 ÉTAPE 1 : CRÉER LE REPO GITHUB (3 min)
# ═══════════════════════════════════════════════════════════════

echo "1️⃣  Initialisation Git..."

cd /Users/hacker/Desktop/github/github-security-scraper

git init
git add .
git commit -m "feat: GitHub Security Scraper v3.0 - 95 patterns + Telegram + Railway"

# Créer le repo sur GitHub : https://github.com/new
# Puis remplacer VOTRE_USERNAME par votre vrai username :

# git remote add origin https://github.com/VOTRE_USERNAME/github-security-scraper.git
# git branch -M main
# git push -u origin main

# ═══════════════════════════════════════════════════════════════
# 🚂 ÉTAPE 2 : DÉPLOIEMENT RAILWAY (5 min)
# ═══════════════════════════════════════════════════════════════

echo "2️⃣  Préparation Railway..."

# 1. Aller sur : https://railway.app
# 2. Login avec GitHub
# 3. New Project → Deploy from GitHub repo
# 4. Sélectionner : github-security-scraper
# 5. Ajouter ces variables (copier/coller) :

cat << 'EOF'

VARIABLES D'ENVIRONNEMENT RAILWAY :
───────────────────────────────────

GITHUB_TOKEN=ghp_VOTRE_TOKEN_ICI
SUPABASE_URL=https://nykctocknzbstdqnfkun.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a2N0b2Nrbnpic3RkcW5ma3VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIzMzAwNiwiZXhwIjoyMDczODA5MDA2fQ.V13I-7UULEr1r-IiHRsEw1ijvQKR1VwHVZextEKPH8s
SCRAPER_INTERVAL_MINUTES=15
MAX_RESULTS_PER_SCAN=100
ENABLE_NOTIFICATIONS=true
DRY_RUN=false
TELEGRAM_NOTIFICATIONS=true
TELEGRAM_BOT_TOKEN=VOTRE_BOT_TOKEN_ICI
TELEGRAM_CHAT_ID=VOTRE_CHAT_ID_ICI
ALERT_EMAIL=studio@dafnck.com
NODE_ENV=production
LOG_LEVEL=info

EOF

# ═══════════════════════════════════════════════════════════════
# 🚀 ÉTAPE 3 : DÉPLOIEMENT SUPABASE (2 min) - OPTIONNEL
# ═══════════════════════════════════════════════════════════════

echo "3️⃣  Déploiement Supabase (optionnel)..."

# Installer Supabase CLI (si pas déjà fait)
# npm install -g supabase

# Login à Supabase
# supabase login

# Link au projet
# supabase link --project-ref nykctocknzbstdqnfkun

# Configurer les secrets
# supabase secrets set GITHUB_TOKEN=ghp_VOTRE_TOKEN
# supabase secrets set TELEGRAM_BOT_TOKEN=VOTRE_BOT_TOKEN
# supabase secrets set TELEGRAM_CHAT_ID=VOTRE_CHAT_ID
# supabase secrets set TELEGRAM_NOTIFICATIONS=true

# Déployer l'Edge Function
# supabase functions deploy scraper-worker

# ═══════════════════════════════════════════════════════════════
# ⏰ ÉTAPE 4 : CONFIGURER LE CRON SUPABASE (1 min) - OPTIONNEL
# ═══════════════════════════════════════════════════════════════

echo "4️⃣  Configuration Cron Supabase..."

cat << 'EOF'

SQL À EXÉCUTER DANS SUPABASE :
────────────────────────────────

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

EOF

# ═══════════════════════════════════════════════════════════════
# ✅ ÉTAPE 5 : VÉRIFICATION (2 min)
# ═══════════════════════════════════════════════════════════════

echo "5️⃣  Vérification du déploiement..."

# Test local avant deploy
npm run verify

# Test Telegram (après configuration)
# npm run scraper:start
# → Vous devriez recevoir une notification Telegram

# Vérifier Railway
# Dashboard Railway → Logs
# Vous devriez voir : "Loaded 95 active patterns"

# Vérifier Supabase
# Dashboard → Edge Functions → scraper-worker → Logs

# ═══════════════════════════════════════════════════════════════
# 📊 COMMANDES DE MONITORING
# ═══════════════════════════════════════════════════════════════

echo "Commandes de monitoring..."

cat << 'EOF'

MONITORING :
────────────

# Voir les logs locaux
tail -f logs/combined.log

# Railway CLI (optionnel)
npm install -g @railway/cli
railway login
railway logs

# Supabase CLI
supabase functions logs scraper-worker

# Vérifier la DB
Ouvrir : https://supabase.com/dashboard/project/nykctocknzbstdqnfkun

# Dashboard Web
cd ui && python3 -m http.server 8000
# Ouvrir : http://localhost:8000

EOF

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Commandes prêtes ! Suivez DEPLOY_NOW.md pour les détails"
echo "════════════════════════════════════════════════════════════════"
