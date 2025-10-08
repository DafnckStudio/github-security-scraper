# 🚀 Quick Start Guide - GitHub Security Scraper

## 📋 Prérequis

- Node.js 18+ installé
- Compte GitHub avec Personal Access Token
- Projet Supabase configuré

## ⚡ Installation Rapide

### 1. Installation des dépendances

```bash
cd github-security-scraper
npm install
```

### 2. Configuration

Copier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Éditer `.env` avec vos credentials :

```env
# GitHub
GITHUB_TOKEN=ghp_your_github_token_here

# Supabase (déjà configuré)
SUPABASE_URL=https://nykctocknzbstdqnfkun.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Scraper Config
SCRAPER_INTERVAL_MINUTES=15
MAX_RESULTS_PER_SCAN=100
ENABLE_NOTIFICATIONS=true

# Alerts (optionnel)
ALERT_EMAIL=security@example.com
WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Obtenir un GitHub Token

1. Aller sur https://github.com/settings/tokens
2. "Generate new token" → "Classic"
3. Sélectionner les scopes :
   - `public_repo` (recherche dans les repos publics)
   - `read:org` (optionnel, pour les orgs)
4. Copier le token dans `.env`

## 🎯 Modes d'exécution

### Mode 1: Scan Unique (Test)

Pour tester rapidement :

```bash
npm run scraper:start
```

Sortie :
```
🔐 GitHub Security Scraper - Single Scan Mode
Starting scan...
✅ Scan completed: 5 findings from 42 results
```

### Mode 2: Scan Continu (Production)

Pour lancer le worker en continu :

```bash
npm run scraper:continuous
```

Le scraper tournera indéfiniment avec le cron configuré.

### Mode 3: Edge Function Supabase (Serverless)

Déployer sur Supabase pour un worker serverless :

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Link au projet
supabase link --project-ref nykctocknzbstdqnfkun

# Configurer les secrets
supabase secrets set GITHUB_TOKEN=ghp_xxx...

# Déployer
supabase functions deploy scraper-worker
```

## 📊 Lancer le Dashboard

```bash
cd ui
python3 -m http.server 8000
```

Ouvrir http://localhost:8000

## ✅ Vérification

### Tester la connexion Supabase

```bash
npm run dev
```

### Vérifier les patterns actifs

Aller dans le dashboard Supabase :
https://supabase.com/dashboard/project/nykctocknzbstdqnfkun/editor

Table : `github_sensitive_patterns`
→ 12 patterns doivent être présents

### Vérifier les findings

Table : `github_security_findings`
→ Les findings apparaîtront après le premier scan

## 🎛️ Configuration Avancée

### Ajuster la fréquence des scans

Dans `.env` :
```env
SCRAPER_INTERVAL_MINUTES=5  # Scan toutes les 5 minutes
```

### Limiter les résultats

```env
MAX_RESULTS_PER_SCAN=50  # Max 50 résultats par scan
```

### Mode Dry Run (Test sans sauvegarder)

```env
DRY_RUN=true
```

## 🔐 Sécurité des Credentials

### ⚠️ IMPORTANT

- **Jamais commit le `.env`** (déjà dans .gitignore)
- **GitHub Token** : Permissions minimales uniquement
- **Service Role Key** : Garder secret, jamais exposer côté client
- **Rotation** : Changer les tokens régulièrement

## 📈 Monitoring

### Logs

Les logs sont dans `logs/` :
- `error.log` : Erreurs uniquement
- `combined.log` : Tous les logs

### Dashboard

Interface web en temps réel :
- http://localhost:8000
- Stats live
- Filtres avancés

### Supabase Dashboard

https://supabase.com/dashboard/project/nykctocknzbstdqnfkun

Tables à surveiller :
- `github_security_findings` : Les findings
- `github_scan_history` : Historique des scans
- `github_security_alerts` : Alertes envoyées

## 🐛 Troubleshooting

### "Rate limit exceeded"

GitHub limite à 30 requêtes/minute pour la recherche de code.
Attendre la réinitialisation ou espacer les scans.

### "Supabase connection failed"

Vérifier :
1. `SUPABASE_URL` correcte
2. `SUPABASE_SERVICE_ROLE_KEY` valide
3. RLS policies activées

### "No patterns found"

Exécuter :
```sql
SELECT * FROM github_sensitive_patterns WHERE is_active = true;
```

Si vide, réinsérer les patterns (voir README principal).

## 🎯 Next Steps

1. ✅ Lancer un scan de test
2. ✅ Vérifier les findings dans le dashboard
3. ✅ Configurer les alertes (email/webhook)
4. ✅ Déployer en production (Edge Function ou serveur dédié)
5. ✅ Monitorer régulièrement

## 📚 Documentation

- [README principal](README.md) - Documentation complète
- [UI Dashboard](ui/README.md) - Guide du dashboard
- [Edge Function](supabase/functions/scraper-worker/README.md) - Déploiement serverless

## 💬 Support

En cas de problème :
1. Vérifier les logs dans `logs/`
2. Consulter la console du dashboard Supabase
3. Activer le debug : `LOG_LEVEL=debug` dans `.env`

---

**Temps d'installation : ~5 minutes** ⏱️
**Premier scan : ~30 secondes** 🚀
