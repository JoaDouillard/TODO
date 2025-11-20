const Task = require('../models/Task');

// @desc    Récupérer toutes les tâches (avec filtres et tris)
// @route   GET /api/tasks
// @access  Public
exports.getAllTasks = async (req, res) => {
  try {
    // Construction du filtre
    const filter = {};

    // Filtres simples
    if (req.query.statut) filter.statut = req.query.statut;
    if (req.query.priorite) filter.priorite = req.query.priorite;
    if (req.query.categorie) filter.categorie = req.query.categorie;

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
      // Tri par défaut : date de création décroissante
      sort.dateCreation = -1;
    }

    // Exécution de la requête
    const tasks = await Task.find(filter).sort(sort);

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

// @desc    Récupérer une tâche par ID
// @route   GET /api/tasks/:id
// @access  Public
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Erreur getTaskById:', error);

    // Erreur de format d'ID MongoDB
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
// @access  Public
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Tâche créée avec succès',
      data: task
    });

  } catch (error) {
    console.error('Erreur createTask:', error);

    // Erreur de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Erreur de validation',
        messages
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la création de la tâche',
      message: error.message
    });
  }
};

// @desc    Modifier une tâche
// @route   PUT /api/tasks/:id
// @access  Public
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true, // Retourner le document modifié
        runValidators: true // Exécuter les validations
      }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tâche mise à jour avec succès',
      data: task
    });

  } catch (error) {
    console.error('Erreur updateTask:', error);

    // Erreur de validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Erreur de validation',
        messages
      });
    }

    // Erreur de format d'ID
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

// @desc    Supprimer une tâche
// @route   DELETE /api/tasks/:id
// @access  Public
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tâche supprimée avec succès',
      data: {}
    });

  } catch (error) {
    console.error('Erreur deleteTask:', error);

    // Erreur de format d'ID
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

// @desc    Ajouter une sous-tâche
// @route   POST /api/tasks/:id/subtasks
// @access  Public
exports.addSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    task.sousTaches.push(req.body);
    await task.save();

    res.status(201).json({
      success: true,
      message: 'Sous-tâche ajoutée avec succès',
      data: task
    });

  } catch (error) {
    console.error('Erreur addSubtask:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'ajout de la sous-tâche',
      message: error.message
    });
  }
};

// @desc    Ajouter un commentaire
// @route   POST /api/tasks/:id/comments
// @access  Public
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Tâche non trouvée'
      });
    }

    task.commentaires.push({
      ...req.body,
      date: new Date()
    });
    await task.save();

    res.status(201).json({
      success: true,
      message: 'Commentaire ajouté avec succès',
      data: task
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
