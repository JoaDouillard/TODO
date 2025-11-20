// Script pour insérer des données de test dans MongoDB
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Task = require('./models/Task');

// Charger les variables d'environnement
dotenv.config();

// Données de test
const sampleTasks = [
  {
    titre: "Finaliser le rapport trimestriel",
    description: "Compiler les données Q4, créer les graphiques et préparer la présentation pour la direction",
    echeance: new Date('2025-03-31'),
    statut: "en cours",
    priorite: "haute",
    auteur: {
      nom: "Dupont",
      prenom: "Marie",
      email: "marie.dupont@example.com"
    },
    categorie: "travail",
    etiquettes: ["rapport", "urgent", "Q4"],
    sousTaches: [
      {
        titre: "Collecter les données de vente",
        statut: "terminée",
        echeance: new Date('2025-03-20')
      },
      {
        titre: "Créer les graphiques",
        statut: "en cours",
        echeance: new Date('2025-03-25')
      },
      {
        titre: "Rédiger le rapport final",
        statut: "à faire",
        echeance: new Date('2025-03-30')
      }
    ],
    commentaires: [
      {
        auteur: {
          nom: "Martin",
          prenom: "Paul",
          email: "paul.martin@example.com"
        },
        date: new Date('2025-03-16'),
        contenu: "Penser à inclure les données des filiales internationales"
      }
    ]
  },
  {
    titre: "Préparer la réunion client",
    description: "Préparer les slides de présentation et le compte-rendu du dernier sprint",
    echeance: new Date('2025-04-10'),
    statut: "à faire",
    priorite: "moyenne",
    auteur: {
      nom: "Bernard",
      prenom: "Sophie",
      email: "sophie.bernard@example.com"
    },
    categorie: "travail",
    etiquettes: ["réunion", "client", "présentation"],
    sousTaches: [
      {
        titre: "Créer les slides PowerPoint",
        statut: "à faire",
        echeance: new Date('2025-04-08')
      },
      {
        titre: "Préparer le compte-rendu",
        statut: "à faire",
        echeance: new Date('2025-04-09')
      }
    ],
    commentaires: []
  },
  {
    titre: "Faire les courses",
    description: "Acheter les provisions pour la semaine : fruits, légumes, pain, lait",
    echeance: new Date('2025-03-22'),
    statut: "à faire",
    priorite: "basse",
    auteur: {
      nom: "Durand",
      prenom: "Jean",
      email: "jean.durand@example.com"
    },
    categorie: "perso",
    etiquettes: ["courses", "hebdomadaire"],
    sousTaches: [],
    commentaires: []
  },
  {
    titre: "Développer la fonctionnalité de connexion",
    description: "Implémenter le système d'authentification JWT pour l'application",
    echeance: new Date('2025-04-05'),
    statut: "en cours",
    priorite: "critique",
    auteur: {
      nom: "Lemoine",
      prenom: "Alice",
      email: "alice.lemoine@example.com"
    },
    categorie: "projet",
    etiquettes: ["développement", "sécurité", "JWT", "authentification"],
    sousTaches: [
      {
        titre: "Créer le modèle User",
        statut: "terminée",
        echeance: new Date('2025-03-18')
      },
      {
        titre: "Implémenter les routes d'authentification",
        statut: "en cours",
        echeance: new Date('2025-03-25')
      },
      {
        titre: "Créer les middlewares de protection",
        statut: "à faire",
        echeance: new Date('2025-04-01')
      },
      {
        titre: "Tester l'authentification",
        statut: "à faire",
        echeance: new Date('2025-04-04')
      }
    ],
    commentaires: [
      {
        auteur: {
          nom: "Rousseau",
          prenom: "Thomas",
          email: "thomas.rousseau@example.com"
        },
        date: new Date('2025-03-17'),
        contenu: "Penser à utiliser bcrypt pour hasher les mots de passe"
      },
      {
        auteur: {
          nom: "Lemoine",
          prenom: "Alice",
          email: "alice.lemoine@example.com"
        },
        date: new Date('2025-03-19'),
        contenu: "OK, bcrypt installé et configuré !"
      }
    ]
  },
  {
    titre: "Organiser la formation MongoDB",
    description: "Préparer et animer une formation interne sur MongoDB et Mongoose",
    echeance: new Date('2025-04-15'),
    statut: "à faire",
    priorite: "moyenne",
    auteur: {
      nom: "Garcia",
      prenom: "Carlos",
      email: "carlos.garcia@example.com"
    },
    categorie: "projet",
    etiquettes: ["formation", "mongodb", "technique"],
    sousTaches: [
      {
        titre: "Créer les supports de formation",
        statut: "à faire",
        echeance: new Date('2025-04-10')
      },
      {
        titre: "Réserver la salle",
        statut: "à faire",
        echeance: new Date('2025-04-12')
      }
    ],
    commentaires: []
  },
  {
    titre: "Corriger le bug de l'interface utilisateur",
    description: "Le bouton de soumission du formulaire ne fonctionne pas sur mobile",
    echeance: new Date('2025-03-25'),
    statut: "en cours",
    priorite: "haute",
    auteur: {
      nom: "Petit",
      prenom: "Emma",
      email: "emma.petit@example.com"
    },
    categorie: "travail",
    etiquettes: ["bug", "mobile", "urgence"],
    sousTaches: [
      {
        titre: "Identifier la cause du bug",
        statut: "terminée",
        echeance: new Date('2025-03-20')
      },
      {
        titre: "Corriger le code",
        statut: "en cours",
        echeance: new Date('2025-03-23')
      },
      {
        titre: "Tester sur différents appareils",
        statut: "à faire",
        echeance: new Date('2025-03-24')
      }
    ],
    commentaires: [
      {
        auteur: {
          nom: "Moreau",
          prenom: "Lucas",
          email: "lucas.moreau@example.com"
        },
        date: new Date('2025-03-21'),
        contenu: "Le problème vient du event listener qui n'est pas attaché correctement"
      }
    ]
  },
  {
    titre: "Planifier les vacances d'été",
    description: "Rechercher des destinations, comparer les prix et réserver les billets",
    echeance: new Date('2025-05-01'),
    statut: "à faire",
    priorite: "basse",
    auteur: {
      nom: "Laurent",
      prenom: "Julie",
      email: "julie.laurent@example.com"
    },
    categorie: "perso",
    etiquettes: ["vacances", "voyage", "été"],
    sousTaches: [],
    commentaires: []
  },
  {
    titre: "Réviser le code de l'application",
    description: "Code review complet avant le déploiement en production",
    echeance: new Date('2025-03-28'),
    statut: "en cours",
    priorite: "critique",
    auteur: {
      nom: "Robert",
      prenom: "Marc",
      email: "marc.robert@example.com"
    },
    categorie: "projet",
    etiquettes: ["code-review", "production", "qualité"],
    sousTaches: [
      {
        titre: "Réviser le backend",
        statut: "en cours",
        echeance: new Date('2025-03-26')
      },
      {
        titre: "Réviser le frontend",
        statut: "à faire",
        echeance: new Date('2025-03-27')
      }
    ],
    commentaires: []
  },
  {
    titre: "Mettre à jour la documentation",
    description: "Documenter les nouvelles fonctionnalités et mettre à jour le README",
    echeance: new Date('2025-04-20'),
    statut: "terminée",
    priorite: "moyenne",
    auteur: {
      nom: "Simon",
      prenom: "Claire",
      email: "claire.simon@example.com"
    },
    categorie: "projet",
    etiquettes: ["documentation", "README"],
    sousTaches: [
      {
        titre: "Documenter l'API REST",
        statut: "terminée",
        echeance: new Date('2025-04-15')
      },
      {
        titre: "Mettre à jour le README",
        statut: "terminée",
        echeance: new Date('2025-04-18')
      }
    ],
    commentaires: [
      {
        auteur: {
          nom: "Blanc",
          prenom: "Pierre",
          email: "pierre.blanc@example.com"
        },
        date: new Date('2025-04-19'),
        contenu: "Excellente documentation, très claire !"
      }
    ]
  },
  {
    titre: "Appeler le dentiste",
    description: "Prendre rendez-vous pour le contrôle semestriel",
    echeance: new Date('2025-03-30'),
    statut: "annulée",
    priorite: "basse",
    auteur: {
      nom: "Roux",
      prenom: "Léa",
      email: "lea.roux@example.com"
    },
    categorie: "perso",
    etiquettes: ["santé", "dentiste"],
    sousTaches: [],
    commentaires: [
      {
        auteur: {
          nom: "Roux",
          prenom: "Léa",
          email: "lea.roux@example.com"
        },
        date: new Date('2025-03-24'),
        contenu: "Finalement, je vais reporter à plus tard"
      }
    ]
  }
];

