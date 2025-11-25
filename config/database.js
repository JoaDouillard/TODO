const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB: Connexion établie');
  } catch (error) {
    console.error(`MongoDB: Erreur de connexion - ${error.message}`);
    console.log('Application démarrée sans base de données (les routes API ne fonctionneront pas)');
  }
};

module.exports = connectDB;
