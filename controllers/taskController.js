const Task = require('../models/Task');
const Category = require('../models/Category');

exports.getAllTasks = async (req, res) => {
  try {
    const filter = { proprietaire: req.userId };
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

exports.createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      proprietaire: req.userId,
    };

    const task = new Task(taskData);
    await task.save();

    if (task.categorie) {
      await Category.incrementCount(task.categorie);
    }

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

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('proprietaire', 'username');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (task.proprietaire._id.toString() !== req.userId.toString()) {
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

    // Enregistrer l'historique pour chaque champ modifié
    const champsATracker = ['titre', 'description', 'statut', 'priorite', 'echeance', 'visibilite', 'categorie'];
    const username = task.proprietaire.username;

    champsATracker.forEach(champ => {
      if (req.body.hasOwnProperty(champ) && req.body[champ] !== task[champ]) {
        const ancienneValeur = task[champ];
        const nouvelleValeur = req.body[champ];

        task.ajouterHistorique(champ, ancienneValeur, nouvelleValeur, req.userId, username);
      }
    });

    // Tracker les changements d'étiquettes
    if (req.body.hasOwnProperty('etiquettes')) {
      const oldTags = task.etiquettes || [];
      const newTags = req.body.etiquettes || [];

      const oldTagsStr = JSON.stringify(oldTags.sort());
      const newTagsStr = JSON.stringify(newTags.sort());

      if (oldTagsStr !== newTagsStr) {
        task.ajouterHistorique('etiquettes', oldTags, newTags, req.userId, username);
      }
    }

    // Tracker les changements de sous-tâches
    if (req.body.hasOwnProperty('sousTaches')) {
      const oldSubtasks = task.sousTaches || [];
      const newSubtasks = req.body.sousTaches || [];

      // Détecter les ajouts
      newSubtasks.forEach(newSub => {
        const existingSubtask = oldSubtasks.find(oldSub =>
          oldSub._id && newSub._id && oldSub._id.toString() === newSub._id.toString()
        );

        if (!existingSubtask && newSub.titre) {
          const echeanceInfo = newSub.echeance ? ` (Échéance: ${new Date(newSub.echeance).toLocaleDateString('fr-FR')})` : '';
          task.ajouterHistorique('sousTaches', null, `Ajout: ${newSub.titre}${echeanceInfo}`, req.userId, username);
        } else if (existingSubtask) {
          const modifications = [];

          // Vérifier les modifications du titre
          if (existingSubtask.titre !== newSub.titre) {
            modifications.push({
              type: 'titre',
              old: existingSubtask.titre,
              new: newSub.titre
            });
          }

          // Vérifier les modifications du statut
          if (existingSubtask.statut !== newSub.statut) {
            modifications.push({
              type: 'statut',
              old: existingSubtask.statut,
              new: newSub.statut
            });
          }

          // Vérifier les modifications de l'échéance
          const oldEcheance = existingSubtask.echeance ? new Date(existingSubtask.echeance).toISOString().split('T')[0] : null;
          const newEcheance = newSub.echeance ? new Date(newSub.echeance).toISOString().split('T')[0] : null;

          if (oldEcheance !== newEcheance) {
            modifications.push({
              type: 'echeance',
              old: oldEcheance,
              new: newEcheance
            });
          }

          // Enregistrer TOUTES les modifications dans un seul bloc
          if (modifications.length > 0) {
            const titre = newSub.titre || existingSubtask.titre;
            const oldParts = [];
            const newParts = [];

            modifications.forEach(mod => {
              if (mod.type === 'titre') {
                oldParts.push(`<span class="font-semibold">Titre:</span> ${mod.old}`);
                newParts.push(`<span class="font-semibold">Titre:</span> ${mod.new}`);
              } else if (mod.type === 'statut') {
                oldParts.push(`<span class="font-semibold">Statut:</span> ${mod.old}`);
                newParts.push(`<span class="font-semibold">Statut:</span> ${mod.new}`);
              } else if (mod.type === 'echeance') {
                const oldDate = mod.old ? new Date(mod.old).toLocaleDateString('fr-FR') : 'Aucune';
                const newDate = mod.new ? new Date(mod.new).toLocaleDateString('fr-FR') : 'Aucune';
                oldParts.push(`<span class="font-semibold">Échéance:</span> ${oldDate}`);
                newParts.push(`<span class="font-semibold">Échéance:</span> ${newDate}`);
              }
            });

            const oldValue = `<div class="font-medium mb-2">${titre}</div>${oldParts.join('<br>')}`;
            const newValue = `<div class="font-medium mb-2">${titre}</div>${newParts.join('<br>')}`;

            task.ajouterHistorique('sousTaches', oldValue, newValue, req.userId, username);
          }
        }
      });

      // Détecter les suppressions
      oldSubtasks.forEach(oldSub => {
        const stillExists = newSubtasks.find(newSub =>
          oldSub._id && newSub._id && oldSub._id.toString() === newSub._id.toString()
        );

        if (!stillExists && oldSub.titre) {
          task.ajouterHistorique('sousTaches', `Suppression: ${oldSub.titre}`, null, req.userId, username);
        }
      });
    }

    // Mettre à jour les champs
    Object.keys(req.body).forEach(key => {
      if (key !== 'historiqueModifications') {
        task[key] = req.body[key];
      }
    });

    await task.save();
    await task.populate('proprietaire', 'username email');

    res.status(200).json({
      success: true,
      data: task,
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

// GESTION DES COMMENTAIRES

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
    const isOwner = task.proprietaire.toString() === req.userId.toString();
    const isPublic = task.visibilite === 'publique';

    if (!isOwner && !isPublic) {
      return res.status(403).json({
        success: false,
        error: 'Vous ne pouvez commenter que vos propres tâches ou des tâches publiques'
      });
    }


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

    comment.votesPositifs = comment.votesPositifs.filter(
      userId => userId.toString() !== req.userId.toString()
    );
    comment.votesNegatifs = comment.votesNegatifs.filter(
      userId => userId.toString() !== req.userId.toString()
    );

    if (type === 'up' && !hasVotedUp) {
      comment.votesPositifs.push(req.userId);
    } else if (type === 'down' && !hasVotedDown) {
      comment.votesNegatifs.push(req.userId);
    }

    await task.save();

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
