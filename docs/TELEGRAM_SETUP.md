# 📱 Configuration Telegram pour les Notifications

## 🎯 Objectif

Recevoir des **notifications en temps réel** dans un **channel Telegram privé** à chaque fois qu'un secret sensible est détecté sur GitHub.

---

## 🤖 Étape 1 : Créer un Bot Telegram

### 1. Ouvrir BotFather

Sur Telegram, rechercher : **@BotFather**

### 2. Créer le bot

```
/newbot
```

### 3. Nommer le bot

```
Name: GitHub Security Scraper Bot
Username: github_security_scraper_bot (ou autre)
```

### 4. Copier le Token

BotFather vous donnera un token comme :
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
```

**⚠️ Gardez ce token secret !**

---

## 💬 Étape 2 : Créer un Channel Privé

### 1. Créer un nouveau channel

- Ouvrir Telegram
- Menu → New Channel
- Nom : `GitHub Security Alerts` (ou autre)
- Type : **Private Channel** 🔒
- Description : `Alertes de sécurité GitHub`

### 2. Ajouter le bot au channel

- Paramètres du channel
- Administrators → Add Administrator
- Rechercher votre bot : `@github_security_scraper_bot`
- Ajouter avec permissions :
  - ✅ Post Messages
  - ✅ Edit Messages

### 3. Obtenir le Chat ID

#### Option A : Via bot (recommandé)

1. Envoyez un message dans votre channel
2. Utilisez ce script pour obtenir le Chat ID :

```bash
# Remplacez YOUR_BOT_TOKEN par votre token
curl https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
```

Cherchez dans la réponse :
```json
{
  "message": {
    "chat": {
      "id": -1001234567890,  // ← C'est votre CHAT_ID
      "title": "GitHub Security Alerts"
    }
  }
}
```

#### Option B : Via @userinfobot

1. Ajoutez **@userinfobot** à votre channel
2. Il affichera le Chat ID
3. Retirez-le ensuite

---

## ⚙️ Étape 3 : Configuration du Scraper

### Ajouter les variables dans `.env`

```bash
cd /Users/hacker/Desktop/github/github-security-scraper
nano .env
```

Ajoutez ces lignes :

```env
# Telegram Configuration
TELEGRAM_NOTIFICATIONS=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_CHAT_ID=-1001234567890
```

**Exemple complet du `.env` :**

```env
# GitHub
GITHUB_TOKEN=ghp_votre_token

# Supabase
SUPABASE_URL=https://nykctocknzbstdqnfkun.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# Scraper
SCRAPER_INTERVAL_MINUTES=15
MAX_RESULTS_PER_SCAN=100
ENABLE_NOTIFICATIONS=true

# Telegram (NOUVEAU)
TELEGRAM_NOTIFICATIONS=true
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_CHAT_ID=-1001234567890

# Autres alertes
ALERT_EMAIL=studio@dafnck.com
```

---

## 🧪 Étape 4 : Tester la Configuration

### Test de connexion

```bash
npm run scraper:start
```

Vous devriez recevoir dans Telegram :
```
✅ Test de Connexion

Le scraper GitHub Security est correctement configuré !

📊 Configuration:
Bot Token  : ✓ Configuré
Chat ID    : ✓ Configuré
Status     : ✓ Activé

🚀 Le scraper est prêt à détecter les secrets exposés !
```

---

## 📨 Types de Notifications

### 1. Nouveau Finding Critique

```
🔴 CRITICAL - private_key

🔍 Repository: user/vulnerable-repo
📁 File: .env
🔑 Pattern: PRIVATE_KEY=0xac09...

👤 Owner: username
⏰ Discovered: 08/10/2025 15:30

🔗 Voir le fichier
```

### 2. Résumé de Scan

```
🔍 Scan Terminé

📊 Résumé
Scan ID    : abc12345
Résultats  : 42
Findings   : 15
Status     : Completed ✅

💡 Dashboard: Voir les détails
```

### 3. Batch de Findings

```
🚨 15 Nouveaux Findings Détectés !

📊 Par Sévérité:
🔴 Critical : 8
🟠 High     : 5
🟡 Medium   : 2

🔍 Top 5:
1. 🔴 private_key - user/repo1
2. 🔴 api_key - user/repo2
...
```

### 4. Erreurs

```
🚨 Erreur Scraper

❌ Message: Rate limit exceeded

📝 Context: GitHub API

