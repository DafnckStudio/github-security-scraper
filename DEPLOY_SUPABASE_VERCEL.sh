#!/bin/bash

# ╔════════════════════════════════════════════════════════════╗
# ║  🚀 DÉPLOIEMENT SUPABASE + VERCEL (100% GRATUIT)          ║
# ╚════════════════════════════════════════════════════════════╝

echo "════════════════════════════════════════════════════════════"
echo "  GitHub Security Scraper - Déploiement Production"
echo "  Architecture : Supabase (Worker) + Vercel (Dashboard)"
echo "  Coût : \$0/mois"
echo "════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# 📱 ÉTAPE 1 : TESTER TELEGRAM
# ═══════════════════════════════════════════════════════════════

echo "1️⃣  Test Telegram..."
echo ""
echo "Exécutez :"
echo "  npm run test-telegram"
echo ""
echo "✅ Vous devriez recevoir 2 messages sur Telegram"
echo ""
read -p "Appuyez sur Entrée une fois Telegram testé..."

# ═══════════════════════════════════════════════════════════════
# 🚀 ÉTAPE 2 : DÉPLOYER SUR SUPABASE
# ═══════════════════════════════════════════════════════════════

echo ""
echo "2️⃣  Déploiement Supabase (Worker)..."
echo ""
echo "Exécutez ces commandes :"
echo ""
echo "  # Login"
echo "  supabase login"
echo ""
echo "  # Link au projet"
echo "  supabase link --project-ref nykctocknzbstdqnfkun"
echo ""
echo "  # Configurer les secrets"
echo "  supabase secrets set GITHUB_TOKEN=ghp_VOTRE_TOKEN"
echo "  supabase secrets set TELEGRAM_BOT_TOKEN=VOTRE_BOT_TOKEN"
echo "  supabase secrets set TELEGRAM_CHAT_ID=VOTRE_CHAT_ID"
echo "  supabase secrets set TELEGRAM_NOTIFICATIONS=true"
echo ""
echo "  # Déployer"
echo "  supabase functions deploy scraper-worker"
echo ""
read -p "Appuyez sur Entrée une fois Supabase déployé..."

# ═══════════════════════════════════════════════════════════════
# ⏰ ÉTAPE 3 : CONFIGURER LE CRON
# ═══════════════════════════════════════════════════════════════

echo ""
echo "3️⃣  Configuration Cron..."
echo ""
echo "Allez sur : https://supabase.com/dashboard/project/nykctocknzbstdqnfkun"
echo "SQL Editor → Nouvelle query → Exécuter ce SQL :"
echo ""
cat << 'SQL'
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
SQL
echo ""
read -p "Appuyez sur Entrée une fois le cron configuré..."

# ═══════════════════════════════════════════════════════════════
# 🎨 ÉTAPE 4 : DÉPLOYER DASHBOARD SUR VERCEL
# ═══════════════════════════════════════════════════════════════

echo ""
echo "4️⃣  Déploiement Dashboard sur Vercel..."
echo ""
echo "Méthode CLI :"
echo "  cd ui"
echo "  vercel --prod"
echo ""
echo "Méthode Dashboard :"
echo "  1. Aller sur https://vercel.com"
echo "  2. New Project → Import repo"
echo "  3. Root Directory : ui/"
echo "  4. Deploy"
echo ""
read -p "Appuyez sur Entrée une fois Vercel déployé..."

# ═══════════════════════════════════════════════════════════════
# ✅ VÉRIFICATION
# ═══════════════════════════════════════════════════════════════

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ DÉPLOIEMENT TERMINÉ !"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🎯 Vérifications :"
echo ""
echo "  1. Supabase Edge Function :"
echo "     https://nykctocknzbstdqnfkun.supabase.co/functions/v1/scraper-worker"
echo ""
echo "  2. Dashboard Vercel :"
echo "     https://votre-projet.vercel.app"
echo ""
echo "  3. Telegram :"
echo "     Attendre 15 min → Recevoir notification de scan"
echo ""
echo "  4. Database :"
echo "     https://supabase.com/dashboard/project/nykctocknzbstdqnfkun"
echo "     Table: github_scan_history"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  🎉 Le scraper tourne maintenant 24/7 gratuitement !"
echo "════════════════════════════════════════════════════════════"
echo ""
