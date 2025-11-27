// ========================================
// PAGES DE GESTION DES TÂCHES
// ========================================

let allMyTasks = [];
let allPublicTasks = [];
let myTasksTemplate, myTaskCardTemplate;

// ========================================
// PAGE "MES TÂCHES"
// ========================================

async function myTasksPage() {
  // Vérifier que l'utilisateur est connecté
  if (!isAuthenticated()) {
    showNotification('Veuillez vous connecter pour accéder à vos tâches', 'error');
    navigate('/login');
    return;
  }

  // Compiler les templates
  const homeSource = document.getElementById('home-template').innerHTML;
  myTasksTemplate = Handlebars.compile(homeSource);

  const cardSource = document.getElementById('task-card-template').innerHTML;
  myTaskCardTemplate = Handlebars.compile(cardSource);

  // Rendre le template
  $('app').innerHTML = myTasksTemplate();

  // Modifier le titre de la section
  const titleElement = document.querySelector('#app h2') || document.querySelector('#app .text-3xl');
  if (titleElement) {
    titleElement.textContent = '📋 Mes Tâches';
  }

  // Charger les tâches et attacher les événements
  await loadMyTasks();
  attachMyTasksEventListeners();
}

async function loadMyTasks() {
  try {
    const response = await fetchWithAuth(API_URL);
    const data = await response.json();

    if (data.success) {
      allMyTasks = data.data || [];
      displayCategoriesButtons('my');
      displayMyTasks(allMyTasks);
    } else {
      throw new Error('Erreur lors du chargement des tâches');
    }
  } catch (error) {
    console.error('Erreur:', error);
    $('tasksList').innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-500 text-xl mb-4">❌ Erreur lors du chargement de vos tâches</p>
        <p class="text-gray-600">${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}

function attachMyTasksEventListeners() {
  $('filterStatut').addEventListener('change', () => applyMyTasksFilters());
  $('filterPriorite').addEventListener('change', () => applyMyTasksFilters());
  $('searchQuery').addEventListener('input', () => applyMyTasksFilters());
  $('searchCategorie').addEventListener('input', () => applyMyTasksFilters());
}

function applyMyTasksFilters() {
  const selectedStatus = $('filterStatut').value;
  const selectedPriority = $('filterPriorite').value;
  const searchQuery = $('searchQuery').value.toLowerCase();
  const searchCategorie = $('searchCategorie').value.toLowerCase();

  const filteredTasks = allMyTasks.filter(task => {
    if (selectedStatus && task.statut !== selectedStatus) return false;
    if (selectedPriority && task.priorite !== selectedPriority) return false;

    if (searchCategorie) {
      const catMatch = (task.categorie || '').toLowerCase().includes(searchCategorie);
      if (!catMatch) return false;
    }

    if (searchQuery) {
      const titleMatch = task.titre.toLowerCase().includes(searchQuery);
      const descMatch = (task.description || '').toLowerCase().includes(searchQuery);
      const catMatch = (task.categorie || '').toLowerCase().includes(searchQuery);
      const tagsMatch = (task.etiquettes || []).some(tag =>
        tag.toLowerCase().includes(searchQuery)
      );

      if (!titleMatch && !descMatch && !catMatch && !tagsMatch) return false;
    }

    return true;
  });

  displayMyTasks(filteredTasks);
}

function displayMyTasks(tasks) {
  const container = $('tasksList');

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-500 text-xl">📭 Vous n'avez aucune tâche</p>
        <a href="/create" class="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
          + Créer une tâche
        </a>
      </div>
    `;
    return;
  }

  const tasksData = tasks.map(task => {
    const taskData = prepareTaskData(task, true); // true = propriétaire
    taskData.showVisibilityBadge = true; // Afficher le badge sur "Mes Tâches" (non-cliquable car isOwner)
    taskData.isMyTasksPage = true; // Page "Mes Tâches" - badge en lecture seule
    return taskData;
  });
  container.innerHTML = tasksData.map(taskData => myTaskCardTemplate(taskData)).join('');
}

// ========================================
// PAGE "TÂCHES PUBLIQUES"
// ========================================

async function publicTasksPage() {
  // Vérifier que l'utilisateur est connecté
  if (!isAuthenticated()) {
    showNotification('Veuillez vous connecter pour accéder aux tâches publiques', 'error');
    navigate('/login');
    return;
  }

  // Compiler les templates
  const homeSource = document.getElementById('home-template').innerHTML;
  myTasksTemplate = Handlebars.compile(homeSource);

  const cardSource = document.getElementById('task-card-template').innerHTML;
  myTaskCardTemplate = Handlebars.compile(cardSource);

  // Rendre le template
  $('app').innerHTML = myTasksTemplate();

  // Modifier le titre de la section
  const titleElement = document.querySelector('#app h2') || document.querySelector('#app .text-3xl');
  if (titleElement) {
    titleElement.textContent = '🌍 Tâches Publiques';
  }

  // Charger les tâches et attacher les événements
  await loadPublicTasks();
  attachPublicTasksEventListeners();
}

async function loadPublicTasks() {
  try {
    const response = await fetchWithAuth(`${API_URL}/public`);
    const data = await response.json();

    if (data.success) {
      allPublicTasks = data.data || [];
      displayCategoriesButtons('public');
      displayPublicTasks(allPublicTasks);
    } else {
      throw new Error('Erreur lors du chargement des tâches publiques');
    }
  } catch (error) {
    console.error('Erreur:', error);
    $('tasksList').innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-red-500 text-xl mb-4">❌ Erreur lors du chargement des tâches publiques</p>
        <p class="text-gray-600">${escapeHTML(error.message)}</p>
      </div>
    `;
  }
}

function attachPublicTasksEventListeners() {
  $('filterStatut').addEventListener('change', () => applyPublicTasksFilters());
  $('filterPriorite').addEventListener('change', () => applyPublicTasksFilters());
  $('searchQuery').addEventListener('input', () => applyPublicTasksFilters());
  $('searchCategorie').addEventListener('input', () => applyPublicTasksFilters());
}

function applyPublicTasksFilters() {
  const selectedStatus = $('filterStatut').value;
  const selectedPriority = $('filterPriorite').value;
  const searchQuery = $('searchQuery').value.toLowerCase();
  const searchCategorie = $('searchCategorie').value.toLowerCase();

  const filteredTasks = allPublicTasks.filter(task => {
    if (selectedStatus && task.statut !== selectedStatus) return false;
    if (selectedPriority && task.priorite !== selectedPriority) return false;

    if (searchCategorie) {
      const catMatch = (task.categorie || '').toLowerCase().includes(searchCategorie);
      if (!catMatch) return false;
    }

    if (searchQuery) {
      const titleMatch = task.titre.toLowerCase().includes(searchQuery);
      const descMatch = (task.description || '').toLowerCase().includes(searchQuery);
      const catMatch = (task.categorie || '').toLowerCase().includes(searchQuery);
      const tagsMatch = (task.etiquettes || []).some(tag =>
        tag.toLowerCase().includes(searchQuery)
      );

      if (!titleMatch && !descMatch && !catMatch && !tagsMatch) return false;
    }

    return true;
  });

  displayPublicTasks(filteredTasks);
}

function displayPublicTasks(tasks) {
  const container = $('tasksList');

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <p class="text-gray-500 text-xl">📭 Aucune tâche publique disponible</p>
      </div>
    `;
    return;
  }

  const currentUser = getCurrentUser();
  const tasksData = tasks.map(task => {
    const isOwner = currentUser && task.proprietaire && task.proprietaire._id === currentUser._id;
    const taskData = prepareTaskData(task, isOwner);
    taskData.showVisibilityBadge = false; // NE PAS afficher le badge sur "Tâches Publiques"
    return taskData;
  });

  container.innerHTML = tasksData.map(taskData => myTaskCardTemplate(taskData)).join('');
}

// ========================================
// FONCTIONS UTILITAIRES
// ========================================

function prepareTaskData(task, isOwner) {
  const completedSubtasks = task.sousTaches ? task.sousTaches.filter(st => st.statut === 'terminée').length : 0;
  const totalSubtasks = task.sousTaches ? task.sousTaches.length : 0;

  const currentUser = getCurrentUser();

  // Afficher "Par @moi" si c'est ma tâche, sinon afficher le username
  let proprietaireNom;
  if (isOwner) {
    proprietaireNom = '@moi';
  } else {
    proprietaireNom = task.proprietaire ? `@${task.proprietaire.username}` : 'Utilisateur inconnu';
  }

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
    visibilite: task.visibilite || 'privée',
    visibiliteIcon: task.visibilite === 'publique' ? '🌍' : '🔒',
    visibiliteClass: task.visibilite === 'publique' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
  };
}

function displayCategoriesButtons(mode) {
  const tasks = mode === 'my' ? allMyTasks : allPublicTasks;
  const categories = [...new Set(tasks.map(task => task.categorie).filter(cat => cat))];
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
            onclick="filterByCategory('${escapeHTML(cat)}', '${mode}')"
            class="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
          >
            📁 ${escapeHTML(cat)}
          </button>
        `).join('')}
        <button
          onclick="clearCategoryFilter('${mode}')"
          class="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-sm transition-colors"
        >
          ✕ Effacer
        </button>
      </div>
    </div>
  `;
}

function filterByCategory(category, mode) {
  $('searchCategorie').value = category;
  if (mode === 'my') {
    applyMyTasksFilters();
  } else {
    applyPublicTasksFilters();
  }
}

function clearCategoryFilter(mode) {
  $('searchCategorie').value = '';
  if (mode === 'my') {
    applyMyTasksFilters();
  } else {
    applyPublicTasksFilters();
  }
}

// ========================================
// FONCTION DE TOGGLE VISIBILITÉ
// ========================================

async function toggleTaskVisibility(taskId) {
  try {
    const response = await fetchWithAuth(`${API_URL}/${taskId}/visibility`, {
      method: 'PATCH'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors du changement de visibilité');
    }

    showNotification(data.message, 'success');

    // Recharger les tâches de la page actuelle
    if (window.location.pathname === '/my-tasks') {
      await loadMyTasks();
    } else if (window.location.pathname === '/public-tasks') {
      await loadPublicTasks();
    }

  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}

// ========================================
// FONCTION DE SUPPRESSION
// ========================================

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

    // Recharger les tâches de la page actuelle
    if (window.location.pathname === '/my-tasks') {
      await loadMyTasks();
    } else if (window.location.pathname === '/public-tasks') {
      await loadPublicTasks();
    } else {
      // Page d'accueil
      window.location.reload();
    }

  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur lors de la suppression', 'error');
  }
}
