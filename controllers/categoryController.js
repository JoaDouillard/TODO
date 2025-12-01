const Category = require('../models/Category');
const Task = require('../models/Task');

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
