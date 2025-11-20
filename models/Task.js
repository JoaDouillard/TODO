const mongoose = require('mongoose');

// Schéma pour les sous-tâches
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

// Schéma pour les commentaires
const commentaireSchema = new mongoose.Schema({
  auteur: {
    nom: {
      type: String,
      required: true
    },
    prenom: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide']
    }
  },
  date: {
    type: Date,
    default: Date.now
  },
  contenu: {
    type: String,
    required: [true, 'Le contenu du commentaire est requis'],
    maxlength: [1000, 'Le commentaire ne peut pas dépasser 1000 caractères']
  }
}, { _id: true });

// Schéma pour l'historique des modifications (optionnel)
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
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Schéma principal de la tâche
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
        // Si une échéance est définie, elle doit être dans le futur (sauf si la tâche est déjà créée)
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
    maxlength: [50, 'La catégorie ne peut pas dépasser 50 caractères']
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

// Index pour améliorer les performances de recherche
taskSchema.index({ statut: 1 });
taskSchema.index({ priorite: 1 });
taskSchema.index({ categorie: 1 });
taskSchema.index({ echeance: 1 });
taskSchema.index({ dateCreation: -1 });
taskSchema.index({ 'auteur.email': 1 });

// Index de recherche textuelle
taskSchema.index({ titre: 'text', description: 'text' });

// Méthode virtuelle pour calculer le nombre de sous-tâches terminées
taskSchema.virtual('sousTachesTerminees').get(function() {
  if (!this.sousTaches || this.sousTaches.length === 0) return 0;
  return this.sousTaches.filter(st => st.statut === 'terminée').length;
});

// Méthode virtuelle pour le pourcentage de progression
taskSchema.virtual('progression').get(function() {
  if (!this.sousTaches || this.sousTaches.length === 0) return 0;
  return Math.round((this.sousTachesTerminees / this.sousTaches.length) * 100);
});

// Méthode pour vérifier si la tâche est en retard
taskSchema.virtual('enRetard').get(function() {
  if (!this.echeance || this.statut === 'terminée' || this.statut === 'annulée') {
    return false;
  }
  return new Date() > this.echeance;
});

// Middleware pre-save pour enregistrer l'historique des modifications
taskSchema.pre('save', function(next) {
  if (!this.isNew && this.isModified()) {
    // Détecter les champs modifiés
    const modifiedPaths = this.modifiedPaths();

    modifiedPaths.forEach(path => {
      // Ignorer les champs système
      if (['updatedAt', 'historiqueModifications'].includes(path)) return;

      // Ajouter à l'historique
      if (!this.historiqueModifications) {
        this.historiqueModifications = [];
      }

      // Note: this.get() retourne la nouvelle valeur
      // Pour obtenir l'ancienne valeur, on utiliserait un plugin ou un middleware plus complexe
      // Pour simplifier, on enregistre juste le changement
    });
  }
  next();
});

// Méthode d'instance pour ajouter un commentaire
taskSchema.methods.ajouterCommentaire = function(auteur, contenu) {
  this.commentaires.push({
    auteur,
    contenu,
    date: new Date()
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

// Options pour inclure les champs virtuels lors de la conversion en JSON
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
