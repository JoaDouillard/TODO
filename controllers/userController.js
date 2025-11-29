const User = require('../models/User');
const Task = require('../models/Task');
const bcrypt = require('bcryptjs');

// Récupérer tous les utilisateurs (ADMIN uniquement)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // Exclure les mots de passe
      .sort({ dateInscription: -1 });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
};

// Récupérer un utilisateur par ID (ADMIN uniquement)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur getUserById:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de l\'utilisateur'
    });
  }
};

// Créer un nouvel utilisateur (ADMIN uniquement)
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, nom, prenom, role } = req.body;

    // Vérifier si l'email ou le username existent déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.email === email
          ? 'Cet email est déjà utilisé'
          : 'Ce nom d\'utilisateur est déjà utilisé'
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      nom,
      prenom,
      role: role || 'user'
    });

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: userResponse
    });
  } catch (error) {
    console.error('Erreur createUser:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de l\'utilisateur',
      message: error.message
    });
  }
};

// Modifier un utilisateur (ADMIN uniquement)
exports.updateUser = async (req, res) => {
  try {
    const { username, email, password, nom, prenom, role } = req.body;
    const userId = req.params.id;

    // Trouver l'utilisateur
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier si l'email/username est déjà utilisé par un autre utilisateur
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: 'Cet email est déjà utilisé'
        });
      }
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          error: 'Ce nom d\'utilisateur est déjà utilisé'
        });
      }
    }

    // Mettre à jour les champs
    if (username) user.username = username;
    if (email) user.email = email;
    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (role) user.role = role;

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      data: userResponse
    });
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la modification de l\'utilisateur',
      message: error.message
    });
  }
};

// Supprimer un utilisateur (ADMIN uniquement)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Vérifier que l'utilisateur existe
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Empêcher l'admin de se supprimer lui-même
    if (userId === req.userId) {
      return res.status(400).json({
        success: false,
        error: 'Vous ne pouvez pas supprimer votre propre compte'
      });
    }

    // Récupérer les infos de l'admin qui supprime
    const admin = await User.findById(req.userId);

    // Supprimer toutes les tâches de l'utilisateur
    await Task.deleteMany({ proprietaire: userId });

    // Soft delete des commentaires de l'utilisateur
    await Task.updateMany(
      { 'commentaires.auteur': userId },
      {
        $set: {
          'commentaires.$[elem].estSupprime': true,
          'commentaires.$[elem].dateSuppression': new Date(),
          'commentaires.$[elem].suppressionPar': req.userId,
          'commentaires.$[elem].suppressionParNom': admin.username
        }
      },
      {
        arrayFilters: [{ 'elem.auteur': userId }]
      }
    );

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Utilisateur et toutes ses données supprimés avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression de l\'utilisateur',
      message: error.message
    });
  }
};
