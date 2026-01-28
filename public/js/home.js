
let allTasks = [];
let homeTemplate, taskCardTemplate;

// Fonction appelée par le router
function homePage() {
  if (isAuthenticated()) {
    navigate('/my-tasks');
    return;
  }

  // Mode visiteur : afficher quelques tâches publiques
  // Compiler les templates Handlebars
  const homeSource = document.getElementById('home-template').innerHTML;
  homeTemplate = Handlebars.compile(homeSource);

  const cardSource = document.getElementById('task-card-template').innerHTML;
  taskCardTemplate = Handlebars.compile(cardSource);

  // Rendre le template de la page
  $('app').innerHTML = homeTemplate();

  // Charger les tâches publiques pour visiteur
  loadPublicTasksForVisitor();
}

// Attacher les événements
function attachEventListeners() {
  $('filterStatut').addEventListener('change', applyFilters);
  $('filterPriorite').addEventListener('change', applyFilters);
  $('searchQuery').addEventListener('input', applyFilters);
  $('searchCategorie').addEventListener('input', applyFilters);
  $('filterEcheanceFrom').addEventListener('change', applyFilters);
  $('filterEcheanceTo').addEventListener('change', applyFilters);
}

async function loadTasks() {
  try {
    const response = await fetchWithAuth(API_URL);
    const data = await response.json();

    if (data.success) {
      allTasks = data.data || [];
      displayCategoriesButtons();
      displayTasks(allTasks);
    } else {
      throw new Error('Erreur lors du chargement des tâches');
    }
  } catch (error) {
    console.error('Erreur:', error);
    $('tasksList').innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-500 text-xl mb-4">❌ Erreur lors du chargement des tâches</p>
        <p class="text-gray-600">${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}

function displayCategoriesButtons() {
  const categories = [...new Set(allTasks.map(task => task.categorie).filter(cat => cat))];
  const container = $('categoriesButtons');

  if (categories.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="border-t pt-4">
      <p class="text-sm font-medium text-gray-700 mb-2">Catégories disponibles :</p>
      <div class="flex flex-wrap gap-2">
        ${categories.map(cat => `
          <button
            onclick="filterByCategory('${escapeHTML(cat)}')"
            class="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
          >
            📁 ${escapeHTML(cat)}
          </button>
        `).join('')}
        <button
          onclick="clearCategoryFilter()"
          class="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-sm transition-colors"
        >
          ✕ Effacer
        </button>
      </div>
    </div>
  `;
}

// Filtrer par catégorie (clic sur un bouton)
function filterByCategory(category) {
  $('searchCategorie').value = category;
  applyFilters();
}

// Effacer le filtre de catégorie
function clearCategoryFilter() {
  $('searchCategorie').value = '';
  applyFilters();
}

// Appliquer les filtres
function applyFilters() {
  const selectedStatus = $('filterStatut').value;
  const selectedPriority = $('filterPriorite').value;
  const searchQuery = $('searchQuery').value.toLowerCase();
  const searchCategorie = $('searchCategorie').value.toLowerCase();
  const echeanceFromValue = $('filterEcheanceFrom').value;
  const echeanceToValue = $('filterEcheanceTo').value;

  const filteredTasks = allTasks.filter(task => {
    if (selectedStatus && task.statut !== selectedStatus) return false;
    if (selectedPriority && task.priorite !== selectedPriority) return false;

    // Filtre par plage d'échéance - SEULEMENT si un filtre de date est sélectionné
    if (echeanceFromValue || echeanceToValue) {
      // Si un filtre est actif, exclure les tâches sans échéance
      if (!task.echeance) return false;
      
      // Extraire juste la date (YYYY-MM-DD) du timestamp echeance
      const taskDateStr = new Date(task.echeance).toISOString().split('T')[0];
      
      // Comparer avec la date "de"
      if (echeanceFromValue && taskDateStr < echeanceFromValue) {
        return false;
      }
      
      // Comparer avec la date "à"
      if (echeanceToValue && taskDateStr > echeanceToValue) {
        return false;
      }
    }

    // Filtre par catégorie
    if (searchCategorie) {
      const catMatch = (task.categorie || '').toLowerCase().includes(searchCategorie);
      if (!catMatch) return false;
    }

    // Recherche générale
    if (searchQuery) {
      const titleMatch = task.titre.toLowerCase().includes(searchQuery);
      const descMatch = (task.description || '').toLowerCase().includes(searchQuery);
      const catMatch = (task.categorie || '').toLowerCase().includes(searchQuery);

      // Recherche dans les étiquettes
      const tagsMatch = (task.etiquettes || []).some(tag =>
        tag.toLowerCase().includes(searchQuery)
      );

      if (!titleMatch && !descMatch && !catMatch && !tagsMatch) return false;
    }

    return true;
  });

  // Afficher avec la fonction appropriée selon le mode
  if (isAuthenticated()) {
    displayTasks(filteredTasks);
  } else {
    displayVisitorTasks(filteredTasks);
  }
}

function displayTasks(tasks) {
  const container = $('tasksList');

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-500 text-xl">📭 Aucune tâche trouvée</p>
        <a href="/create" class="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
          + Créer une tâche
        </a>
      </div>
    `;
    return;
  }

  // Préparer les données pour le template
  const tasksData = tasks.map(task => {
    const completedSubtasks = task.sousTaches ? task.sousTaches.filter(st => st.statut === 'terminée').length : 0;
    const totalSubtasks = task.sousTaches ? task.sousTaches.length : 0;

    return {
      _id: task._id,
      titre: task.titre,
      description: task.description || 'Pas de description',
      categorie: task.categorie,
      etiquettes: task.etiquettes || [],
      echeance: formatDate(task.echeance),
      dateCreation: formatDate(task.dateCreation),
      prioriteLabel: task.priorite.toUpperCase(),
      statusClass: getStatusClass(task.statut),
      statusLabel: getStatusLabel(task.statut),
      statusBorder: getStatusBorderClass(task.statut),
      prioClass: getPriorityColor(task.priorite),
      prioBgClass: getPriorityBgClass(task.priorite),
      prioTextClass: getPriorityTextClass(task.priorite),
      prioBorderClass: getPriorityBorderClass(task.priorite),
      borderClass: getPriorityBorderColor(task.priorite),
      completedSubtasks,
      totalSubtasks
    };
  });

  // Rendre les cartes de tâches
  container.innerHTML = tasksData.map(taskData => taskCardTemplate(taskData)).join('');
}

async function deleteTask(taskId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/${taskId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la suppression');
    }

    showNotification('Tâche supprimée avec succès', 'success');
    loadTasks();
  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur lors de la suppression', 'error');
  }
}

// MODE VISITEUR

async function loadPublicTasksForVisitor() {
  try {
    // Charger les tâches publiques (sans authentification)
    const response = await fetch(`${API_URL}/public`);
    const data = await response.json();

    if (data.success) {
      const publicTasks = data.data || [];
      allTasks = publicTasks; // Stocker pour la recherche

      // Modifier le titre de la section
      const titleElement = document.querySelector('#app h2') || document.querySelector('#app .text-3xl');
      if (titleElement) {
        titleElement.textContent = '🌍 Aperçu des Tâches Publiques';
      }

      // Attacher les événements de recherche pour visiteurs
      attachEventListeners();

      // Afficher un message d'invitation
      const container = $('tasksList');

      if (publicTasks.length === 0) {
        container.innerHTML = `
          <div class="col-span-full text-center py-12">
            <p class="text-gray-500 text-xl mb-4">📭 Aucune tâche publique disponible</p>
            <p class="text-gray-600 mb-6">Connectez-vous pour créer et gérer vos propres tâches !</p>
            <div class="flex gap-4 justify-center">
              <a href="/login" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Se connecter
              </a>
              <a href="/register" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                S'inscrire
              </a>
            </div>
          </div>
        `;
        return;
      }

      // Afficher les catégories et les tâches publiques
      displayCategoriesButtons();
      displayVisitorTasks(publicTasks);

    } else {
      throw new Error('Erreur lors du chargement des tâches publiques');
    }
  } catch (error) {
    console.error('Erreur:', error);
    $('tasksList').innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-500 text-xl mb-4"> Erreur lors du chargement</p>
        <p class="text-gray-600">${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}

function displayVisitorTasks(tasks) {
  const container = $('tasksList');

  // Préparer les données des tâches (mode non-propriétaire)
  const currentUser = getCurrentUser();
  const tasksData = tasks.map(task => {
    const isOwner = false; // En mode visiteur, on n'est propriétaire d'aucune tâche
    const completedSubtasks = task.sousTaches ? task.sousTaches.filter(st => st.statut === 'terminée').length : 0;
    const totalSubtasks = task.sousTaches ? task.sousTaches.length : 0;
    const proprietaireNom = task.proprietaire ? `@${task.proprietaire.username}` : 'Utilisateur inconnu';

    return {
      _id: task._id,
      titre: task.titre,
      description: task.description || 'Pas de description',
      categorie: task.categorie,
      etiquettes: task.etiquettes || [],
      echeance: formatDate(task.echeance),
      dateCreation: formatDate(task.dateCreation),
      prioriteLabel: task.priorite.toUpperCase(),
      statusClass: getStatusClass(task.statut),
      statusLabel: getStatusLabel(task.statut),
      statusBorder: getStatusBorderClass(task.statut),
      prioClass: getPriorityColor(task.priorite),
      prioBgClass: getPriorityBgClass(task.priorite),
      prioTextClass: getPriorityTextClass(task.priorite),
      prioBorderClass: getPriorityBorderClass(task.priorite),
      borderClass: getPriorityBorderColor(task.priorite),
      completedSubtasks,
      totalSubtasks,
      isOwner,
      proprietaireNom,
      visibilite: 'publique',
      visibiliteIcon: '🌍',
      visibiliteClass: 'bg-green-100 text-green-700'
    };
  });

  // Afficher les cartes + message d'invitation
  container.innerHTML = `
    <div class="col-span-full bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-4">
      <h3 class="text-xl font-bold text-blue-800 mb-2">👋 Bienvenue !</h3>
      <p class="text-blue-700 mb-4">
        Vous consultez un aperçu des tâches publiques.
        <strong>Connectez-vous</strong> pour créer vos propres tâches, les organiser et collaborer !
      </p>
      <div class="flex gap-4">
        <a href="/login" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Se connecter
        </a>
        <a href="/register" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          S'inscrire
        </a>
      </div>
    </div>
    ${tasksData.map(taskData => taskCardTemplate(taskData)).join('')}
  `;
}
