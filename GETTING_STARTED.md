# 🚀 Getting Started - GitHub Security Scraper

## Bienvenue ! 👋

Vous avez maintenant un **système complet de détection de données sensibles sur GitHub** prêt à l'emploi !

---

## 📦 Ce qui a été créé

### ✅ Base de données Supabase
- 4 tables créées avec RLS activée
- 12 patterns de détection configurés
- Indexes optimisés pour les performances

### ✅ Services Backend
- GitHub scraper avec rate limiting
- Pattern matcher avec scoring intelligent
- Système d'alertes (email + webhook)
- Storage Supabase avec CRUD complet

### ✅ Workers
- Mode scan unique (test)
- Mode continu (production)
- Edge Function Supabase (serverless)

### ✅ Dashboard Web
- Interface moderne avec TailwindCSS
- Stats temps réel
- Filtres avancés
- Auto-refresh

### ✅ Documentation
- README complet
- Quick Start guide
- Guide configuration GitHub token
- Project summary

---

## 🎯 Prochaines étapes (dans l'ordre)

### 1️⃣ Obtenir un GitHub Token (2 min)

```bash
# Ouvrir dans le navigateur
open https://github.com/settings/tokens
```

1. Cliquez sur "Generate new token (classic)"
2. Name: `GitHub Security Scraper`
3. Cochez uniquement : **`public_repo`**
4. Cliquez sur "Generate token"
5. **Copiez le token** (commence par `ghp_`)

📖 Guide détaillé : [docs/GITHUB_TOKEN_SETUP.md](docs/GITHUB_TOKEN_SETUP.md)

### 2️⃣ Configurer le token

Vous devez créer un fichier `.env` avec votre token GitHub.

**Option automatique :**
```bash
cat > .env << 'EOF'
# GitHub Configuration
GITHUB_TOKEN=COLLEZ_VOTRE_TOKEN_ICI

# Supabase Configuration
SUPABASE_URL=https://nykctocknzbstdqnfkun.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a2N0b2Nrbnpic3RkcW5ma3VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMzMwMDYsImV4cCI6MjA3MzgwOTAwNn0.ZRI5O5sqDVUJu431RyrOsZ5qeIDdSn7U5FBNBooURuQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55a2N0b2Nrbnpic3RkcW5ma3VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIzMzAwNiwiZXhwIjoyMDczODA5MDA2fQ.V13I-7UULEr1r-IiHRsEw1ijvQKR1VwHVZextEKPH8s

# Scraper Configuration
SCRAPER_INTERVAL_MINUTES=15
MAX_RESULTS_PER_SCAN=100
ENABLE_NOTIFICATIONS=true
DRY_RUN=false

# Alert Configuration
ALERT_EMAIL=studio@dafnck.com
WEBHOOK_URL=

# Logging
LOG_LEVEL=info
NODE_ENV=development
EOF
```

Puis éditez le fichier pour ajouter votre token :
```bash
nano .env
# Remplacer "COLLEZ_VOTRE_TOKEN_ICI" par votre vrai token
# Sauvegarder : Ctrl+X, puis Y, puis Enter
```

### 3️⃣ Vérifier l'installation

```bash
npm run verify
```

Vous devriez voir :
```
✅ Supabase Connection: Connected successfully
✅ GitHub Token: Valid token with 5000/hour core + 30/min search
✅ Database Tables: All 4 tables accessible
✅ Sensitive Patterns: 12 active patterns configured
✅ Setup verification PASSED
```

### 4️⃣ Lancer un scan de test

```bash
npm run scraper:start
```

Sortie attendue :
```
🔐 GitHub Security Scraper - Single Scan Mode
Starting scan...
Loaded 12 active patterns
Searching with query: Critical crypto keys and seeds
Found 23 results for: Critical crypto keys and seeds
✅ Scan completed: 3 findings from 23 results
```

### 5️⃣ Voir le dashboard

```bash
cd ui
python3 -m http.server 8000
```

Ouvrir dans le navigateur : **http://localhost:8000**

Vous verrez :
- 📊 Stats en temps réel
- 📋 Liste des findings
- 🔍 Filtres par sévérité et statut

---

## 🎮 Modes d'utilisation

### Mode 1 : Scan unique (recommandé pour débuter)

```bash
npm run scraper:start
```

**Quand l'utiliser :**
- Tests et développement
- Scans ponctuels
- Vérification après configuration

### Mode 2 : Scan continu (production)

```bash
npm run scraper:continuous
```

**Quand l'utiliser :**
- Monitoring 24/7
- Serveur dédié
- Alertes en temps réel

**Stopper :** Ctrl+C

### Mode 3 : Edge Function (serverless)

```bash
# Installation Supabase CLI
npm install -g supabase

# Login
supabase login

# Link au projet
supabase link --project-ref nykctocknzbstdqnfkun

# Configurer le secret
supabase secrets set GITHUB_TOKEN=ghp_votre_token

# Déployer
supabase functions deploy scraper-worker
```

**Quand l'utiliser :**
- Pas de serveur à gérer
- Auto-scaling
- Cron intégré

📖 Guide complet : [supabase/functions/scraper-worker/README.md](supabase/functions/scraper-worker/README.md)

