
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

  // Auto-remplir les informations de l'auteur avec les données du user connecté
  const currentUser = getCurrentUser();
  if (currentUser) {
    $('auteurNom').value = currentUser.nom || '';
    $('auteurPrenom').value = currentUser.prenom || '';
    $('auteurEmail').value = currentUser.email || '';
  }

  // Définir la date minimum pour l'échéance (aujourd'hui)
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const minDate = `${year}-${month}-${day}`;
  $('echeance').setAttribute('min', minDate);

  // Attacher les événements
  $('createTaskForm').addEventListener('submit', handleCreateTaskSubmit);
  $('categorie').addEventListener('input', handleCategorieInput);
  $('categorie').addEventListener('focus', handleCategorieInput);

  // Attacher l'event listener pour le compteur de caractères de catégorie
  $('categorie').addEventListener('input', (e) => {
    const length = e.target.value.length;
    const counter = $('categorieLength');
    if (counter) {
      counter.textContent = length;
    }
  });

  // Fermer les suggestions si on clique ailleurs
  document.addEventListener('click', (e) => {
    if (e.target.id !== 'categorie') {
      hideCategoriesSuggestions();
    }
  });
}

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

function toggleVisibiliteCreate() {
  const visibiliteInput = $('visibilite');
  const toggleBtn = $('visibiliteToggleBtn');

  if (visibiliteInput.value === 'privée') {
    visibiliteInput.value = 'publique';
    toggleBtn.className = 'bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full font-semibold border-2 border-green-200 shadow-sm hover:opacity-80 transition-opacity';
    toggleBtn.innerHTML = '🌍 Publique';
  } else {
    visibiliteInput.value = 'privée';
    toggleBtn.className = 'bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-full font-semibold border-2 border-red-200 shadow-sm hover:opacity-80 transition-opacity';
    toggleBtn.innerHTML = '🔒 Privée';
  }
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
    visibilite: $('visibilite').value,
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
    // Valider que la date n'est pas dans le passé
    const selectedDate = new Date(echeanceValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      showNotification('Erreur : La date d\'échéance ne peut pas être dans le passé', 'error');
      return;
    }
    
    taskData.echeance = selectedDate.toISOString();
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
    const response = await fetchWithAuth(API_URL, {
      method: 'POST',
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la création de la tâche');
    }

    showNotification('Tâche créée avec succès !', 'success');
    navigate('/my-tasks');
  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}
