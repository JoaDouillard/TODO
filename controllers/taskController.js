const Task = require('../models/Task');
const Category = require('../models/Category');

// @desc    Récupérer toutes les tâches de l'utilisateur connecté
// @route   GET /api/tasks
// @access  Private
exports.getAllTasks = async (req, res) => {
  try {
    // Filtre par propriétaire (utilisateur connecté)
    const filter = { proprietaire: req.userId };

    // Filtres additionnels
    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.priorite) filter.priorite = req.query.priorite;
    if (req.query.categorie) filter.categorie = req.query.categorie;
    if (req.query.visibilite) filter.visibilite = req.query.visibilite;

    // Filtre par étiquette
    if (req.query.etiquette) {
      filter.etiquettes = { $in: [req.query.etiquette] };
    }

    // Filtres de date
    if (req.query.avant || req.query.apres) {
      filter.echeance = {};
      if (req.query.avant) {
        filter.echeance.$lte = new Date(req.query.avant);
      }
      if (req.query.apres) {
        filter.echeance.$gte = new Date(req.query.apres);
      }
    }

    // Recherche textuelle
    if (req.query.q) {
      filter.$or = [
        { titre: { $regex: req.query.q, $options: 'i' } },
        { description: { $regex: req.query.q, $options: 'i' } }
      ];
    }

    // Construction du tri
    let sort = {};
    if (req.query.tri) {
      const ordre = req.query.ordre === 'desc' ? -1 : 1;
      sort[req.query.tri] = ordre;
    } else {
      sort.dateCreation = -1;
    }

    // Exécution de la requête
    const tasks = await Task.find(filter).sort(sort).populate('proprietaire', 'username email');

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (error) {
    console.error('Erreur getAllTasks:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des tâches',
      message: error.message
    });
  }
};

// @desc    Récupérer toutes les tâches publiques
// @route   GET /api/tasks/public
// @access  Public (pas besoin de token)
exports.getPublicTasks = async (req, res) => {
  try {
    // Filtre : seulement les tâches publiques
    const filter = { visibilite: 'publique' };

    // Filtres additionnels
    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.priorite) filter.priorite = req.query.priorite;
    if (req.query.categorie) filter.categorie = req.query.categorie;

    // Recherche textuelle
    if (req.query.q) {
      filter.$or = [
        { titre: { $regex: req.query.q, $options: 'i' } },
        { description: { $regex: req.query.q, $options: 'i' } }
      ];
    }

    // Tri
    let sort = { dateCreation: -1 };
    if (req.query.tri) {
      const ordre = req.query.ordre === 'desc' ? -1 : 1;
      sort = { [req.query.tri]: ordre };
    }

    // Limite pour les visiteurs non connectés (3-4 tâches)
    let limit = null;
    if (!req.userId) {
      limit = 4; // Visiteurs voient max 4 tâches
    }

    // Exécution de la requête
    let query = Task.find(filter).sort(sort).populate('proprietaire', 'username email');

    if (limit) {
      query = query.limit(limit);
    }

    const tasks = await query;

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
      isLimited: !req.userId // Indique si la liste est limitée (visiteur)
    });

  } catch (error) {
    console.error('Erreur getPublicTasks:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des tâches publiques',
      message: error.message
    });
  }
};

// @desc    Récupérer une tâche par ID
// @route   GET /api/tasks/:id
// @access  Public (mais limité selon visibilité)
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('proprietaire', 'username email');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    // Vérifier les permissions de lecture
    // Publique : tout le monde peut voir
    // Privée : seulement le propriétaire
    if (task.visibilite === 'privée') {
      if (!req.userId || task.proprietaire._id.toString() !== req.userId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Accès refusé. Cette tâche est privée.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Erreur getTaskById:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée (ID invalide)'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération de la tâche',
      message: error.message
    });
  }
};

