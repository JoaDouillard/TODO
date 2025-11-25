// ========================================
// PAGE D'ACCUEIL - LOGIQUE
// ========================================

let allTasks = [];
let homeTemplate, taskCardTemplate;

// Fonction appelée par le router
function homePage() {
  // Compiler les templates Handlebars
  const homeSource = document.getElementById('home-template').innerHTML;
  homeTemplate = Handlebars.compile(homeSource);

  const cardSource = document.getElementById('task-card-template').innerHTML;
  taskCardTemplate = Handlebars.compile(cardSource);

  // Rendre le template de la page
  $('app').innerHTML = homeTemplate();

  // Charger les données et attacher les événements
  loadTasks();
  attachEventListeners();
}

// Attacher les événements
function attachEventListeners() {
  $('filterStatut').addEventListener('change', applyFilters);
  $('filterPriorite').addEventListener('change', applyFilters);
  $('searchQuery').addEventListener('input', applyFilters);
  $('searchCategorie').addEventListener('input', applyFilters);
}

// Charger toutes les tâches
async function loadTasks() {
  try {
    const response = await fetch(API_URL);
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

// Afficher les boutons de catégories
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

  const filteredTasks = allTasks.filter(task => {
    if (selectedStatus && task.statut !== selectedStatus) return false;
    if (selectedPriority && task.priorite !== selectedPriority) return false;

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

  displayTasks(filteredTasks);
}

// Afficher les tâches
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

// Supprimer une tâche
async function deleteTask(taskId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${taskId}`, {
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
