# Gestionnaire de Tâches - API REST avec MongoDB

> Application complète de gestion de tâches développée avec Node.js, Express, MongoDB et Mongoose.

---

## 🏗️ Architecture

```
project-root/
├── server.js                 # Point d'entrée du serveur Express
├── package.json              # Dépendances npm
├── .env                      # Variables d'environnement
├── .env.example              # Exemple de configuration
├── seed.js                   # Script de peuplement de la base de test
├── config/
│   └── database.js           # Configuration MongoDB
├── models/
│   └── Task.js               # Schéma Mongoose des tâches
├── routes/
│   └── tasks.js              # Routes API REST
├── controllers/
│   └── taskController.js     # Logique métier
├── public/                   # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── css/
│   └── js/
└── Ressources/               # Documentation du projet
    └── Cahier_des_charges.md
```

---

## 🚀 Installation et Démarrage

### Prérequis

- **Node.js** (v18 ou supérieur) : [nodejs.org](https://nodejs.org/)
- **MongoDB** (v7.0 ou supérieur) :
  - Soit **installé localement** ([guide installation](https://www.mongodb.com/docs/manual/installation/))
  - Soit **MongoDB Atlas** (cloud gratuit) : [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas)

### Installation pour Linux/WSL

Si vous utilisez WSL ou Linux et que MongoDB n'est pas installé :

```bash
# 1. Importer la clé GPG MongoDB
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# 2. Ajouter le repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# 3. Installer MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# 4. Démarrer MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod  # Démarrage automatique au boot

# 5. Vérifier le statut
sudo systemctl status mongod
```

### Installation du Projet

```bash
# 1. Cloner le repository
git clone <url-du-repo>
cd TODO

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env si nécessaire (par défaut : mongodb://localhost:27017/gestionnaire-taches)

# 4. Peupler la base de données avec des données de test
node seed.js

# 5. Démarrer le serveur
npm start
```

Le serveur démarre sur **http://localhost:3000**

---

## 🗄️ Base de Données de Test

Le script `seed.js` crée automatiquement **10 tâches d'exemple** avec :
- 4 tâches "à faire"
- 4 tâches "en cours"
- 1 tâche "terminée"
- 1 tâche "annulée"

Ces tâches incluent des **sous-tâches**, des **commentaires** et différentes **priorités** pour tester toutes les fonctionnalités.

**Relancer le seed** (supprime et recrée les données) :
```bash
node seed.js
```

---

## 🔌 API REST - Documentation

### Endpoints Disponibles

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/api` | Informations sur l'API |
| `GET` | `/api/tasks` | Récupérer toutes les tâches (avec filtres) |
| `GET` | `/api/tasks/:id` | Récupérer une tâche par ID |
| `POST` | `/api/tasks` | Créer une nouvelle tâche |
| `PUT` | `/api/tasks/:id` | Modifier une tâche |
| `DELETE` | `/api/tasks/:id` | Supprimer une tâche |
| `POST` | `/api/tasks/:id/subtasks` | Ajouter une sous-tâche |
| `POST` | `/api/tasks/:id/comments` | Ajouter un commentaire |

### Exemples d'Utilisation

#### 1. Récupérer toutes les tâches
```bash
GET http://localhost:3000/api/tasks
```

**Réponse :**
```json
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

#### 2. Créer une nouvelle tâche
```bash
POST http://localhost:3000/api/tasks
Content-Type: application/json

{
  "titre": "Ma nouvelle tâche",
  "description": "Description détaillée",
  "statut": "à faire",
  "priorite": "haute",
  "auteur": {
    "nom": "Dupont",
    "prenom": "Jean",
    "email": "jean.dupont@example.com"
  },
  "categorie": "travail",
  "etiquettes": ["urgent", "projet"]
}
```

#### 3. Filtrer les tâches
```bash
# Tâches en cours avec priorité haute
GET http://localhost:3000/api/tasks?statut=en cours&priorite=haute

# Tâches de catégorie "travail" avant le 31 mars
GET http://localhost:3000/api/tasks?categorie=travail&avant=2025-03-31

# Recherche textuelle
GET http://localhost:3000/api/tasks?q=rapport

# Tri par échéance croissante
GET http://localhost:3000/api/tasks?tri=echeance&ordre=asc
```

#### 4. Modifier une tâche
```bash
PUT http://localhost:3000/api/tasks/<id>
Content-Type: application/json

{
  "statut": "terminée"
}
```

#### 5. Ajouter un commentaire
```bash
POST http://localhost:3000/api/tasks/<id>/comments
Content-Type: application/json

{
  "auteur": {
    "nom": "Martin",
    "prenom": "Paul",
    "email": "paul.martin@example.com"
  },
  "contenu": "Excellent travail !"
}
```

Pour plus de détails, consultez le [Cahier des Charges](./Ressources/Cahier_des_charges.md).

---

## 🎨 Interface Web

L'interface web est accessible à l'adresse **http://localhost:3000** après démarrage du serveur.

**Fonctionnalités :**
- Affichage de toutes les tâches
- Filtres par statut, priorité, catégorie
- Création/modification/suppression de tâches
- Visualisation des détails (sous-tâches, commentaires)

---

## 🛠️ Scripts NPM

| Commande | Description |
|----------|-------------|
| `npm start` | Démarre le serveur en mode production |
| `npm run dev` | Démarre le serveur avec nodemon (rechargement auto) |
| `node seed.js` | Peuple la base de données avec des données de test |

---

## 📝 Variables d'Environnement

Fichier `.env` :

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/gestionnaire-taches

# Server Configuration
PORT=3000
NODE_ENV=development
```

**Pour MongoDB Atlas** (optionnel, cloud) :
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/gestionnaire-taches
```

---

## 🐛 Résolution de Problèmes

### MongoDB ne démarre pas (Linux/WSL)
```bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

### Erreur "Cannot connect to MongoDB"
- Vérifiez que MongoDB est bien démarré : `sudo systemctl status mongod`
- Vérifiez l'URI dans `.env` : `mongodb://localhost:27017/gestionnaire-taches`
- Testez la connexion : `mongosh "mongodb://localhost:27017"`

### Port 3000 déjà utilisé
```bash
# Trouver le processus
lsof -i :3000

# Ou changer le port dans .env
PORT=3001
```