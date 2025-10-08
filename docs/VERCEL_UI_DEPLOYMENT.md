# 🚀 Déploiement du Dashboard sur Vercel

## 🎯 Vercel pour le Dashboard UI Uniquement

Vercel est **parfait** pour héberger le dashboard web, mais **pas adapté** pour le worker scraper.

### Architecture Optimale

```
VERCEL (Frontend)          → Dashboard UI
SUPABASE (Backend/Worker)  → Scraper + Database
TELEGRAM (Notifications)   → Alertes
```

**Coût total : $0/mois !** 💚

---

## 🚀 Déploiement Dashboard sur Vercel (3 minutes)

### Méthode 1 : Via Dashboard Vercel (Recommandé)

#### 1. Push le code sur GitHub

```bash
cd /Users/hacker/Desktop/github/github-security-scraper

git init
git add .
git commit -m "feat: GitHub Security Scraper v3.0"

# Créer le repo sur : https://github.com/new
git remote add origin https://github.com/VOTRE_USERNAME/github-security-scraper.git
git push -u origin main
```

#### 2. Import sur Vercel

1. Aller sur **https://vercel.com**
2. Cliquer sur **"Add New..."** → **"Project"**
3. **Import Git Repository**
4. Sélectionner votre repo `github-security-scraper`

#### 3. Configuration du Projet

```
Framework Preset : Other
Root Directory : ui/
Build Command : (laisser vide)
Output Directory : .
Install Command : (laisser vide)
```

#### 4. Variables d'Environnement (Optionnel)

Les clés Supabase sont déjà hardcodées dans `ui/index.html`.
Si vous voulez les externaliser :

```env
NEXT_PUBLIC_SUPABASE_URL=https://nykctocknzbstdqnfkun.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 5. Deploy !

Cliquer sur **"Deploy"** → Attendre 1-2 minutes

✅ **Votre dashboard est en ligne !**

URL : `https://votre-projet.vercel.app`

### Méthode 2 : Via CLI

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Déployer le dashboard
cd ui
vercel --prod

# Suivre les instructions
# Répondre "ui" quand demandé le root directory
```

---

## ⚙️ **Déployer le Worker sur Supabase (OBLIGATOIRE)**

### Pourquoi Supabase et pas Vercel ?

| Besoin | Vercel | Supabase |
|--------|--------|----------|
| Worker continu | ❌ Non supporté | ✅ Edge Functions |
| Cron automatique | ❌ Non | ✅ pg_cron natif |
| Timeout | 10-60s | 10 minutes |
| Gratuit | ✅ Oui | ✅ Oui |
| **Pour scraper** | ❌ Impossible | ✅ Parfait |

### Déploiement Worker

```bash
# 1. Install CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Link
supabase link --project-ref nykctocknzbstdqnfkun

# 4. Secrets
supabase secrets set GITHUB_TOKEN=ghp_xxx
supabase secrets set TELEGRAM_BOT_TOKEN=xxx
supabase secrets set TELEGRAM_CHAT_ID=xxx
supabase secrets set TELEGRAM_NOTIFICATIONS=true

# 5. Deploy
supabase functions deploy scraper-worker
```

### Configurer le Cron SQL

```sql
SELECT cron.schedule(
  'github-security-scraper',
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

## 🎨 **Personnaliser le Dashboard Vercel**

### Ajouter un Domaine Custom

```bash
# Dashboard Vercel → Settings → Domains
# Ajouter : security.votredomaine.com
```

### Variables d'Environnement

Si vous externalisez les clés Supabase :

```javascript
// ui/config.js
export const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};
```

---

## 🔒 **Sécurité**

### ✅ Ce qui est Sûr

- **ANON_KEY** : Lecture seule, OK de l'exposer
- **RLS Policies** : Protection côté serveur
- **Vercel** : HTTPS automatique
- **CDN** : DDoS protection

### ⚠️ À NE PAS Faire

```javascript
// ❌ JAMAIS exposer le Service Role Key côté client
const supabase = createClient(url, SERVICE_ROLE_KEY);  // ❌

// ✅ Toujours utiliser l'Anon Key
const supabase = createClient(url, ANON_KEY);  // ✅
```

---

## 📊 **Monitoring**

### Vercel Analytics

Dashboard Vercel → Analytics
- Visiteurs
- Temps de chargement
- Erreurs

### Supabase Logs

Dashboard Supabase → Edge Functions → Logs
- Scans effectués
- Findings détectés
- Erreurs

### Telegram

Notifications en temps réel ! 📱

---

## 🔄 **Mises à Jour Automatiques**

### Dashboard (Vercel)

```bash
# Modifier le dashboard
nano ui/index.html

# Commit et push
git add .
git commit -m "update: dashboard UI"
git push origin main

# Vercel redéploie automatiquement ! ✅
```

### Worker (Supabase)

```bash
# Modifier le worker
nano supabase/functions/scraper-worker/index.ts

# Redéployer
supabase functions deploy scraper-worker
```

---

## ✅ **Checklist Complète**

### Telegram
- [ ] Bot créé via @BotFather
- [ ] Token copié
- [ ] Channel privé créé
- [ ] Bot ajouté comme admin
- [ ] Chat ID obtenu (`npm run get-chat-id`)
- [ ] Test réussi (`npm run test-telegram`)

### Worker Supabase
- [ ] Supabase CLI installé
- [ ] Login réussi
- [ ] Link au projet
- [ ] Secrets configurés
- [ ] Edge Function déployée
- [ ] Cron job créé (SQL)
- [ ] Test manuel réussi

### Dashboard Vercel
- [ ] Repo GitHub créé
- [ ] Code poussé
- [ ] Projet Vercel créé
- [ ] Root directory : `ui/`
- [ ] Déploiement réussi
- [ ] URL accessible

### Vérification
- [ ] Worker tourne (logs Supabase)
- [ ] Notification Telegram reçue
- [ ] Dashboard accessible
- [ ] Pas d'erreurs

---

## 🎉 **Résultat Final**

✅ **Dashboard** hébergé sur Vercel (gratuit)
✅ **Worker** qui tourne sur Supabase 24/7 (gratuit)
✅ **Notifications** Telegram temps réel (gratuit)
✅ **Database** Supabase centralisée (gratuit)

**Coût total : $0/mois** 💚
**Uptime : 99.9%+**
**Performance : Excellente**

---

## 💡 **Commandes de Test**

```bash
# 1. Tester Telegram
npm run test-telegram

# 2. Obtenir Chat ID
npm run get-chat-id

# 3. Vérifier setup complet
npm run verify

# 4. Test manuel de l'Edge Function
curl -X POST \
  'https://nykctocknzbstdqnfkun.supabase.co/functions/v1/scraper-worker' \
  -H 'Content-Type: application/json'

# 5. Voir le dashboard local
cd ui && python3 -m http.server 8000
```

---

## 📚 **Documentation**

- [VERCEL_VS_ALTERNATIVES.md](VERCEL_VS_ALTERNATIVES.md) - Comparaison plateformes
- [SUPABASE_DEPLOYMENT.md](SUPABASE_DEPLOYMENT.md) - Deploy worker
- [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) - Config Telegram
- [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) - Guide complet

---

**Solution optimale : Supabase (worker) + Vercel (UI) = $0/mois ! 🎉**

Version 3.0 - Vercel UI Ready
Octobre 2025