// Fonction pour seed la base de données
async function seedDatabase() {
  try {
    console.log('🔄 Connexion à MongoDB...');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer toutes les tâches existantes
    console.log('🗑️  Suppression des tâches existantes...');
    await Task.deleteMany({});
    console.log('✅ Tâches existantes supprimées');

    // Insérer les nouvelles tâches
    console.log('📝 Insertion des données de test...');
    const insertedTasks = await Task.insertMany(sampleTasks);
    console.log(`✅ ${insertedTasks.length} tâches insérées avec succès`);

    // Afficher un résumé
    console.log('\n📊 Résumé des tâches insérées :');
    console.log(`   - À faire: ${insertedTasks.filter(t => t.statut === 'à faire').length}`);
    console.log(`   - En cours: ${insertedTasks.filter(t => t.statut === 'en cours').length}`);
    console.log(`   - Terminée: ${insertedTasks.filter(t => t.statut === 'terminée').length}`);
    console.log(`   - Annulée: ${insertedTasks.filter(t => t.statut === 'annulée').length}`);

    console.log('\n🎉 Base de données initialisée avec succès !');
    console.log('🚀 Vous pouvez maintenant tester l\'API : http://localhost:3000/api/tasks\n');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error.message);
    process.exit(1);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Lancer le seed
seedDatabase();
