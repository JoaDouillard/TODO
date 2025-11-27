const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Secret pour JWT (à mettre dans .env en production)
const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_super_securise_a_changer';

// Middleware pour vérifier le token JWT
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentification requise. Veuillez vous connecter.'
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non trouvé. Token invalide.'
      });
    }

    // Ajouter l'utilisateur à la requête pour les prochains middleware/controllers
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token invalide.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expiré. Veuillez vous reconnecter.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de la vérification de l\'authentification.'
    });
  }
};

// Middleware pour vérifier que l'utilisateur est admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentification requise.'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès refusé. Droits administrateur requis.'
    });
  }

  next();
};

// Middleware optionnel : authentifie si token présent, sinon continue
const optionalAuthenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }

    next();
  } catch (error) {
    // En mode optionnel, on continue même si le token est invalide
    next();
  }
};

module.exports = {
  authenticate,
  isAdmin,
  optionalAuthenticate,
  JWT_SECRET
};
