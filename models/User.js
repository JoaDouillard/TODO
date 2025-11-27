const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est obligatoire'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
    maxlength: [30, 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères']
  },

  nom: {
    type: String,
    required: [true, 'Le nom est obligatoire'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },

  prenom: {
    type: String,
    required: [true, 'Le prénom est obligatoire'],
    trim: true,
    minlength: [2, 'Le prénom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères']
  },

  email: {
    type: String,
    required: [true, 'L\'email est obligatoire'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide']
  },

  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },

  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },

  dateInscription: {
    type: Date,
    default: Date.now
  },

  avatar: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Les index sont déjà créés automatiquement par "unique: true" sur email et username

module.exports = mongoose.model('User', userSchema);
