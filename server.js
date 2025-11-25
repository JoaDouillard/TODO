const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/database');

// Charger les variables d'environnement
dotenv.config();

// Connexion à MongoDB
connectDB();

// Initialiser Express
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (frontend)
app.use(express.static('public'));

// Route de test
app.get('/api', (req, res) => {
  res.json({
    message: 'Bienvenue sur l\'API Gestionnaire de Tâches',
    version: '1.0.0',
    endpoints: {
      tasks: '/api/tasks',
      documentation: 'Consultez le README.md'
    }
  });
});

// Routes API
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/categories', require('./routes/categories'));

// SPA: Toutes les autres routes renvoient index.html (pour le routing côté client)
app.use((req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
