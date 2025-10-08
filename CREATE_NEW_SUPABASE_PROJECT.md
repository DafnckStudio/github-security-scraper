# 🚀 Créer un Nouveau Projet Supabase

## ⚠️ Information

Il y a des **factures impayées** dans l'organisation Dafnck, donc je ne peux pas créer le projet automatiquement.

**2 Options :**

---

## ✅ **Option 1 : Régler les Factures et Créer (Recommandé)**

### 1. Régler les factures

1. Aller sur : https://supabase.com/dashboard/org/vdifrsayhmpgfslpwdps/invoices
2. Régler les factures en attente
3. Attendre confirmation (quelques minutes)

### 2. Créer le projet manuellement

1. Aller sur : https://supabase.com/dashboard
2. Cliquer sur **"New project"**
3. **Configuration** :
   ```
   Organization : Dafnck
   Name : github-security-scraper
   Database Password : (créer un mot de passe fort)
   Region : Europe West (Ireland)
   Pricing Plan : Pro ($10/month)
   ```
4. Cliquer sur **"Create new project"**
5. Attendre 2-3 minutes (création en cours)

### 3. Récupérer les credentials

Une fois créé, aller dans **Settings** → **API** :

- **Project URL** : `https://xxx.supabase.co`
- **anon public** : `eyJhbG...`
- **service_role secret** : `eyJhbG...`

### 4. Me donner le Project ID

Le Project ID (ref) est visible dans l'URL ou dans Settings → General.

Format : `abcdefghijklmnop` (16 caractères)

**Ensuite je pourrai :**
- Créer toutes les tables
- Insérer les 95 patterns
- Déployer l'Edge Function
- Configurer le cron
- Mettre à jour Vercel

---

## ✅ **Option 2 : Utiliser le Projet Existant (GRATUIT)**

Utiliser le projet déjà configuré : `nykctocknzbstdqnfkun`

**Avantages :**
- ✅ Déjà configuré avec les 95 patterns
- ✅ Tables déjà créées
- ✅ $0/mois (pas de coût additionnel)
- ✅ Prêt à l'emploi immédiatement

**Je peux déployer l'Edge Function dessus maintenant si vous voulez !**

---

## 🎯 **Quelle Option Choisissez-Vous ?**

### Option 1 : Nouveau Projet Dédié
- Coût : **$10/mois**
- Setup : Vous créez via dashboard
- Isolation : Projet séparé

### Option 2 : Projet Existant  
- Coût : **$0/mois**
- Setup : **Immédiat** (déjà prêt)
- Isolation : Partage avec autres apps

**Recommandation :** Option 2 (projet existant) car tout est déjà configuré !

---

## 💡 **Si vous choisissez Option 2 (Projet Existant)**

Je peux déployer **immédiatement** :

```bash
# 1. Tester Telegram
npm run test-telegram

# 2. Déployer l'Edge Function
supabase login
supabase link --project-ref nykctocknzbstdqnfkun
supabase secrets set GITHUB_TOKEN=ghp_xxx
supabase secrets set TELEGRAM_BOT_TOKEN=xxx
supabase secrets set TELEGRAM_CHAT_ID=xxx
supabase functions deploy scraper-worker
```

**Quel est votre choix ?** 🤔
