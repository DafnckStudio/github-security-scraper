# 🔧 Template de Configuration (.env)

## 📝 Copier ce contenu dans votre fichier `.env`

```env
# ════════════════════════════════════════════════════════════════
# GitHub Security Scraper - Configuration Production
# ════════════════════════════════════════════════════════════════

# ────────────────────────────────────────────────────────────────
# 🐙 GITHUB CONFIGURATION (OBLIGATOIRE)
# ────────────────────────────────────────────────────────────────

# Obtenir un token : https://github.com/settings/tokens
# Permissions nécessaires : public_repo
GITHUB_TOKEN=

# ────────────────────────────────────────────────────────────────
# 🗄️ SUPABASE CONFIGURATION (OBLIGATOIRE)
# ────────────────────────────────────────────────────────────────

SUPABASE_URL=https://nykctocknzbstdqnfkun.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a2N0b2Nrbnpic3RkcW5ma3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzMwMDYsImV4cCI6MjA3MzgwOTAwNn0.ZRI5O5sqDVUJu431RyrOsZ5qeIDdSn7U5FBNBooURuQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a2N0b2Nrbnpic3RkcW5ma3VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIzMzAwNiwiZXhwIjoyMDczODA5MDA2fQ.V13I-7UULEr1r-IiHRsEw1ijvQKR1VwHVZextEKPH8s

# ────────────────────────────────────────────────────────────────
# ⚙️ SCRAPER CONFIGURATION
# ────────────────────────────────────────────────────────────────

# Intervalle entre les scans (en minutes)
SCRAPER_INTERVAL_MINUTES=15

# Nombre maximum de résultats par scan
MAX_RESULTS_PER_SCAN=100

# Activer les notifications
ENABLE_NOTIFICATIONS=true

# Mode dry run (test sans sauvegarder)
DRY_RUN=false

# ────────────────────────────────────────────────────────────────
# 📱 TELEGRAM CONFIGURATION (RECOMMANDÉ)
# ────────────────────────────────────────────────────────────────

# Guide complet : docs/TELEGRAM_SETUP.md

# Activer les notifications Telegram
TELEGRAM_NOTIFICATIONS=true

# Token du bot (obtenu via @BotFather)
# Format : 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_BOT_TOKEN=

# Chat ID du channel privé (commence par -100)
# Format : -1001234567890
TELEGRAM_CHAT_ID=

# ────────────────────────────────────────────────────────────────
# 📧 EMAIL & WEBHOOK ALERTS (OPTIONNEL)
# ────────────────────────────────────────────────────────────────

# Email pour les alertes critiques
ALERT_EMAIL=studio@dafnck.com

# Webhook URL (Slack, Discord, etc.)
# Format Slack : https://hooks.slack.com/services/YOUR/WEBHOOK/URL
WEBHOOK_URL=

# ────────────────────────────────────────────────────────────────
# 🔧 ENVIRONMENT
# ────────────────────────────────────────────────────────────────

NODE_ENV=production
LOG_LEVEL=info

# ════════════════════════════════════════════════════════════════
# 📊 RÉSUMÉ DE CONFIGURATION
# ════════════════════════════════════════════════════════════════
#
# Obligatoire :
#   ✓ GITHUB_TOKEN
#   ✓ SUPABASE_SERVICE_ROLE_KEY (déjà configurée)
#
# Fortement recommandé :
#   ✓ TELEGRAM_BOT_TOKEN
#   ✓ TELEGRAM_CHAT_ID
#
# Optionnel :
#   • ALERT_EMAIL
#   • WEBHOOK_URL
#
# ════════════════════════════════════════════════════════════════
```

## 🎯 Instructions

### 1. Créer le fichier `.env`

```bash
cd /Users/hacker/Desktop/github/github-security-scraper
nano .env
```

### 2. Copier le template ci-dessus

### 3. Remplir les valeurs

#### GitHub Token
```bash
# Obtenir sur : https://github.com/settings/tokens
# Remplacer : GITHUB_TOKEN=
# Par : GITHUB_TOKEN=ghp_votre_token_ici
```

#### Telegram Bot Token
```bash
# Obtenir via @BotFather sur Telegram
# Remplacer : TELEGRAM_BOT_TOKEN=
# Par : TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

#### Telegram Chat ID
```bash
# Obtenir via curl ou @userinfobot
# Remplacer : TELEGRAM_CHAT_ID=
# Par : TELEGRAM_CHAT_ID=-1001234567890
```

### 4. Sauvegarder

```bash
# Dans nano :
# Ctrl+X, puis Y, puis Enter
```

### 5. Vérifier

```bash
npm run verify
```

---

## 🚀 Pour Railway

Copier **TOUTES** les variables ci-dessus dans :
- Dashboard Railway → Variables

## 🚀 Pour Supabase

Configurer uniquement ces secrets :

```bash
supabase secrets set GITHUB_TOKEN=ghp_xxx
supabase secrets set TELEGRAM_BOT_TOKEN=123456789:ABC...
supabase secrets set TELEGRAM_CHAT_ID=-1001234567890
supabase secrets set TELEGRAM_NOTIFICATIONS=true
```

Les autres variables (SUPABASE_URL, etc.) sont automatiquement disponibles dans l'Edge Function.

---

**Version 3.0 - Production Configuration**