// @desc    Créer une nouvelle tâche
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    // Ajouter automatiquement le propriétaire (depuis le token)
    const taskData = {
      ...req.body,
      proprietaire: req.userId,
      // Garder visibilite si fourni, sinon défaut 'privée' du modèle
    };

    // Créer la tâche
    const task = new Task(taskData);
    await task.save();

    // Gérer la catégorie
    if (task.categorie) {
      await Category.incrementCount(task.categorie);
    }

    // Populate le propriétaire avant de renvoyer
    await task.populate('proprietaire', 'username email');

    res.status(201).json({
      success: true,
      data: task,
      message: 'Tâche créée avec succès'
    });

  } catch (error) {
    console.error('Erreur createTask:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de la tâche',
      message: error.message
    });
  }
};

// @desc    Mettre à jour une tâche
// @route   PUT /api/tasks/:id
// @access  Private (propriétaire uniquement)
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (task.proprietaire.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette tâche.'
      });
    }

    // Gérer le changement de catégorie
    const oldCategory = task.categorie;
    const newCategory = req.body.categorie;

    if (oldCategory !== newCategory) {
      if (oldCategory) {
        await Category.decrementCount(oldCategory);
      }
      if (newCategory) {
        await Category.incrementCount(newCategory);
      }
    }

    // Empêcher la modification du propriétaire
    delete req.body.proprietaire;

    // Mettre à jour la tâche
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('proprietaire', 'username email');

    res.status(200).json({
      success: true,
      data: updatedTask,
      message: 'Tâche mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur updateTask:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(', ')
      });
    }

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée (ID invalide)'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la mise à jour de la tâche',
      message: error.message
    });
  }
};

// @desc    Changer la visibilité d'une tâche
// @route   PATCH /api/tasks/:id/visibility
// @access  Private (propriétaire uniquement)
exports.toggleVisibility = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (task.proprietaire.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette tâche.'
      });
    }

    // Toggle visibilité
    task.visibilite = task.visibilite === 'privée' ? 'publique' : 'privée';
    await task.save();

    await task.populate('proprietaire', 'username email');

    res.status(200).json({
      success: true,
      data: task,
      message: `Tâche désormais ${task.visibilite}`
    });

  } catch (error) {
    console.error('Erreur toggleVisibility:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du changement de visibilité',
      message: error.message
    });
  }
};

// @desc    Supprimer une tâche
// @route   DELETE /api/tasks/:id
// @access  Private (propriétaire uniquement)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (task.proprietaire.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette tâche.'
      });
    }

    // Décrémenter le compteur de catégorie
    if (task.categorie) {
      await Category.decrementCount(task.categorie);
    }

    // Supprimer la tâche
    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Tâche supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur deleteTask:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée (ID invalide)'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression de la tâche',
      message: error.message
    });
  }
};

// ========================================
// GESTION DES COMMENTAIRES
// ========================================

// @desc    Ajouter un commentaire à une tâche
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { contenu } = req.body;

    // Validation
    if (!contenu || contenu.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le contenu du commentaire est requis'
      });
    }

    // Récupérer la tâche
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    // Vérifier les permissions : propriétaire OU tâche publique
    // Tout utilisateur connecté peut commenter ses propres tâches ET les tâches publiques
    const isOwner = task.proprietaire.toString() === req.userId;
    const isPublic = task.visibilite === 'publique';

    // On autorise si c'est soit le propriétaire, soit une tâche publique
    if (!isOwner && !isPublic) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez commenter que vos propres tâches ou des tâches publiques'
      });
    }

    // Si on arrive ici, l'utilisateur a le droit de commenter

    // Récupérer les infos de l'utilisateur
    const User = require('../models/User');
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Ajouter le commentaire
    const newComment = {
      auteur: req.userId,
      auteurNom: user.username,
      contenu: contenu.trim(),
      dateCreation: new Date(),
      estModifie: false,
      estSupprime: false
    };

    task.commentaires.push(newComment);
    await task.save();

    // Retourner le commentaire ajouté
    const addedComment = task.commentaires[task.commentaires.length - 1];

    res.status(201).json({
      success: true,
      message: 'Commentaire ajouté avec succès',
      data: addedComment
    });

  } catch (error) {
    console.error('Erreur addComment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'ajout du commentaire',
      message: error.message
    });
  }
};

