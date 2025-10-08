# 🪙 Détection des Adresses Bitcoin et Crypto

## 🎯 Pourquoi Détecter les Adresses Publiques ?

### ⚠️ Important : Adresses ≠ Clés Privées

| Type | Confidentialité | Sévérité | Risque |
|------|----------------|----------|--------|
| **Clés Privées** | 🔴 SECRET | **CRITICAL** | **Vol de fonds direct** |
| **Adresses Publiques** | 🟢 PUBLIC | **LOW/MEDIUM** | Traçabilité, mauvaises pratiques |

---

## 🔐 Clés Privées vs Adresses Publiques

### 🔴 Clés Privées (CRITICAL - Ne JAMAIS exposer)

```env
# ❌ DANGER CRITIQUE - Donne accès aux fonds !
BITCOIN_PRIVATE_KEY=E9873D79C6D87DC0FB6A5778633389F4453213303DA61F20BD67FC233AA33262
BITCOIN_WIF=5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ
```

**Conséquences :** Accès total aux fonds, vol possible

### 🟢 Adresses Publiques (LOW - OK de partager, mais...)

```env
# ✅ Public, mais détection utile
BITCOIN_ADDRESS=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
BTC_ADDRESS=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
```

**Conséquences :** Aucun vol possible, mais traçabilité et analyse possible

---

## 🎯 Pourquoi On Les Détecte Quand Même ?

### 1. **Hardcoded Addresses (Mauvaise Pratique)**

Détecter les adresses hardcodées dans le code :

```javascript
// ❌ Mauvaise pratique détectée
const DONATION_ADDRESS = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

// ✅ Bonne pratique
const DONATION_ADDRESS = process.env.DONATION_ADDRESS;
```

**Pourquoi c'est mauvais ?**
- Difficile à changer
- Pas de flexibilité multi-environnement
- Risque de typo non détectée

### 2. **Traçabilité et Analyse**

```env
# Permet d'identifier :
- Les projets crypto
- Les services de paiement utilisés
- Les patterns de transactions
- Les portefeuilles impliqués
```

### 3. **Conformité et Audit**

```
Utile pour :
- Audits de sécurité
- Conformité réglementaire
- Analyse de flux de fonds
- Détection de fraudes
```

### 4. **Détection de Scams**

```
Identifier les adresses associées à :
- Scams connus
- Phishing
- Ransomware
- Ponzi schemes
```

---

## 📊 Nouveaux Patterns Ajoutés (8 patterns)

### Bitcoin Addresses (5 patterns)

| Pattern | Format | Exemple | Usage |
|---------|--------|---------|-------|
| `BITCOIN_ADDRESS_P2PKH` | Legacy (1...) | `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` | Variable déclarée |
| `BITCOIN_ADDRESS_P2SH` | P2SH (3...) | `3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy` | Multi-sig |
| `BITCOIN_ADDRESS_BECH32` | SegWit (bc1...) | `bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh` | SegWit natif |
| `BTC_ADDRESS` | Tous formats | Tous ci-dessus | Variable BTC_ADDRESS |
| `HARDCODED_BITCOIN_ADDRESS` | Hardcodé | Sans variable name | Adresse directe dans code |

### Ethereum Addresses (1 pattern)

| Pattern | Format | Exemple |
|---------|--------|---------|
| `HARDCODED_ETH_ADDRESS` | 0x... | `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb` |

### Solana Addresses (2 patterns)

| Pattern | Format | Exemple |
|---------|--------|---------|
| `SOLANA_ADDRESS` | Base58 | `7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK` |
| `SOL_ADDRESS` | Base58 | `7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK` |

---

## 🎨 Formats d'Adresses Bitcoin

### 1. Legacy (P2PKH) - Commence par "1"

```
Format : 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
Longueur : 26-35 caractères
Usage : Ancien standard, encore utilisé
```

**Exemple de détection :**
```env
BITCOIN_ADDRESS=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa  # ✅ Détecté
```

### 2. P2SH (Pay to Script Hash) - Commence par "3"

```
Format : 3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy
Longueur : 26-35 caractères
Usage : Multi-signature, smart contracts
```

**Exemple :**
```env
MULTISIG_ADDRESS=3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy  # ✅ Détecté
```

### 3. Bech32 (SegWit) - Commence par "bc1"

```
Format : bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
Longueur : 42-62 caractères (minuscules)
Usage : SegWit natif, fees plus faibles
```

**Exemple :**
```env
SEGWIT_ADDRESS=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh  # ✅ Détecté
```

---

## 🔍 Exemples de Détection

### ✅ Adresses en Variables (Sévérité: LOW)

```env
# Détecté avec sévérité LOW (normal, bonne pratique)
BITCOIN_ADDRESS=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
BTC_ADDRESS=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
SOLANA_ADDRESS=7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK
```

**Impact :** Identification du projet crypto, aucun risque

### ⚠️ Adresses Hardcodées (Sévérité: MEDIUM)

```javascript
// ❌ Mauvaise pratique - Sévérité MEDIUM
const recipient = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
await bitcoin.sendTo("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", amount);

// ✅ Bonne pratique
const recipient = process.env.RECIPIENT_ADDRESS;
```

**Impact :** Code inflexible, difficile à maintenir

---

## 📈 Impact sur les Statistiques

### Avant (41 patterns)
```
Total patterns : 41
- Critical : 34
- High : 6
- Medium : 1
- Low : 0
```

### Après (49 patterns) 🆕
```
Total patterns : 49
- Critical : 34
- High : 6
- Medium : 2 (+1 hardcoded ETH, +1 hardcoded BTC)
- Low : 7 (+7 adresses publiques)
```

---

