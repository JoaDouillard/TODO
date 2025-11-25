const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('./models/Category');
const Task = require('./models/Task');

// Charger les variables d'environnement
dotenv.config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB: Connexion établie');
  } catch (error) {
    console.error('MongoDB: Erreur de connexion -', error.message);
    process.exit(1);
  }
};

// Synchroniser les catégories
const syncCategories = async () => {
  try {
    await connectDB();

    console.log('\n🔄 Synchronisation des catégories...');

    await Category.syncWithTasks(Task);

    const categories = await Category.find().sort({ count: -1 });

    console.log(`\n✅ Synchronisation terminée!`);
    console.log(`📊 ${categories.length} catégories trouvées:\n`);

    categories.forEach(cat => {
      console.log(`   📁 ${cat.nom} (${cat.count} tâche${cat.count > 1 ? 's' : ''})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

syncCategories();
