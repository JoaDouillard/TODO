// ========================================
// PAGE DE CRÉATION - LOGIQUE
// ========================================

let createTemplate;
let allCategories = [];

// Fonction appelée par le router
async function createPage() {
  // Compiler le template Handlebars
  const source = document.getElementById('create-template').innerHTML;
  createTemplate = Handlebars.compile(source);

  // Rendre le template
  $('app').innerHTML = createTemplate();

  // Charger les catégories
  await loadCategories();

  // Attacher les événements
  $('createTaskForm').addEventListener('submit', handleCreateTaskSubmit);
  $('categorie').addEventListener('input', handleCategorieInput);
  $('categorie').addEventListener('focus', handleCategorieInput);

  // Fermer les suggestions si on clique ailleurs
  document.addEventListener('click', (e) => {
    if (e.target.id !== 'categorie') {
      hideCategoriesSuggestions();
    }
  });
}

// Charger les catégories depuis l'API
async function loadCategories() {
  try {
    const response = await fetch('http://localhost:3000/api/categories');
    const data = await response.json();

    if (data.success) {
      allCategories = data.data.map(cat => cat.nom);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des catégories:', error);
  }
}

// Gérer l'input de la catégorie (autocomplétion)
function handleCategorieInput(event) {
  const value = event.target.value.trim().toLowerCase();
  const suggestions = $('categoriesSuggestions');

  if (!value) {
    // Afficher toutes les catégories si le champ est vide
    if (allCategories.length > 0) {
      displayCategoriesSuggestions(allCategories);
    } else {
      hideCategoriesSuggestions();
    }
    return;
  }

  // Filtrer les catégories - cherche si la chaîne contient la valeur tapée
  const filtered = allCategories.filter(cat => cat.toLowerCase().includes(value));

  if (filtered.length > 0) {
    displayCategoriesSuggestions(filtered);
  } else {
    // Aucune suggestion trouvée
    suggestions.innerHTML = `
      <div class="px-4 py-3 text-sm text-gray-500 italic">
        Aucune catégorie trouvée. Tapez pour créer "<strong>${escapeHTML(event.target.value)}</strong>"
      </div>
    `;
    suggestions.classList.remove('hidden');
  }
}

// Afficher les suggestions de catégories
function displayCategoriesSuggestions(categories) {
  const suggestions = $('categoriesSuggestions');

  suggestions.innerHTML = categories.map(cat => `
    <div
      class="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm"
      onclick="selectCategorie('${escapeHTML(cat)}')"
    >
      📁 ${escapeHTML(cat)}
    </div>
  `).join('');

  suggestions.classList.remove('hidden');
}

// Sélectionner une catégorie
function selectCategorie(categorie) {
  $('categorie').value = categorie;
  hideCategoriesSuggestions();
}

// Masquer les suggestions
function hideCategoriesSuggestions() {
  $('categoriesSuggestions').classList.add('hidden');
}

// Gérer la soumission du formulaire
async function handleCreateTaskSubmit(event) {
  event.preventDefault();

  // Récupérer les valeurs du formulaire
  const taskData = {
    titre: $('titre').value.trim(),
    description: $('description').value.trim(),
    statut: 'à faire',
    priorite: $('priorite').value,
    categorie: $('categorie').value.trim().toLowerCase(), // Normaliser en minuscules
    auteur: {
      nom: $('auteurNom').value.trim(),
      prenom: $('auteurPrenom').value.trim(),
      email: $('auteurEmail').value.trim()
    }
  };

  // Ajouter l'échéance si renseignée
  const echeanceValue = $('echeance').value;
  if (echeanceValue) {
    taskData.echeance = new Date(echeanceValue).toISOString();
  }

  // Ajouter les étiquettes si renseignées
  const etiquettesValue = $('etiquettes').value.trim();
  if (etiquettesValue) {
    taskData.etiquettes = etiquettesValue
      .split('/')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la création de la tâche');
    }

    showNotification('Tâche créée avec succès !', 'success');
    window.location.href = '/';
  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}
