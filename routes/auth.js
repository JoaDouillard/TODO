const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/register - Inscription
router.post('/register', authController.register);

// POST /api/auth/login - Connexion
router.post('/login', authController.login);

// GET /api/auth/me - Récupérer le profil de l'utilisateur connecté
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/logout - Déconnexion
router.post('/logout', authenticate, authController.logout);

module.exports = router;
