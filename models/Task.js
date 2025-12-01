const mongoose = require('mongoose');

const sousTacheSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre de la sous-tâche est requis']
  },
  statut: {
    type: String,
    enum: ['à faire', 'en cours', 'terminée', 'annulée'],
    default: 'à faire'
  },
  echeance: {
    type: Date
  }
}, { _id: true });

const commentaireSchema = new mongoose.Schema({
  auteur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'auteur est requis']
  },
  auteurNom: {
    type: String,
    required: [true, 'Le nom de l\'auteur est requis']
  },
  contenu: {
    type: String,
    required: [true, 'Le contenu du commentaire est requis'],
    maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date
  },
  estModifie: {
    type: Boolean,
    default: false
  },
  estSupprime: {
    type: Boolean,
    default: false
  },
  dateSuppression: {
    type: Date
  },
  suppressionPar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  suppressionParNom: {
    type: String
  },
  // Système de votes
  votesPositifs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  votesNegatifs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { _id: true });

const historiqueSchema = new mongoose.Schema({
  champModifie: {
    type: String,
    required: true
  },
  ancienneValeur: {
    type: mongoose.Schema.Types.Mixed
  },
  nouvelleValeur: {
    type: mongoose.Schema.Types.Mixed
  },
  modifiePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  modifieParNom: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const taskSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Le titre est requis'],
    trim: true,
    maxlength: [200, 'Le titre ne peut pas dépasser 200 caractères']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'La description ne peut pas dépasser 2000 caractères']
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  echeance: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true;
        return true; // On accepte toutes les dates pour permettre la modification
      },
      message: 'La date d\'échéance doit être valide'
    }
  },
  statut: {
    type: String,
    enum: {
      values: ['à faire', 'en cours', 'terminée', 'annulée'],
      message: '{VALUE} n\'est pas un statut valide'
    },
    required: [true, 'Le statut est requis'],
    default: 'à faire'
  },
  priorite: {
    type: String,
    enum: {
      values: ['basse', 'moyenne', 'haute', 'critique'],
      message: '{VALUE} n\'est pas une priorité valide'
    },
    required: [true, 'La priorité est requise'],
    default: 'moyenne'
  },
  proprietaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Le propriétaire est requis']
  },
  visibilite: {
    type: String,
    enum: {
      values: ['privée', 'publique'],
      message: '{VALUE} n\'est pas une visibilité valide'
    },
    default: 'privée'
  },
  auteur: {
    nom: {
      type: String,
      required: [true, 'Le nom de l\'auteur est requis'],
      trim: true
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom de l\'auteur est requis'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'L\'email de l\'auteur est requis'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'L\'email de l\'auteur est invalide']
    }
  },
  categorie: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [15, 'La catégorie ne peut pas dépasser 15 caractères']
  },
  etiquettes: {
    type: [String],
    validate: {
      validator: function(array) {
        return array.length <= 20;
      },
      message: 'Vous ne pouvez pas avoir plus de 20 étiquettes'
    }
  },
  sousTaches: [sousTacheSchema],
  commentaires: [commentaireSchema],
  historiqueModifications: [historiqueSchema]
}, {
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  collection: 'tasks'
});

taskSchema.index({ statut: 1 });
taskSchema.index({ priorite: 1 });
taskSchema.index({ categorie: 1 });
taskSchema.index({ echeance: 1 });
taskSchema.index({ dateCreation: -1 });
taskSchema.index({ 'auteur.email': 1 });
taskSchema.index({ proprietaire: 1 });
taskSchema.index({ visibilite: 1 });
taskSchema.index({ proprietaire: 1, visibilite: 1 }); // Index composé pour requêtes fréquentes

taskSchema.index({ titre: 'text', description: 'text' });

taskSchema.virtual('sousTachesTerminees').get(function() {
  if (!this.sousTaches || this.sousTaches.length === 0) return 0;
  return this.sousTaches.filter(st => st.statut === 'terminée').length;
});

taskSchema.virtual('progression').get(function() {
  if (!this.sousTaches || this.sousTaches.length === 0) return 0;
  return Math.round((this.sousTachesTerminees / this.sousTaches.length) * 100);
});

taskSchema.virtual('enRetard').get(function() {
  if (!this.echeance || this.statut === 'terminée' || this.statut === 'annulée') {
    return false;
  }
  return new Date() > this.echeance;
});

// Méthode d'instance pour ajouter une entrée à l'historique
taskSchema.methods.ajouterHistorique = function(champModifie, ancienneValeur, nouvelleValeur, modifieParId, modifieParNom) {
  if (!this.historiqueModifications) {
    this.historiqueModifications = [];
  }

  this.historiqueModifications.push({
    champModifie,
    ancienneValeur,
    nouvelleValeur,
    modifiePar: modifieParId,
    modifieParNom,
    date: new Date()
  });
};

// Méthode d'instance pour ajouter un commentaire
taskSchema.methods.ajouterCommentaire = function(auteurId, auteurNom, contenu) {
  this.commentaires.push({
    auteur: auteurId,
    auteurNom,
    contenu,
    dateCreation: new Date(),
    estModifie: false,
    estSupprime: false
  });
  return this.save();
};

// Méthode d'instance pour ajouter une sous-tâche
taskSchema.methods.ajouterSousTache = function(titre, echeance) {
  this.sousTaches.push({
    titre,
    statut: 'à faire',
    echeance
  });
  return this.save();
};

taskSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    // Supprimer __v et autres champs inutiles
    delete ret.__v;
    return ret;
  }
});

taskSchema.set('toObject', { virtuals: true });

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
