# 📊 GitHub Security Scraper - Dashboard UI

Interface web de monitoring pour visualiser les findings de sécurité en temps réel.

## 🚀 Lancement

### Option 1: Serveur Python Simple
```bash
cd ui
python3 -m http.server 8000
```

### Option 2: Serveur Node.js
```bash
npm install -g http-server
cd ui
http-server -p 8000
```

### Option 3: Live Server (VS Code)
1. Installer l'extension "Live Server"
2. Clic droit sur `index.html` → "Open with Live Server"

Ouvrir : http://localhost:8000

## ✨ Fonctionnalités

### Dashboard
- 📊 **Statistiques en temps réel**
  - Total des findings
  - Findings critiques
  - Nouveaux findings
  - Total des scans

### Table des Findings
- 🔍 **Filtres avancés**
  - Recherche par repository
  - Filtre par sévérité
  - Filtre par statut

- 📋 **Informations détaillées**
  - Nom du repository
  - Fichier concerné
  - Type de pattern détecté
  - Sévérité
  - Statut
  - Date de découverte

### Auto-refresh
- 🔄 Rafraîchissement automatique toutes les 60 secondes
- Bouton de rafraîchissement manuel

## 🎨 Design

- **TailwindCSS** : Framework CSS moderne
- **Font Awesome** : Icônes
- **Responsive** : Adapté mobile/tablet/desktop

## 🔐 Sécurité

- Utilise l'`ANON_KEY` de Supabase (lecture seule)
- RLS policies activées côté serveur
- Aucune opération destructive depuis le front

## 🔧 Configuration

Les credentials Supabase sont hardcodés dans le HTML pour simplifier le déploiement.
En production, utilisez des variables d'environnement ou un build process.

## 📱 Interface

### Vue Desktop
- Layout 4 colonnes pour les stats
- Table pleine largeur

### Vue Mobile
- Stats en colonne unique
- Table scrollable horizontalement

## 🎯 Prochaines étapes

- [ ] Ajouter un graphique de tendance
- [ ] Exporter les findings en CSV/JSON
- [ ] Système de notifications push
- [ ] Intégration avec GitHub API pour créer des issues
- [ ] Dashboard d'analytics avancés