## 🎛️ Configuration

### Activer/Désactiver la Détection d'Adresses

Si vous ne voulez pas détecter les adresses publiques :

```sql
-- Désactiver toutes les détections d'adresses
UPDATE github_sensitive_patterns
SET is_active = false
WHERE pattern_type = 'wallet_address';

-- Garder uniquement les hardcoded (MEDIUM)
UPDATE github_sensitive_patterns
SET is_active = true
WHERE pattern_name LIKE 'HARDCODED%';

-- Réactiver tout
UPDATE github_sensitive_patterns
SET is_active = true
WHERE pattern_type = 'wallet_address';
```

### Ajuster la Sévérité

```sql
-- Augmenter la sévérité des adresses hardcodées
UPDATE github_sensitive_patterns
SET severity = 'high'
WHERE pattern_name LIKE 'HARDCODED%';
```

---

## 🎯 Cas d'Usage

### 1. Audit de Code

```
Objectif : Identifier les adresses hardcodées
Action : Chercher les patterns MEDIUM
Résultat : Recommander l'utilisation d'env vars
```

### 2. Analyse de Projets Crypto

```
Objectif : Identifier les blockchains utilisées
Action : Chercher tous les patterns LOW
Résultat : Bitcoin + Ethereum + Solana détectés
```

### 3. Détection de Scams

```
Objectif : Trouver des adresses suspectes
Action : Croiser avec bases de données de scams
Résultat : Alerter si match trouvé
```

### 4. Conformité

```
Objectif : Audit réglementaire
Action : Tracer toutes les adresses utilisées
Résultat : Rapport de conformité
```

---

## 🔬 Exemples Réels de Détection

### Repository avec Donation Address

```javascript
// File: src/config.js
export const DONATION_CONFIG = {
  bitcoin: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",  // ⚠️ MEDIUM
  ethereum: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", // ⚠️ MEDIUM
  solana: "7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK"  // ⚠️ MEDIUM
};
```

**Finding :**
- **Sévérité** : MEDIUM
- **Type** : Hardcoded addresses
- **Recommandation** : Déplacer dans .env

### Repository avec Config Propre

```javascript
// File: src/config.js
export const DONATION_CONFIG = {
  bitcoin: process.env.BTC_ADDRESS,      // ✅ Bonne pratique
  ethereum: process.env.ETH_ADDRESS,     // ✅ Bonne pratique
  solana: process.env.SOLANA_ADDRESS     // ✅ Bonne pratique
};
```

**Finding :**
- **Sévérité** : LOW (dans le .env)
- **Type** : Configured addresses
- **Recommandation** : RAS, bonne pratique

---

## 📊 Dashboard - Filtrer par Adresses

Dans le dashboard web, vous pouvez maintenant :

1. **Filtrer par sévérité LOW** : Voir toutes les adresses publiques
2. **Filtrer par MEDIUM** : Voir les adresses hardcodées
3. **Filtrer par type "wallet_address"** : Toutes les adresses

```javascript
// Exemple de query SQL
SELECT * FROM github_security_findings
WHERE pattern_type = 'wallet_address'
AND severity = 'medium'  -- Seulement les hardcoded
ORDER BY discovered_at DESC;
```

---

## 🛡️ Meilleures Pratiques

### ✅ À FAIRE

```javascript
// 1. Utiliser des variables d'environnement
const btcAddress = process.env.BTC_ADDRESS;

// 2. Valider les adresses
if (!isValidBitcoinAddress(btcAddress)) {
  throw new Error('Invalid address');
}

// 3. Documenter
/**
 * @env BTC_ADDRESS - Bitcoin address for donations
 * @example BTC_ADDRESS=1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
 */
```

### ❌ À ÉVITER

```javascript
// 1. Hardcoded addresses
const btcAddress = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"; // ❌

// 2. Pas de validation
await sendBitcoin(userInput); // ❌ Dangereux

// 3. Addresses en clair dans les logs
console.log(`Sending to ${address}`); // ❌ Traçable
```

---

## 📚 Ressources

### Standards d'Adresses

- **Bitcoin BIP173** : https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki
- **Ethereum EIP-55** : https://eips.ethereum.org/EIPS/eip-55
- **Solana Docs** : https://docs.solana.com/terminology#account

### Validation

- **Bitcoin** : https://github.com/bitcoin/bitcoin/blob/master/src/addresstype.cpp
- **Ethereum** : https://ethereum.org/en/developers/docs/accounts/
- **Solana** : https://docs.solana.com/developing/clients/javascript-api

### Bases de Données de Scams

- **Bitcoin Abuse** : https://www.bitcoinabuse.com/
- **Etherscan Labels** : https://etherscan.io/labelcloud
- **Chainabuse** : https://www.chainabuse.com/

---

## 🔄 Mise à Jour du Scraper

Les patterns sont **déjà actifs** ! Pour les tester :

```bash
# Vérifier les patterns
npm run verify

# Lancer un scan
npm run scraper:start

# Vous devriez voir :
# "Loaded 49 active patterns"  (au lieu de 41)
```

---

## 📊 Résumé

| Ajout | Quantité | Sévérité | Impact |
|-------|----------|----------|--------|
| Adresses Bitcoin | 5 patterns | LOW/MEDIUM | +12% coverage |
| Adresses Ethereum | 1 pattern | MEDIUM | Hardcoded detection |
| Adresses Solana | 2 patterns | LOW | Solana projects |
| **Total** | **8 patterns** | **LOW/MEDIUM** | **+20% coverage** |

**Total patterns maintenant : 49** (41 + 8)

---

**Version 2.1 - Address Detection**
**49 patterns actifs**
**Octobre 2025**
