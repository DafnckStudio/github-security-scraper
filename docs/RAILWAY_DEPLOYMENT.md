# 🚂 Déploiement Railway - Guide Complet

## 🎯 Pourquoi Railway ?

✅ **24/7 uptime** : Tourne même quand votre ordinateur est éteint
✅ **Auto-restart** : Redémarre automatiquement en cas de crash
✅ **Logs centralisés** : Tous les logs accessibles en ligne
✅ **Facile** : Déploiement en 5 minutes
✅ **Abordable** : ~$5-10/mois pour un worker simple

---

## 🚀 Déploiement Rapide (5 minutes)

### 1️⃣ Préparer le Projet

```bash
cd /Users/hacker/Desktop/github/github-security-scraper

# S'assurer que tout est bien configuré
git init
git add .
git commit -m "Initial commit - GitHub Security Scraper"
```

### 2️⃣ Créer un Repo GitHub

```bash
# Créer un repo sur GitHub
# https://github.com/new

# Pousser le code
git remote add origin https://github.com/VOTRE_USERNAME/github-security-scraper.git
git branch -M main
git push -u origin main
```

### 3️⃣ Déployer sur Railway

1. Aller sur **https://railway.app**
2. Se connecter avec GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Sélectionner `github-security-scraper`
5. Railway détecte automatiquement le projet Node.js

---

## ⚙️ Configuration des Variables d'Environnement

Dans le dashboard Railway, aller dans **Variables** et ajouter :

```env
# GitHub
GITHUB_TOKEN=ghp_votre_token_ici

# Supabase
SUPABASE_URL=https://nykctocknzbstdqnfkun.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Scraper Configuration
SCRAPER_INTERVAL_MINUTES=15
MAX_RESULTS_PER_SCAN=100
ENABLE_NOTIFICATIONS=true
DRY_RUN=false

# Telegram
TELEGRAM_NOTIFICATIONS=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_CHAT_ID=-1001234567890

# Alertes
ALERT_EMAIL=studio@dafnck.com

# Environment
NODE_ENV=production
LOG_LEVEL=info
```

---

## 🔧 Configuration Railway Avancée

### railway.json (Déjà créé)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "npm run scraper:continuous",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Dockerfile (Déjà créé)

Railway peut aussi utiliser le Dockerfile fourni pour un contrôle total.

---

## 📊 Monitoring sur Railway

### 1. Logs en Temps Réel

Dans le dashboard Railway :
- Onglet **Deployments**
- Cliquer sur le déploiement actif
- Voir les logs en temps réel

### 2. Métriques

Railway affiche automatiquement :
- 📈 CPU usage
- 💾 Memory usage
- 🌐 Network traffic
- ⏱️ Uptime

### 3. Alertes

Configurer des alertes si :
- CPU > 80%
- Memory > 90%
- Crashes répétés

---

## 🔄 Mises à Jour Automatiques

Railway redéploie automatiquement à chaque push sur `main` :

```bash
# Faire des modifications
git add .
git commit -m "Update patterns"
git push origin main

# Railway détecte le push et redéploie automatiquement ! 🚀
```

---

## 💰 Coûts Estimés

### Plan Hobby (Gratuit)

- ✅ $5 de crédit offerts
- ✅ Parfait pour tester
- ⚠️ Limité à 500h/mois

### Plan Developer ($5/mois)

- ✅ Usage illimité
- ✅ Métriques avancées
- ✅ Support prioritaire
- ✅ **Recommandé pour ce scraper**

### Estimation pour ce Scraper

```
Service : Node.js worker (1 instance)
RAM : ~256MB
CPU : Faible (scan toutes les 15 min)
Coût estimé : $5-8/mois
```

---

## 🎯 Configuration Alternative : Multi-Région

Pour une redondance maximale :

### Déployer sur 2 régions

1. **Déploiement US** (primary)
2. **Déploiement EU** (backup)

Configuration :
```env
# Primary
SCRAPER_INTERVAL_MINUTES=15

# Backup
SCRAPER_INTERVAL_MINUTES=30  # Moins fréquent pour éviter les doublons
```

---

## 🔒 Sécurité sur Railway

### Bonnes Pratiques

1. **Variables d'environnement** : Toujours via le dashboard (jamais hardcodé)
2. **Secrets rotation** : Changer régulièrement les tokens
3. **Access control** : Limiter qui peut voir les logs
4. **Private repos** : Garder le repo privé si possible

### Permissions Minimales

Le service Railway a besoin de :
- ✅ Accès au repo GitHub (pour déploiement)
- ✅ Variables d'environnement (configurées par vous)
- ❌ Aucun accès à vos autres services

---

## 📱 Notifications de Déploiement

### Intégrer avec Telegram

Ajoutez dans votre bot :

```bash
# Webhook Railway → Telegram
# Dashboard Railway → Settings → Webhooks
# Ajouter : https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<CHAT_ID>&text=Deployment%20completed

# Ou utilisez un service comme Zapier/IFTTT
```

---

## 🐛 Troubleshooting

### "Build Failed"

Vérifier :
```bash
# Localement, tester le build
npm install
npm run build
```

Si ça fonctionne localement, c'est un problème Railway.

### "Application Crashed"

Vérifier les logs Railway :
```
Error: GITHUB_TOKEN is required
```

→ Ajouter la variable dans Railway

### "Out of Memory"

Augmenter la RAM :
- Dashboard Railway
- Settings → Resources
- Augmenter à 512MB ou 1GB

### Logs indisponibles

Les logs Winston ne s'affichent pas sur Railway par défaut.
→ Utiliser `console.log` pour Railway, ou configurer un service de logging externe.

---

## 🎯 Commandes Railway CLI (Optionnel)

### Installation

```bash
npm install -g @railway/cli
```

### Déploiement via CLI

```bash
# Login
railway login

# Link au projet
railway link

# Ajouter des variables
railway variables set GITHUB_TOKEN=ghp_xxx

# Déployer
railway up

# Voir les logs
railway logs
```

---

## 📊 Monitoring Avancé

### Logs externes (Production)

Pour un monitoring avancé, intégrer avec :

**Sentry** (Erreurs)
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
});
```

**Datadog** (Métriques)
```bash
# Railway Add-on
railway add datadog
```

**LogTail** (Logs)
```bash
# Variables Railway
LOGTAIL_SOURCE_TOKEN=your_token
```

---

## ✅ Checklist de Déploiement

- [ ] Repo GitHub créé et code poussé
- [ ] Compte Railway créé
- [ ] Projet déployé sur Railway
- [ ] Toutes les variables d'environnement ajoutées
- [ ] Telegram configuré et testé
- [ ] Premier scan lancé avec succès
- [ ] Logs consultés sur Railway
- [ ] Notifications Telegram reçues
- [ ] Dashboard accessible

---

## 🎉 Résultat Final

Une fois déployé, votre scraper :

✅ Tourne **24/7** même si votre PC est éteint
✅ **Auto-restart** en cas de problème
✅ **Logs** accessibles sur Railway
✅ **Notifications Telegram** en temps réel
✅ **Dashboard web** accessible en ligne

**Coût total : ~$5-10/mois** pour une protection 24/7 ! 💰

---

**Prochaine étape : Déployer ! 🚀**

```bash
# 1. Push vers GitHub
git push origin main

# 2. Deploy sur Railway
railway up
```

Version 3.0 - Production Ready
Octobre 2025
