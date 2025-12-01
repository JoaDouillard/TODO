const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
    trim: true,
    maxlength: [50, 'Le nom de la catégorie ne peut pas dépasser 50 caractères']
  },
  count: {
    type: Number,
    default: 0,
    min: [0, 'Le nombre de tâches ne peut pas être négatif']
  }
}, {
  timestamps: true,
  collection: 'categories'
});

categorySchema.index({ nom: 1 }, { unique: true });
categorySchema.index({ count: -1 });

// Méthode statique pour incrémenter le compteur
categorySchema.statics.incrementCount = async function(categoryName) {
  if (!categoryName) return;

  const normalizedName = categoryName.trim().toLowerCase();

  const category = await this.findOneAndUpdate(
    { nom: normalizedName },
    { $inc: { count: 1 } },
    { upsert: true, new: true }
  );

  return category;
};

// Méthode statique pour décrémenter le compteur et supprimer si count = 0
categorySchema.statics.decrementCount = async function(categoryName) {
  if (!categoryName) return;

  const normalizedName = categoryName.trim().toLowerCase();

  const category = await this.findOne({ nom: normalizedName });

  if (!category) return;

  if (category.count <= 1) {
    // Supprimer la catégorie si count = 0
    await this.deleteOne({ nom: normalizedName });
  } else {
    // Décrémenter le compteur
    await this.findOneAndUpdate(
      { nom: normalizedName },
      { $inc: { count: -1 } }
    );
  }
};

// Méthode statique pour synchroniser les catégories avec les tâches existantes
categorySchema.statics.syncWithTasks = async function(Task) {
  // Compter toutes les tâches par catégorie
  const categoryCounts = await Task.aggregate([
    { $match: { categorie: { $exists: true, $ne: null, $ne: '' } } },
    {
      $group: {
        _id: { $toLower: { $trim: { input: '$categorie' } } },
        count: { $sum: 1 }
      }
    }
  ]);

  // Supprimer toutes les catégories existantes
  await this.deleteMany({});

  if (categoryCounts.length > 0) {
    const categories = categoryCounts.map(cat => ({
      nom: cat._id,
      count: cat.count
    }));

    await this.insertMany(categories);
  }
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
