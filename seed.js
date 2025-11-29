// Script pour insérer des données de test dans MongoDB
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Task = require('./models/Task');
const User = require('./models/User');

// Charger les variables d'environnement
dotenv.config();

// Fonction pour seed la base de données
async function seedDatabase() {
  try {
    console.log('🔄 Connexion à MongoDB...');

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Supprimer toutes les données existantes
    console.log('🗑️  Suppression des données existantes...');
    await Task.deleteMany({});
    await User.deleteMany({});
    console.log('✅ Données existantes supprimées');

    // Créer des utilisateurs de test
    console.log('👤 Création des utilisateurs...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.insertMany([
      {
        username: 'marie.dupont',
        email: 'marie.dupont@example.com',
        password: hashedPassword,
        nom: 'Dupont',
        prenom: 'Marie'
      },
      {
        username: 'sophie.bernard',
        email: 'sophie.bernard@example.com',
        password: hashedPassword,
        nom: 'Bernard',
        prenom: 'Sophie'
      },
      {
        username: 'jean.durand',
        email: 'jean.durand@example.com',
        password: hashedPassword,
        nom: 'Durand',
        prenom: 'Jean'
      },
      {
        username: 'alice.lemoine',
        email: 'alice.lemoine@example.com',
        password: hashedPassword,
        nom: 'Lemoine',
        prenom: 'Alice'
      },
      {
        username: 'carlos.garcia',
        email: 'carlos.garcia@example.com',
        password: hashedPassword,
        nom: 'Garcia',
        prenom: 'Carlos'
      },
      {
        username: 'emma.petit',
        email: 'emma.petit@example.com',
        password: hashedPassword,
        nom: 'Petit',
        prenom: 'Emma'
      },
      {
        username: 'julie.laurent',
        email: 'julie.laurent@example.com',
        password: hashedPassword,
        nom: 'Laurent',
        prenom: 'Julie'
      },
      {
        username: 'marc.robert',
        email: 'marc.robert@example.com',
        password: hashedPassword,
        nom: 'Robert',
        prenom: 'Marc'
      },
      {
        username: 'claire.simon',
        email: 'claire.simon@example.com',
        password: hashedPassword,
        nom: 'Simon',
        prenom: 'Claire'
      },
      {
        username: 'lea.roux',
        email: 'lea.roux@example.com',
        password: hashedPassword,
        nom: 'Roux',
        prenom: 'Léa'
      },
      {
        username: 'paul.martin',
        email: 'paul.martin@example.com',
        password: hashedPassword,
        nom: 'Martin',
        prenom: 'Paul'
      },
      {
        username: 'thomas.rousseau',
        email: 'thomas.rousseau@example.com',
        password: hashedPassword,
        nom: 'Rousseau',
        prenom: 'Thomas'
      },
      {
        username: 'lucas.moreau',
        email: 'lucas.moreau@example.com',
        password: hashedPassword,
        nom: 'Moreau',
        prenom: 'Lucas'
      },
      {
        username: 'pierre.blanc',
        email: 'pierre.blanc@example.com',
        password: hashedPassword,
        nom: 'Blanc',
        prenom: 'Pierre'
      }
    ]);

    console.log(`✅ ${users.length} utilisateurs créés`);

    // Récupérer les utilisateurs par email pour faciliter la référence
    const marie = users.find(u => u.email === 'marie.dupont@example.com');
    const sophie = users.find(u => u.email === 'sophie.bernard@example.com');
    const jean = users.find(u => u.email === 'jean.durand@example.com');
    const alice = users.find(u => u.email === 'alice.lemoine@example.com');
    const carlos = users.find(u => u.email === 'carlos.garcia@example.com');
    const emma = users.find(u => u.email === 'emma.petit@example.com');
    const julie = users.find(u => u.email === 'julie.laurent@example.com');
    const marc = users.find(u => u.email === 'marc.robert@example.com');
    const claire = users.find(u => u.email === 'claire.simon@example.com');
    const lea = users.find(u => u.email === 'lea.roux@example.com');
    const paul = users.find(u => u.email === 'paul.martin@example.com');
    const thomas = users.find(u => u.email === 'thomas.rousseau@example.com');
    const lucas = users.find(u => u.email === 'lucas.moreau@example.com');
    const pierre = users.find(u => u.email === 'pierre.blanc@example.com');

    // Données de test pour les tâches
    const sampleTasks = [
      {
        titre: "Finaliser le rapport trimestriel",
        description: "Compiler les données Q4, créer les graphiques et préparer la présentation pour la direction",
        echeance: new Date('2025-03-31'),
        statut: "en cours",
        priorite: "haute",
        proprietaire: marie._id,
        visibilite: "publique",
        auteur: {
          nom: marie.nom,
          prenom: marie.prenom,
          email: marie.email
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
            auteur: paul._id,
            auteurNom: paul.username,
            contenu: "Penser à inclure les données des filiales internationales",
            dateCreation: new Date('2025-03-16')
          }
        ]
      },
      {
        titre: "Préparer la réunion client",
        description: "Préparer les slides de présentation et le compte-rendu du dernier sprint",
        echeance: new Date('2025-04-10'),
        statut: "à faire",
        priorite: "moyenne",
        proprietaire: sophie._id,
        visibilite: "privée",
        auteur: {
          nom: sophie.nom,
          prenom: sophie.prenom,
          email: sophie.email
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
        proprietaire: jean._id,
        visibilite: "privée",
        auteur: {
          nom: jean.nom,
          prenom: jean.prenom,
          email: jean.email
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
        proprietaire: alice._id,
        visibilite: "publique",
        auteur: {
          nom: alice.nom,
          prenom: alice.prenom,
          email: alice.email
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
            auteur: thomas._id,
            auteurNom: thomas.username,
            contenu: "Penser à utiliser bcrypt pour hasher les mots de passe",
            dateCreation: new Date('2025-03-17')
          },
          {
            auteur: alice._id,
            auteurNom: alice.username,
            contenu: "OK, bcrypt installé et configuré !",
            dateCreation: new Date('2025-03-19')
          }
        ]
      },
      {
        titre: "Organiser la formation MongoDB",
        description: "Préparer et animer une formation interne sur MongoDB et Mongoose",
        echeance: new Date('2025-04-15'),
        statut: "à faire",
        priorite: "moyenne",
        proprietaire: carlos._id,
        visibilite: "publique",
        auteur: {
          nom: carlos.nom,
          prenom: carlos.prenom,
          email: carlos.email
        },
        categorie: "formation",
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
        proprietaire: emma._id,
        visibilite: "publique",
        auteur: {
          nom: emma.nom,
          prenom: emma.prenom,
          email: emma.email
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
            auteur: lucas._id,
            auteurNom: lucas.username,
            contenu: "Le problème vient du event listener qui n'est pas attaché correctement",
            dateCreation: new Date('2025-03-21')
          }
        ]
      },
      {
        titre: "Planifier les vacances d'été",
        description: "Rechercher des destinations, comparer les prix et réserver les billets",
        echeance: new Date('2025-05-01'),
        statut: "à faire",
        priorite: "basse",
        proprietaire: julie._id,
        visibilite: "privée",
        auteur: {
          nom: julie.nom,
          prenom: julie.prenom,
          email: julie.email
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
        proprietaire: marc._id,
        visibilite: "publique",
        auteur: {
          nom: marc.nom,
          prenom: marc.prenom,
          email: marc.email
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
        proprietaire: claire._id,
        visibilite: "publique",
        auteur: {
          nom: claire.nom,
          prenom: claire.prenom,
          email: claire.email
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
            auteur: pierre._id,
            auteurNom: pierre.username,
            contenu: "Excellente documentation, très claire !",
            dateCreation: new Date('2025-04-19')
          }
        ]
      },
      {
        titre: "Appeler le dentiste",
        description: "Prendre rendez-vous pour le contrôle semestriel",
        echeance: new Date('2025-03-30'),
        statut: "annulée",
        priorite: "basse",
        proprietaire: lea._id,
        visibilite: "privée",
        auteur: {
          nom: lea.nom,
          prenom: lea.prenom,
          email: lea.email
        },
        categorie: "perso",
        etiquettes: ["santé", "dentiste"],
        sousTaches: [],
        commentaires: [
          {
            auteur: lea._id,
            auteurNom: lea.username,
            contenu: "Finalement, je vais reporter à plus tard",
            dateCreation: new Date('2025-03-24')
          }
        ]
      }
    ];

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
    console.log(`   - Publiques: ${insertedTasks.filter(t => t.visibilite === 'publique').length}`);
    console.log(`   - Privées: ${insertedTasks.filter(t => t.visibilite === 'privée').length}`);

    console.log('\n👥 Utilisateurs de test (tous avec mot de passe: password123) :');
    users.forEach(u => {
      console.log(`   - ${u.username} (${u.email})`);
    });

    console.log('\n🎉 Base de données initialisée avec succès !');
    console.log('🚀 Vous pouvez maintenant tester l\'API : http://localhost:3000/api/tasks\n');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Fermer la connexion
    await mongoose.connection.close();
    console.log('🔌 Connexion MongoDB fermée');
  }
}

// Lancer le seed
seedDatabase();
