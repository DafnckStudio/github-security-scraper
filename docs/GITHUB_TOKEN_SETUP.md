# 🔑 Comment obtenir un GitHub Personal Access Token

## 📝 Étapes

### 1. Aller dans les paramètres GitHub

Connectez-vous à GitHub et allez sur :
https://github.com/settings/tokens

Ou :
- Cliquez sur votre avatar (en haut à droite)
- Settings
- Developer settings (en bas à gauche)
- Personal access tokens → Tokens (classic)

### 2. Générer un nouveau token

Cliquez sur **"Generate new token"** → **"Generate new token (classic)"**

### 3. Configuration du token

#### Nom du token
```
GitHub Security Scraper
```

#### Expiration
Choisir **"No expiration"** ou **"90 days"** selon votre politique de sécurité.

#### Scopes requis

Sélectionner uniquement ces permissions :

✅ **public_repo** (Read access to code in public repositories)
  - Permet de rechercher du code dans les repos publics
  - C'est la permission minimale nécessaire

❌ **repo** (Full control of private repositories)
  - ⚠️ NE PAS sélectionner : donne accès aux repos privés
  - Non nécessaire pour ce scraper

#### Scopes optionnels

Si vous voulez scanner des organisations :
✅ **read:org** (Read org and team membership)

### 4. Générer et copier

1. Cliquez sur **"Generate token"**
2. ⚠️ **IMPORTANT** : Copiez immédiatement le token
   - Il ne sera plus jamais affiché
   - Commencera par `ghp_`

Exemple : `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 5. Ajouter au projet

Éditez le fichier `.env` :

```bash
cd github-security-scraper
nano .env
```

Ajoutez :
```env
GITHUB_TOKEN=ghp_votre_token_ici
```

Sauvegardez et fermez (Ctrl+X, puis Y, puis Enter).

### 6. Vérifier

Testez que le token fonctionne :

```bash
npm run scraper:start
```

Si le token est valide, vous verrez :
```
🔐 GitHub Security Scraper - Single Scan Mode
GitHub API Rate Limit: remaining: 30, limit: 30
Starting scan...
```

## 🔒 Sécurité du Token

### ✅ Bonnes pratiques

1. **Jamais commit le token**
   - Le `.env` est déjà dans `.gitignore`
   - Vérifiez avant chaque commit

2. **Permissions minimales**
   - Uniquement `public_repo`
   - Jamais de permissions sur les repos privés

3. **Rotation régulière**
   - Changer le token tous les 3-6 mois
   - Révoquer les anciens tokens

4. **Stocker en sécurité**
   - Utiliser un gestionnaire de mots de passe
   - Ne pas partager par email/chat

### ⚠️ En cas de compromission

Si votre token est exposé (commit, screenshot, etc.) :

1. **Révoquer immédiatement** :
   - https://github.com/settings/tokens
   - Cliquez sur le token → "Delete"

2. **Générer un nouveau token**
   - Suivre les étapes ci-dessus
   - Mettre à jour `.env`

3. **Vérifier l'historique Git**
   ```bash
   git log --all --full-history --source -- .env
   ```

## 📊 Rate Limits GitHub

Avec un token authentifié :
- **5000 requêtes/heure** pour l'API standard
- **30 requêtes/minute** pour la recherche de code

Sans token :
- **60 requêtes/heure** (trop faible)

Le scraper gère automatiquement les rate limits.

## 🔍 Vérifier votre token

### Via l'API GitHub

```bash
curl -H "Authorization: token ghp_votre_token" https://api.github.com/user
```

Devrait retourner vos infos utilisateur.

### Via le dashboard

```bash
curl -H "Authorization: token ghp_votre_token" https://api.github.com/rate_limit
```

Devrait montrer :
```json
{
  "resources": {
    "core": {
      "limit": 5000,
      "remaining": 5000,
      "reset": 1234567890
    },
    "search": {
      "limit": 30,
      "remaining": 30,
      "reset": 1234567890
    }
  }
}
```

## 🎯 Troubleshooting

### "Bad credentials"

Le token est invalide ou expiré.
→ Générer un nouveau token.

### "API rate limit exceeded"

Vous avez dépassé la limite.
→ Attendre le reset ou espacer les scans.

### "Not Found"

Le token n'a pas les bonnes permissions.
→ Vérifier les scopes : `public_repo` doit être coché.

## 📚 Documentation GitHub

- [Creating a personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [About authentication with SAML SSO](https://docs.github.com/en/authentication/authenticating-with-saml-single-sign-on/about-authentication-with-saml-single-sign-on)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)

---

**Temps estimé : 2 minutes** ⏱️
