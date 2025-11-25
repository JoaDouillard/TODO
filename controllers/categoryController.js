const Category = require('../models/Category');
const Task = require('../models/Task');

// @desc    Récupérer toutes les catégories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ count: -1 });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });

  } catch (error) {
    console.error('Erreur getAllCategories:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des catégories',
      message: error.message
    });
  }
};

// @desc    Synchroniser les catégories avec les tâches
// @route   POST /api/categories/sync
// @access  Public
exports.syncCategories = async (req, res) => {
  try {
    await Category.syncWithTasks(Task);

    const categories = await Category.find().sort({ count: -1 });

    res.status(200).json({
      success: true,
      message: 'Catégories synchronisées avec succès',
      count: categories.length,
      data: categories
    });

  } catch (error) {
    console.error('Erreur syncCategories:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la synchronisation des catégories',
      message: error.message
    });
  }
};
