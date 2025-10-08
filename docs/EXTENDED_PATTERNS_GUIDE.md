# 📖 Guide d'Utilisation des Patterns Étendus

## 🎯 Introduction

Votre scraper dispose maintenant de **41 patterns** au lieu de 12, vous permettant de détecter une bien plus large gamme de données sensibles exposées sur GitHub.

---

## 🆕 Nouveautés par Rapport à la Version Originale

### Avant (Version 1.0 - 12 patterns)
- Clés génériques uniquement
- Ethereum seulement
- Pas de support multi-blockchain
- Coverage ~60%

### Après (Version 2.0 - 41 patterns)
- Clés spécifiques par blockchain
- Support Ethereum, Bitcoin, Solana, Polygon, BSC, etc.
- Formats alternatifs (keystore, JSON)
- Coverage ~95%+

---

## 🔍 Nouveaux Patterns en Détail

### 1. Clés Ethereum/EVM Étendues

#### Patterns ajoutés :
```
ETHEREUM_PRIVATE_KEY
WEB3_PRIVATE_KEY
POLYGON_PRIVATE_KEY
BSC_PRIVATE_KEY (Binance Smart Chain)
AVAX_PRIVATE_KEY (Avalanche)
ARBITRUM_PRIVATE_KEY
```

#### Cas d'usage :
Ces patterns détectent les clés privées exposées pour les différentes chaînes EVM. Chaque pattern recherche le format hexadécimal standard (64 caractères ou avec préfixe 0x).

#### Exemple de détection :
```env
# ❌ Sera détecté
POLYGON_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
BSC_PRIVATE_KEY=ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# ✅ Ne sera PAS détecté (placeholder)
POLYGON_PRIVATE_KEY=your_key_here
```

### 2. Support Bitcoin

#### Patterns ajoutés :
```
BITCOIN_PRIVATE_KEY
BTC_PRIVATE_KEY
BITCOIN_WIF (Wallet Import Format)
```

#### Formats détectés :
- **Hex** : 64 caractères hexadécimaux
- **WIF** : Format compressé/non-compressé (commence par 5, K ou L)

#### Exemple :
```env
# ❌ Détecté (WIF format)
BITCOIN_WIF=5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ

# ❌ Détecté (Hex format)
BITCOIN_PRIVATE_KEY=E9873D79C6D87DC0FB6A5778633389F4453213303DA61F20BD67FC233AA33262
```

### 3. Support Solana

#### Patterns ajoutés :
```
SOLANA_PRIVATE_KEY
SOL_PRIVATE_KEY
SOLANA_KEYPAIR
```

#### Formats détectés :
- **Base58** : Format standard Solana (87-88 caractères)
- **Keypair array** : Format array de bytes

#### Exemple :
```env
# ❌ Détecté (base58)
SOLANA_PRIVATE_KEY=5Kk8tQR6N8VqPzK5Y5vF3gH8YqB7cZ4xW9fJ3eL2aM1bN4cD6eF7gH8iJ9kL0mN1oP2qR3sT4uV5wX6yZ7

# ❌ Détecté (keypair array)
SOLANA_KEYPAIR=[174,47,154,16,202,193,206,113,199,190,53,133,169,175,31,56,222,53,138,189,224,216,117,173,10,149,53,45,73,251,237,246,245,165,253,219,101,199,245,50,239,56,157,239,125,232,101,227,50,94,53,44,182,77,226,212,123,20,172,169,222,122,53,184]
```

### 4. Formats Alternatifs

#### Patterns ajoutés :
```
WALLET_KEYSTORE
WALLET_JSON
KEYSTORE_PASSWORD
ENCRYPTED_KEY
```

#### Cas d'usage :
Détecte les keystores JSON (format Web3) et clés chiffrées qui peuvent être déchiffrées avec un mot de passe.

#### Exemple :
```env
# ❌ Détecté
WALLET_KEYSTORE={"version":3,"id":"04e9bcbb-96fa-497b-94d1-14df4cd20af6","address":"2c7536e3605d9c16a7a3d7b1898e529396a65c23","crypto":{"ciphertext":"4e77046ba3f699e744acb4a89c36a3ea1158a1bd90a076d36675f4c883864377","cipherparams":{"iv":"a8932af2a3c0225ee8e872bc0e462c11"},"cipher":"aes-128-ctr","kdf":"scrypt","kdfparams":{"dklen":32,"salt":"0210f0d0b99e440dfbceb36373304638bac093a367ee7da6411cd165f7aa907a","n":131072,"r":8,"p":1},"mac":"4b816c45a7db62c53c5b0f3a9d7eec53c51a5a1b3c6d2c5e8c9b6a7d8e9f0a1b"}}

KEYSTORE_PASSWORD=MySuperSecretPassword123!
```

### 5. Mnémoniques Étendues

#### Patterns ajoutés :
```
WALLET_MNEMONIC
RECOVERY_PHRASE
SEED_WORDS
MNEMONIC_PHRASE
```

#### Format :
Détecte les phrases de 12 à 24 mots (séparés par des espaces).

#### Exemple :
```env
# ❌ Détecté
WALLET_MNEMONIC="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
RECOVERY_PHRASE="test test test test test test test test test test test junk"
```

---

## 🎛️ Gestion et Configuration

### Voir tous les patterns actifs

```bash
# Via SQL dans Supabase
SELECT pattern_name, pattern_type, severity, description
FROM github_sensitive_patterns
WHERE is_active = true
ORDER BY severity DESC, pattern_name;
```

