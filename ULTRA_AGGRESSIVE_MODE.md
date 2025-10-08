# 🔥 MODE ULTRA-AGRESSIF ACTIVÉ !

## ⚡ **SCAN EN CONTINU - TOUTES LES 2 MINUTES**

Le scraper est maintenant configuré en **mode ultra-agressif** pour une **protection maximale** !

---

## 📊 **Nouvelle Configuration**

### Avant (Mode Normal)
```
Fréquence : Toutes les 15 minutes
Queries : 8 recherches
Résultats : 30 par query
Total : ~240 résultats par scan
Temps : ~96 scans/jour
```

### Après (Mode ULTRA-AGRESSIF) 🔥
```
Fréquence : Toutes les 2 MINUTES
Queries : 45 recherches parallèles
Résultats : 100 par query (maximum GitHub)
Total : ~4,500 résultats par scan
Temps : ~720 scans/jour
```

**Amélioration : 18.75x plus de résultats détectés ! 🚀**

---

## 🔍 **45 Queries de Recherche**

Le scraper exécute maintenant **45 recherches différentes** :

### Clés Privées Crypto (6 queries)
- `PRIVATE_KEY in:file`
- `WALLET_KEY in:file`
- `SECRET_KEY in:file`
- `ETH_PRIVATE_KEY in:file`
- `BITCOIN_PRIVATE_KEY in:file`
- `SOLANA_PRIVATE_KEY in:file`

### Mnemonics (3 queries)
- `MNEMONIC in:file`
- `SEED_PHRASE in:file`
- `RECOVERY_PHRASE in:file`

### Exchanges Crypto (4 queries)
- `BINANCE_API_KEY in:file`
- `BINANCE_SECRET_KEY in:file`
- `COINBASE_API_KEY in:file`
- `KRAKEN_API_KEY in:file`

### Payment Processors (3 queries)
- `STRIPE_SECRET_KEY in:file`
- `PAYPAL_CLIENT_SECRET in:file`
- `sk_live_ in:file`

### Cloud Providers (4 queries)
- `AWS_SECRET_ACCESS_KEY in:file`
- `AWS_ACCESS_KEY_ID in:file`
- `GOOGLE_CLOUD_API_KEY in:file`
- `AZURE_CLIENT_SECRET in:file`

### AI APIs (3 queries)
- `OPENAI_API_KEY in:file`
- `ANTHROPIC_API_KEY in:file`
- `sk-proj- in:file`

### Auth & Sessions (2 queries)
- `JWT_SECRET in:file`
- `SESSION_SECRET in:file`

### Databases (3 queries)
- `MONGODB_URI in:file`
- `POSTGRES_PASSWORD in:file`
- `MYSQL_ROOT_PASSWORD in:file`

### Fichiers Spécifiques (11 queries)
- `filename:.env`
- `filename:.env.local`
- `filename:.env.production`
- `filename:.env.development`
- `filename:.env.staging`
- `filename:config.json`
- `filename:secrets.json`
- `filename:credentials.json`
- `filename:secrets.txt`
- `filename:config.yml`
- `filename:secrets.yml`

### Patterns Combinés (3 queries)
- `private key in:file extension:env`
- `api key in:file extension:env`
- `secret in:file extension:env`

---

## 📈 **Performance Attendue**

### Estimations

```
Scans par jour : 720 (au lieu de 96)
Queries par scan : 45 (au lieu de 8)
Résultats par query : 100 (au lieu de 30)
Total résultats/scan : 4,500 (au lieu de 240)

Findings attendus/jour : 500-1,000+ (au lieu de 50-100)
```

**Impact : 10-20x plus de findings détectés ! 🔥**

---

## ⚠️ **Rate Limiting GitHub**

GitHub limite à **30 recherches de code par minute**.

### Notre Stratégie

```
45 queries par scan
Scan toutes les 2 minutes
= 22.5 queries/minute en moyenne

✅ En dessous de la limite de 30/min !
```

