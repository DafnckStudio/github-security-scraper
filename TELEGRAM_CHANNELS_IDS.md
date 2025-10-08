# 📱 VOS 3 CANAUX TELEGRAM

## 🆔 **Chat IDs**

### Canal 1 : "Find it"
```
Chat ID: -1003113285705
Nom: Find it
```
**Utilisation :** TOUS les findings (crypto + autres)

---

### Canal 2 : "It's found"  
```
Chat ID: -1002944547225
Nom: It's found
```
**Utilisation :** Clés crypto uniquement

---

### Canal 3 : "Crypto-Wallets" (NOUVEAU !) 🆕
```
Chat ID: -1003103313553
Nom: Crypto-Wallets
```
**Utilisation :** À configurer

---

## 🔧 **Pour Utiliser le Nouveau Canal**

Si vous voulez que ce canal reçoive des alertes, modifiez le fichier :

### Option 1 : Remplacer "It's found"
```typescript
const CHAT_ID_FUNDED = '-1003103313553';  // Crypto-Wallets
```

### Option 2 : Ajouter comme 3ème canal
```typescript
const CHAT_ID_ALL = '-1003113285705';      // Find it
const CHAT_ID_FUNDED = '-1002944547225';   // It's found  
const CHAT_ID_CRYPTO = '-1003103313553';   // Crypto-Wallets (nouveau)
```

---

## 📊 **Configuration Actuelle**

```
Canal 1 (Find it)      : ✅ Configuré
Canal 2 (It's found)   : ✅ Configuré
Canal 3 (Crypto-Wallets): ⏳ Pas encore configuré
```

---

**Voulez-vous que j'active le canal "Crypto-Wallets" pour recevoir des alertes ?** 🚀