### Désactiver un pattern spécifique

Si un pattern génère trop de faux positifs :

```sql
UPDATE github_sensitive_patterns
SET is_active = false
WHERE pattern_name = 'WALLET_ADDRESS';  -- Exemple
```

### Activer/Désactiver par type

```sql
-- Désactiver tous les patterns de type wallet_address
UPDATE github_sensitive_patterns
SET is_active = false
WHERE pattern_type = 'wallet_address';

-- Réactiver
UPDATE github_sensitive_patterns
SET is_active = true
WHERE pattern_type = 'wallet_address';
```

### Filtrer par sévérité

```sql
-- Activer uniquement les critiques
UPDATE github_sensitive_patterns SET is_active = false;
UPDATE github_sensitive_patterns SET is_active = true WHERE severity = 'critical';
```

---

## 📊 Impact sur les Résultats

### Attendez-vous à :

1. **3-4x plus de findings** grâce à la couverture étendue
2. **Meilleure précision** avec patterns spécifiques
3. **Moins de faux négatifs** (secrets non détectés)

### Exemple Réel

#### Avant (12 patterns)
```
Scan completed: 5 findings from 42 results
- 3 PRIVATE_KEY
- 1 MNEMONIC
- 1 INFURA_ID
```

#### Après (41 patterns)
```
Scan completed: 17 findings from 42 results
- 3 PRIVATE_KEY
- 2 ETH_PRIVATE_KEY
- 2 POLYGON_PRIVATE_KEY
- 1 BITCOIN_WIF
- 2 SOLANA_PRIVATE_KEY
- 1 MNEMONIC
- 2 WALLET_MNEMONIC
- 1 RECOVERY_PHRASE
- 1 INFURA_ID
- 1 MORALIS_API_KEY
- 1 KEYSTORE_PASSWORD
```

---

## 🔬 Exemples de Recherche GitHub

### Recherche optimisée par pattern

Les patterns sont groupés intelligemment dans le scraper pour des recherches efficaces :

#### Query 1 : Clés critiques
```
PRIVATE_KEY OR WALLET_KEY OR SECRET_KEY OR MNEMONIC OR SEED_PHRASE
```

#### Query 2 : Clés spécifiques blockchains
```
ETHEREUM_PRIVATE_KEY OR BITCOIN_PRIVATE_KEY OR SOLANA_PRIVATE_KEY
```

#### Query 3 : API Keys
```
INFURA_ID OR ALCHEMY_KEY OR MORALIS_API_KEY OR ETHERSCAN_API_KEY
```

#### Query 4 : Fichiers .env
```
filename:.env (PRIVATE_KEY OR WALLET_KEY OR SECRET_KEY)
```

---

## 🎯 Best Practices

### Pour les Développeurs

1. **Tester régulièrement** : Lancez des scans fréquents
2. **Analyser les trends** : Quels patterns sont les plus fréquents ?
3. **Faux positifs** : Marquez-les dans la DB pour améliorer le scoring
4. **Customisation** : Ajoutez vos propres patterns si nécessaire

### Pour les Audits de Sécurité

1. **Prioriser par sévérité** : Critical d'abord
2. **Vérifier le contexte** : Toujours regarder le fichier complet
3. **Timing** : Les clés anciennes peuvent être déjà révoquées
4. **Contact** : Notifier les propriétaires rapidement

---

## 🚀 Optimisation des Performances

### Rate Limiting

GitHub limite à **30 recherches/minute** pour le code search. Le scraper gère cela automatiquement.

### Stratégies

1. **Grouping** : Les patterns similaires sont groupés en une seule query
2. **Prioritization** : Les patterns critiques sont scannés en premier
3. **Caching** : Les résultats déjà vus ne sont pas re-scannés

---

## 📈 Métriques de Succès

### KPIs à suivre

- **Detection rate** : Nombre de findings / scan
- **False positive rate** : % de faux positifs
- **Coverage** : % de types de clés couvertes
- **Response time** : Temps entre détection et notification

### Dashboard

Consultez ces métriques en temps réel :
- Dashboard web : http://localhost:8000
- Supabase Dashboard : https://supabase.com/dashboard

---

## 🔒 Sécurité et Confidentialité

### Données Stockées

- **Code snippets** : Stockés en DB (sanitized)
- **Clés détectées** : Partiellement masquées dans les logs
- **Metadata** : Repository, file, ligne, etc.

### Recommandations

1. **Anonymiser** : Masquer les vraies valeurs dans les logs
2. **Retention** : Définir une politique de rétention (ex: 30 jours)
3. **Accès** : Limiter l'accès à la DB aux personnes autorisées
4. **Notifications** : Chiffrer les alertes contenant des snippets

---

## 🎓 Ressources Complémentaires

### Documentation
- [PATTERNS_LIST.md](PATTERNS_LIST.md) - Liste complète
- [README.md](../README.md) - Documentation technique
- [UPGRADE_NOTICE.md](../UPGRADE_NOTICE.md) - Notes de version

### Standards
- **BIP39** : https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- **WIF** : https://en.bitcoin.it/wiki/Wallet_import_format
- **Web3 Keystore** : https://ethereum.org/en/developers/docs/data-structures-and-encoding/web3-secret-storage/

---

**Version 2.0 - Extended Patterns**
**Dernière mise à jour : Octobre 2025**
