const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Erreur de connexion MongoDB: ${error.message}`);
    console.log('\n💡 Solutions possibles:');
    console.log('1. Utilisez MongoDB Atlas (gratuit): https://www.mongodb.com/cloud/atlas');
    console.log('2. Ou installez MongoDB localement: https://www.mongodb.com/try/download/community');
    console.log('3. Mettez à jour MONGODB_URI dans le fichier .env\n');

    // Ne pas quitter l'application pour permettre le développement du frontend
    console.log('⚠️  L\'application continue sans base de données (mode développement)');
    console.log('    Les routes API ne fonctionneront pas tant que MongoDB n\'est pas configuré.\n');
  }
};

module.exports = connectDB;