⏰ Time: 2025-10-08T15:30:00Z
```

---

## 🎛️ Configuration Avancée

### Désactiver Telegram (garder email/webhook)

```env
TELEGRAM_NOTIFICATIONS=false
```

### Notifications uniquement critiques

Modifier `src/services/telegram-notifier.ts` :

```typescript
async notifyFinding(finding: SecurityFinding): Promise<boolean> {
  // Seulement les critiques
  if (finding.severity !== 'critical') return false;
  
  const emoji = this.getSeverityEmoji(finding.severity);
  const message = this.formatFindingMessage(finding, emoji);
  return this.sendMessage(message);
}
```

### Channel Telegram vs Groupe

**Channel (recommandé) :**
- ✅ Notifications one-way
- ✅ Historique persistant
- ✅ Plus professionnel

**Groupe :**
- ✅ Discussions possible
- ❌ Plus de spam
- ❌ Moins organisé

---

## 🚀 Déploiement Production

### Variables d'environnement Railway

Lors du déploiement sur Railway, ajoutez :

```bash
TELEGRAM_NOTIFICATIONS=true
TELEGRAM_BOT_TOKEN=123456789:ABC...
TELEGRAM_CHAT_ID=-1001234567890
```

### Variables Supabase Edge Function

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=123456789:ABC...
supabase secrets set TELEGRAM_CHAT_ID=-1001234567890
```

---

## 🔒 Sécurité

### ✅ Bonnes Pratiques

1. **Channel Privé** : Ne jamais rendre public
2. **Token Secret** : Jamais commit dans Git
3. **Permissions** : Bot avec permissions minimales
4. **Rotation** : Changer le token si compromis

### ❌ À Éviter

- ✗ Channel public (n'importe qui peut voir)
- ✗ Partager le bot token
- ✗ Inclure des secrets complets dans les messages
- ✗ Trop de notifications (spam)

### 🛡️ Protection des Données Sensibles

Les messages Telegram **ne contiennent JAMAIS** :
- ✅ Les vraies clés privées (toujours masquées)
- ✅ Les passwords complets
- ✅ Les secrets entiers

Seulement :
- ✅ Nom du repo
- ✅ Type de pattern
- ✅ Sévérité
- ✅ Lien pour investiguer

---

## 📊 Exemple de Flux Complet

```
1. Scraper détecte une STRIPE_SECRET_KEY exposée
   ↓
2. Enregistrement dans Supabase
   ↓
3. Notification Telegram envoyée
   ↓
4. Vous recevez l'alerte sur votre téléphone
   ↓
5. Clic sur le lien → Voir le repo GitHub
   ↓
6. Contact du propriétaire
   ↓
7. Résolution du problème
```

---

## 🎨 Personnalisation des Messages

### Modifier le format

Éditez `src/services/telegram-notifier.ts` :

```typescript
private formatFindingMessage(finding: SecurityFinding, emoji: string): string {
  return `
${emoji} *ALERTE SÉCURITÉ*

🔥 *${finding.severity.toUpperCase()}* - ${finding.pattern_type}

📦 *Repo:* ${finding.repository_name}
📄 *File:* ${finding.file_path}
👤 *Owner:* @${finding.repository_owner}

🔗 [Voir](${finding.repository_url})
⏰ ${new Date().toLocaleTimeString('fr-FR')}
  `.trim();
}
```

---

## 🧪 Tests

### Test manuel

```bash
npm run scraper:start
```

### Test via script

```typescript
import telegramNotifier from './src/services/telegram-notifier.js';

// Test simple
await telegramNotifier.sendMessage('🧪 Test notification');

// Test finding
await telegramNotifier.notifyFinding({
  repository_name: 'test/repo',
  repository_url: 'https://github.com/test/repo',
  repository_owner: 'test',
  pattern_type: 'private_key',
  severity: 'critical',
  matched_pattern: 'PRIVATE_KEY=0x***',
  code_snippet: 'PRIVATE_KEY=0x...',
  file_path: '.env',
  discovered_at: new Date().toISOString(),
});
```

---

## 📚 Documentation Telegram

- **Bot API** : https://core.telegram.org/bots/api
- **BotFather** : https://t.me/BotFather
- **Markdown** : https://core.telegram.org/bots/api#markdown-style

---

## 🐛 Troubleshooting

### "Telegram notifications disabled"

Vérifiez :
```env
TELEGRAM_NOTIFICATIONS=true  # Doit être true
```

### "Bot token not configured"

```env
TELEGRAM_BOT_TOKEN=123456789:ABC...  # Ne doit pas être vide
```

### "Chat not found"

Le Chat ID est incorrect ou le bot n'est pas admin du channel.
→ Vérifier que le bot est bien ajouté comme administrateur

### "Forbidden: bot was blocked by the user"

Si c'est un chat direct : débloquez le bot
Si c'est un channel : vérifiez les permissions

---

## ✅ Checklist de Configuration

- [ ] Bot créé via @BotFather
- [ ] Token copié et ajouté au `.env`
- [ ] Channel privé créé
- [ ] Bot ajouté comme administrateur du channel
- [ ] Chat ID obtenu et ajouté au `.env`
- [ ] `TELEGRAM_NOTIFICATIONS=true` dans `.env`
- [ ] Test de connexion réussi

---

**Une fois tout configuré, vous recevrez des notifications en temps réel ! 📱**

Version 3.0 - Telegram Integration
Octobre 2025