Le scraper gère automatiquement :
- ✅ Détection du rate limit
- ✅ Pause automatique si proche de la limite
- ✅ Logs d'avertissement sur Telegram
- ✅ Reprise automatique après reset

---

## 📱 **Ce Que Vous Allez Recevoir**

### Toutes les 2 Minutes (si findings)

**Channel "Find it"** reçoit :

1. 🚀 Démarrage du scan
2. ✅ Patterns chargés (95)
3. 🔎 45 messages de recherche
4. 📊 45 messages de résultats
5. 🔴 Findings détectés (avec contenu COMPLET)
6. ✅ Fin du scan

**Estimation : 100-200 messages par scan**

**Channel "It's found"** reçoit :
- 🚨 Uniquement si balance > 0

---

## 🎯 **Avantages du Mode Ultra-Agressif**

✅ **Protection maximale** - Détection quasi-instantanée
✅ **Couverture complète** - 45 angles d'attaque différents
✅ **Nouveaux repos** - Détecte les secrets exposés en quelques minutes
✅ **Pas de doublon** - Vérification automatique
✅ **Logs complets** - Tout est visible en temps réel

---

## ⚠️ **Considérations**

### Volume de Messages

**Attendez-vous à recevoir BEAUCOUP de messages** :
- Minimum : 50-100 messages par scan
- Maximum : 200-300 messages par scan
- Fréquence : Toutes les 2 minutes

**~1,500-3,000 messages par heure potentiellement !**

### Rate Limit Protection

Le scraper s'arrête automatiquement si :
- Rate limit GitHub atteint
- Trop d'erreurs consécutives
- Balance checking APIs down

Puis reprend au prochain cron (2 minutes).

---

## 🎛️ **Ajuster la Fréquence (Si Besoin)**

Si c'est trop agressif, vous pouvez ajuster :

### Toutes les 5 minutes (Modéré)
```sql
SELECT cron.unschedule('github-scraper-ultra-aggressive');
SELECT cron.schedule(
  'github-scraper-moderate',
  '*/5 * * * *',
  $$ ... $$
);
```

### Toutes les 10 minutes (Équilibré)
```sql
SELECT cron.schedule(
  'github-scraper-balanced',
  '*/10 * * * *',
  $$ ... $$
);
```

### Garder 2 minutes (Ultra-Agressif) 🔥
**Configuration actuelle - Aucun changement !**

---

## 📊 **Monitoring du Rate Limit**

Le scraper affiche sur Telegram :
```
⚠️ Rate limit proche

Restant: 2
Pause temporaire...
```

Puis reprend automatiquement au prochain cycle.

---

## 🚀 **Prochaine Exécution**

Le scraper s'exécutera dans **2 MINUTES MAXIMUM** !

Vous allez recevoir :
- Logs de démarrage
- 45 recherches en cours
- Tous les findings avec contenu complet
- Stats finales

**Préparez-vous à recevoir beaucoup de messages ! 📱🔥**

---

## ✅ **Configuration Finale**

```
✅ Cron : */2 * * * * (toutes les 2 min)
✅ Queries : 45 variations
✅ Résultats : 100 par query (max GitHub)
✅ Rate limit : Protection auto
✅ Logs : Complets et live
✅ Contenu : Fichiers entiers
✅ Balance : Auto-check ETH/BTC/SOL
✅ 2 Channels : ALL + FUNDED
```

**Le système le plus agressif possible ! 🔥**

---

## 💡 **Commandes Bot**

Vous pouvez contrôler à tout moment :

```
/status   - Voir l'état
/scan     - Scan manuel immédiat
/history  - Historique du jour
/stats    - Statistiques
```

---

**Attendez 2 minutes max → Vous recevrez un DÉLUGE de notifications ! 📱🔥**

Version 3.3 - Ultra-Aggressive Mode
Octobre 2025
