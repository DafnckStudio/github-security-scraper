# 🔐 GitHub Security Scraper

## 🎯 Mission

Système automatisé de détection et d'alerte pour identifier les données sensibles exposées publiquement sur GitHub (clés privées, seeds, credentials, etc.) afin de protéger les utilisateurs.

## 🚀 Fonctionnalités

- ✅ **Scan continu** : Recherche automatique 24/7 sur GitHub
- ✅ **Détection de patterns** : 41 patterns prédéfinis pour crypto/web3
- ✅ **Base de données Supabase** : Stockage et historique des findings
- ✅ **Système d'alertes** : Notifications multiples (email, webhook, Slack)
- ✅ **Dashboard UI** : Interface de monitoring et gestion
- ✅ **Rate limiting** : Respect des limites API GitHub
- ✅ **Validation automatique** : Réduit les faux positifs

## 📊 Patterns détectés (41 au total)

### 🔴 Clés Privées & Seeds (34 patterns critiques)
- **Générales** : `PRIVATE_KEY`, `WALLET_KEY`, `SECRET_KEY`, `ETH_PRIVATE_KEY`, `PRIV_KEY`, etc.
- **Mnémoniques** : `MNEMONIC`, `SEED_PHRASE`, `WALLET_MNEMONIC`, `RECOVERY_PHRASE`, etc.
- **Ethereum/EVM** : `ETHEREUM_PRIVATE_KEY`, `WEB3_PRIVATE_KEY`, `POLYGON_PRIVATE_KEY`, `BSC_PRIVATE_KEY`, `ARBITRUM_PRIVATE_KEY`, `AVAX_PRIVATE_KEY`
- **Bitcoin** : `BITCOIN_PRIVATE_KEY`, `BTC_PRIVATE_KEY`, `BITCOIN_WIF`
- **Solana** : `SOLANA_PRIVATE_KEY`, `SOL_PRIVATE_KEY`, `SOLANA_KEYPAIR`
- **Formats** : `WALLET_KEYSTORE`, `WALLET_JSON`, `ENCRYPTED_KEY`

### 🟠 API Keys & Credentials (7 patterns élevés)
- **API Keys** : `INFURA_ID`, `ALCHEMY_KEY`, `ETHERSCAN_API_KEY`, `MORALIS_API_KEY`, `WALLET_API_KEY`
- **RPC & DB** : `RPC_URL`, `DB_PASSWORD`, `KEYSTORE_PASSWORD`

📄 **[Voir la liste complète des 41 patterns →](docs/PATTERNS_LIST.md)**

## 🛠️ Installation

```bash
# Cloner le repo
cd github-security-scraper

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos credentials

# Lancer le scraper en mode développement
npm run scraper:start

# Lancer en mode continu (production)
npm run scraper:continuous
```

## ⚙️ Configuration

### Variables d'environnement

```env
# GitHub
GITHUB_TOKEN=ghp_xxx... # Token avec scope 'public_repo'

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Scraper
SCRAPER_INTERVAL_MINUTES=15  # Fréquence des scans
MAX_RESULTS_PER_SCAN=100     # Limite par scan
DRY_RUN=false                # Mode test (pas de DB)

# Alertes
ALERT_EMAIL=security@example.com
WEBHOOK_URL=https://hooks.slack.com/xxx
```

## 📁 Structure du Projet

```
github-security-scraper/
├── src/
│   ├── config/
│   │   └── index.ts              # Configuration centralisée
│   ├── services/
│   │   ├── github-scraper.ts     # Service de scraping GitHub
│   │   ├── pattern-matcher.ts    # Détection de patterns
│   │   ├── supabase-storage.ts   # Stockage Supabase
│   │   └── alert-service.ts      # Système d'alertes
│   ├── scraper/
│   │   ├── index.ts              # Point d'entrée scan unique
│   │   └── continuous.ts         # Worker continu
│   ├── types/
│   │   └── index.ts              # Types TypeScript
│   └── utils/
│       ├── logger.ts             # Logging Winston
│       └── rate-limiter.ts       # Gestion rate limits
├── supabase/
│   └── functions/
│       └── scraper-worker/       # Edge Function Supabase
└── ui/                           # Interface de monitoring
```

## 🔄 Workflow

1. **Scan** : Recherche GitHub avec patterns regex
2. **Analyse** : Validation et scoring des findings
3. **Stockage** : Enregistrement dans Supabase
4. **Alertes** : Notifications automatiques
5. **Monitoring** : Dashboard temps réel

## 🎨 Dashboard UI

Interface web pour :
- 📊 Visualiser les findings en temps réel
- 🔍 Filtrer par sévérité/type/statut
- ✅ Marquer comme faux positifs
- 📧 Gérer les alertes
- 📈 Statistiques et analytics

## 🔒 Sécurité

- ✅ **RLS Policies** : Row-Level Security activée
- ✅ **Service Role Key** : Jamais exposée côté client
- ✅ **Rate Limiting** : Respect API GitHub (5000 req/h)
- ✅ **Logs sécurisés** : Pas de secrets dans les logs

## 📈 Performance

- **15 min** : Intervalle de scan par défaut
- **100 résultats/scan** : Limite configurable
- **~300 scans/jour** : Monitoring continu
- **< 1s** : Temps de détection par pattern

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

MIT License - Voir LICENSE pour détails

## ⚠️ Disclaimer

Cet outil est destiné à aider à protéger les utilisateurs en identifiant les données sensibles exposées. Utilisez-le de manière responsable et éthique.

---

Made with ❤️ for a safer GitHub