// @desc    Modifier un commentaire
// @route   PUT /api/tasks/:id/comments/:commentId
// @access  Private (auteur du commentaire uniquement)
exports.updateComment = async (req, res) => {
  try {
    const { contenu } = req.body;
    const { id, commentId } = req.params;

    // Validation
    if (!contenu || contenu.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Le contenu du commentaire est requis'
      });
    }

    // Récupérer la tâche
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    // Trouver le commentaire
    const comment = task.commentaires.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire non trouvé'
      });
    }

    // Vérifier que l'utilisateur est l'auteur du commentaire
    if (comment.auteur.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez modifier que vos propres commentaires'
      });
    }

    // Vérifier que le commentaire n'est pas supprimé
    if (comment.estSupprime) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de modifier un commentaire supprimé'
      });
    }

    // Mettre à jour le commentaire
    comment.contenu = contenu.trim();
    comment.dateModification = new Date();
    comment.estModifie = true;

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Commentaire modifié avec succès',
      data: comment
    });

  } catch (error) {
    console.error('Erreur updateComment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la modification du commentaire',
      message: error.message
    });
  }
};

// @desc    Supprimer un commentaire (soft delete)
// @route   DELETE /api/tasks/:id/comments/:commentId
// @access  Private (auteur du commentaire ou admin)
exports.deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    // Récupérer la tâche
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    // Trouver le commentaire
    const comment = task.commentaires.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire non trouvé'
      });
    }

    // Vérifier les permissions
    const User = require('../models/User');
    const user = await User.findById(req.userId);

    const isAuthor = comment.auteur.toString() === req.userId.toString();
    const isAdmin = user && user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez supprimer que vos propres commentaires'
      });
    }

    // Soft delete
    comment.estSupprime = true;
    comment.dateSuppression = new Date();
    comment.suppressionPar = req.userId;
    comment.suppressionParNom = user.username; // Stocker le nom de l'utilisateur qui a supprimé

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Commentaire supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur deleteComment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la suppression du commentaire',
      message: error.message
    });
  }
};

// @desc    Voter sur un commentaire (pouce bleu ou rouge)
// @route   POST /api/tasks/:id/comments/:commentId/vote
// @access  Private
exports.voteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { type } = req.body; // 'up' ou 'down'

    if (!type || (type !== 'up' && type !== 'down')) {
      return res.status(400).json({
        success: false,
        error: 'Type de vote invalide (up ou down)'
      });
    }

    // Récupérer la tâche
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    // Trouver le commentaire
    const comment = task.commentaires.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Commentaire non trouvé'
      });
    }

    // Vérifier que le commentaire n'est pas supprimé
    if (comment.estSupprime) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de voter sur un commentaire supprimé'
      });
    }

    // Initialiser les tableaux de votes s'ils n'existent pas
    if (!comment.votesPositifs) comment.votesPositifs = [];
    if (!comment.votesNegatifs) comment.votesNegatifs = [];

    // Vérifier si l'utilisateur a déjà voté pour ce type
    const hasVotedUp = comment.votesPositifs.some(userId => userId.toString() === req.userId.toString());
    const hasVotedDown = comment.votesNegatifs.some(userId => userId.toString() === req.userId.toString());

    // Retirer l'utilisateur des deux listes
    comment.votesPositifs = comment.votesPositifs.filter(
      userId => userId.toString() !== req.userId.toString()
    );
    comment.votesNegatifs = comment.votesNegatifs.filter(
      userId => userId.toString() !== req.userId.toString()
    );

    // Ajouter le vote UNIQUEMENT si l'utilisateur n'avait pas déjà voté pour ce même type
    // Si l'utilisateur clique sur le même vote qu'il avait déjà donné, on l'annule (on ne l'ajoute pas)
    if (type === 'up' && !hasVotedUp) {
      comment.votesPositifs.push(req.userId);
    } else if (type === 'down' && !hasVotedDown) {
      comment.votesNegatifs.push(req.userId);
    }

    await task.save();

    // Calculer le score
    const score = comment.votesPositifs.length - comment.votesNegatifs.length;

    res.status(200).json({
      success: true,
      message: 'Vote enregistré avec succès',
      data: {
        votesPositifs: comment.votesPositifs.length,
        votesNegatifs: comment.votesNegatifs.length,
        score
      }
    });

  } catch (error) {
    console.error('Erreur voteComment:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors du vote',
      message: error.message
    });
  }
};
