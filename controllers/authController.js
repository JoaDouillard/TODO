const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

// Inscription
exports.register = async (req, res) => {
  try {
    const { nom, prenom, username, email, password } = req.body;

    // Validation des champs
    if (!nom || !prenom || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Tous les champs sont obligatoires (nom, prénom, username, email, password)'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          error: 'Cet email est déjà utilisé'
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          error: 'Ce nom d\'utilisateur est déjà pris'
        });
      }
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const user = new User({
      nom,
      prenom,
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.'
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);

    // Gérer les erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'inscription'
    });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Validation des champs
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/username et mot de passe requis'
      });
    }

    // Chercher l'utilisateur par email ou username
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase() },
        { username: emailOrUsername }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants incorrects'
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Connexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion'
    });
  }
};

// Récupérer le profil de l'utilisateur connecté
exports.getMe = async (req, res) => {
  try {
    // req.user est ajouté par le middleware authenticate
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du profil'
    });
  }
};

// Déconnexion (côté serveur, optionnel car JWT est stateless)
exports.logout = async (req, res) => {
  try {
    // Avec JWT, la déconnexion se fait principalement côté client
    // en supprimant le token du localStorage
    // On peut ajouter ici une logique de blacklist de tokens si nécessaire

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la déconnexion'
    });
  }
};
