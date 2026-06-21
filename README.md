# 🌑 DARK IA WEB
**Powered by MOISETECH — Le jeune Sénégalais 🇸🇳**

Chat IA propulsé par l'API Gemini, avec backend Node.js sécurisé (la clé API ne quitte jamais le serveur), historique de conversations, upload d'images/fichiers, et 4 thèmes visuels (Violet, Bleu, Vert, Light).

---

## 📁 Structure du projet

```
dark-ia-web/
├── server.js              # Serveur Express (routes API, appel Gemini)
├── package.json           # Dépendances Node.js
├── .env.example            # Modèle de fichier d'environnement
├── .env                    # Tes vraies variables (à créer, jamais commit)
├── .gitignore
├── uploads/                 # Dossier temporaire pour les fichiers uploadés
└── public/
    ├── index.html           # Structure de la page
    ├── style.css            # Styles + système de thèmes
    └── app.js               # Logique frontend (chat, historique, thèmes)
```

---

## ⚙️ Installation (Termux ou autre environnement Node.js)

### 1. Installer Node.js (si pas déjà fait sur Termux)
```bash
pkg update && pkg install nodejs -y
node -v
```

### 2. Aller dans le dossier du projet
```bash
cd dark-ia-web
```

### 3. Installer les dépendances
```bash
npm install
```

### 4. Configurer ta clé API Gemini
```bash
cp .env.example .env
```
Puis édite `.env` (par exemple avec `nano .env`) et colle ta clé :
```
GEMINI_API_KEY=ta_vraie_cle_ici
GEMINI_MODEL=gemini-2.0-flash
PORT=3000
```

Tu peux obtenir une clé gratuite sur : https://aistudio.google.com/apikey

### 5. Lancer le serveur
```bash
npm start
```

Tu verras :
```
🌑 DARK IA WEB lancé sur http://localhost:3000
   Modèle Gemini utilisé : gemini-2.0-flash
```

### 6. Ouvrir le site
Sur ton téléphone (Termux), ouvre simplement `http://localhost:3000` dans ton navigateur.

---

## 🧪 Mode développement (rechargement auto)
```bash
npm run dev
```

---

## 📦 Dépendances utilisées

| Package   | Rôle                                      |
|-----------|--------------------------------------------|
| express   | Serveur web / routes API                   |
| cors      | Autoriser les requêtes cross-origin        |
| dotenv    | Charger les variables depuis `.env`        |
| multer    | Gérer l'upload de fichiers/images          |

---

## 🔐 Sécurité

- La clé `GEMINI_API_KEY` reste **côté serveur** dans `.env` — jamais visible dans le code source du navigateur, contrairement à une version localStorage classique.
- `.env` est listé dans `.gitignore` : ne le commit jamais sur GitHub.
- Les fichiers uploadés sont supprimés du serveur juste après traitement.

---

## 🎨 Thèmes disponibles

Cliquer sur une des 4 pastilles dans la barre latérale :
- 🟣 **Violet** (défaut)
- 🔵 **Bleu**
- 🟢 **Vert**
- ⚪ **Light**

Le choix est sauvegardé automatiquement dans le navigateur (localStorage).

---

## 🚀 Déploiement

Ce projet peut être déployé sur n'importe quel hébergeur Node.js (Render, Railway, Fly.io, etc.). Pense à configurer la variable d'environnement `GEMINI_API_KEY` dans les paramètres de la plateforme plutôt que dans un fichier `.env` commité.

---

*Développé avec ❤️ par MOISETECH — Le jeune Sénégalais 🇸🇳*