---

## 📊 Comprendre les résultats

### Sévérités

| Niveau | Signification | Action |
|--------|---------------|--------|
| 🔴 **Critical** | Clés privées, seeds | **Contact immédiat propriétaire** |
| 🟠 **High** | API keys, credentials | Vérifier et alerter |
| 🟡 **Medium** | Données sensibles | Monitorer |
| 🔵 **Low** | Informations publiques | Log seulement |

### Statuts

- **new** : Nouveau finding, non traité
- **investigating** : En cours d'investigation
- **confirmed** : Vulnérabilité confirmée
- **resolved** : Problème résolu
- **ignored** : Faux positif

---

## ⚙️ Configuration avancée

### Ajuster la fréquence des scans

Dans `.env` :
```env
SCRAPER_INTERVAL_MINUTES=5  # Scan toutes les 5 minutes (au lieu de 15)
```

### Limiter les résultats

```env
MAX_RESULTS_PER_SCAN=50  # Limite à 50 résultats par scan
```

### Activer les alertes email

```env
ENABLE_NOTIFICATIONS=true
ALERT_EMAIL=votre-email@example.com
```

### Webhook Slack/Discord

```env
WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 🔍 Monitoring

### Logs

Deux fichiers de logs sont créés automatiquement :

```bash
# Voir les erreurs
tail -f logs/error.log

# Voir tous les logs
tail -f logs/combined.log
```

### Dashboard Supabase

Interface officielle Supabase :
https://supabase.com/dashboard/project/nykctocknzbstdqnfkun

**Tables à surveiller :**
- `github_security_findings` - Les findings détectés
- `github_scan_history` - Historique des scans
- `github_sensitive_patterns` - Patterns actifs
- `github_security_alerts` - Alertes envoyées

### Dashboard Web local

http://localhost:8000

**Rafraîchissement automatique :** Toutes les 60 secondes

---

## 🐛 Résolution des problèmes

### "GITHUB_TOKEN is required"

Vous n'avez pas configuré le token dans `.env`.
→ Voir étape 2

### "Rate limit exceeded"

GitHub limite à 30 recherches/minute.
→ Attendre la réinitialisation ou espacer les scans

### "Supabase connection failed"

Problème de connexion Supabase.
→ Vérifier `SUPABASE_SERVICE_ROLE_KEY` dans `.env`

### "No patterns found"

Les patterns ne sont pas dans la DB.
→ Les patterns devraient déjà être là (12 patterns insérés automatiquement)

### Pas de findings trouvés

C'est normal ! Cela signifie que les repos publics scannés sont sécurisés.
→ Le scraper cherche des patterns très spécifiques

---

## 📚 Documentation complète

| Document | Objectif |
|----------|----------|
| [README.md](README.md) | Documentation technique complète |
| [QUICKSTART.md](QUICKSTART.md) | Guide rapide (5 min) |
| **[GETTING_STARTED.md](GETTING_STARTED.md)** | **Ce guide pour débuter** |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Vue d'ensemble du projet |
| [docs/GITHUB_TOKEN_SETUP.md](docs/GITHUB_TOKEN_SETUP.md) | Configuration détaillée du token |

---

## 🎯 Checklist de démarrage

- [ ] GitHub token obtenu
- [ ] Fichier `.env` configuré
- [ ] `npm run verify` passé avec succès
- [ ] Premier scan lancé (`npm run scraper:start`)
- [ ] Dashboard ouvert (http://localhost:8000)
- [ ] Logs consultés (`logs/combined.log`)

**Une fois tout coché, vous êtes prêt ! 🎉**

---

## 🚀 Déploiement en production

### Option 1 : Serveur dédié

```bash
# Installer en tant que service systemd (Linux)
sudo nano /etc/systemd/system/github-scraper.service

[Unit]
Description=GitHub Security Scraper
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/github-security-scraper
ExecStart=/usr/bin/npm run scraper:continuous
Restart=always

[Install]
WantedBy=multi-user.target

# Activer et démarrer
sudo systemctl enable github-scraper
sudo systemctl start github-scraper
```

### Option 2 : Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["npm", "run", "scraper:continuous"]
```

```bash
docker build -t github-scraper .
docker run -d --env-file .env github-scraper
```

### Option 3 : Supabase Edge Functions

Voir [supabase/functions/scraper-worker/README.md](supabase/functions/scraper-worker/README.md)

---

## 💬 Besoin d'aide ?

1. **Consulter les logs** : `tail -f logs/combined.log`
2. **Vérifier la configuration** : `npm run verify`
3. **Mode debug** : Ajouter `LOG_LEVEL=debug` dans `.env`
4. **Dashboard Supabase** : Vérifier les tables directement

---

## 🎉 Félicitations !

Vous avez maintenant un système professionnel de détection de vulnérabilités GitHub.

**Prochaines étapes suggérées :**
1. ✅ Laisser tourner le scraper 24h
2. ✅ Analyser les premiers findings
3. ✅ Configurer les alertes email/webhook
4. ✅ Partager avec votre équipe sécurité

**Bonne chasse aux vulnérabilités ! 🔐**

---

Dernière mise à jour : Octobre 2025
