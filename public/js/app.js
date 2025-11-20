// Gestionnaire de Tâches - Frontend JavaScript

const API_URL = 'http://localhost:3000/api';

// État de l'application
let tasks = [];

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Application initialisée');

  // Charger les tâches
  fetchTasks();

  // Event listeners
  setupEventListeners();
});

// Configuration des event listeners
function setupEventListeners() {
  document.getElementById('btnNewTask')?.addEventListener('click', () => {
    console.log('Bouton Nouvelle Tâche cliqué');
    // TODO: Ouvrir le formulaire de création
  });

  document.getElementById('filterStatut')?.addEventListener('change', applyFilters);
  document.getElementById('filterPriorite')?.addEventListener('change', applyFilters);
  document.getElementById('searchQuery')?.addEventListener('input', applyFilters);
}

// Récupérer toutes les tâches
async function fetchTasks() {
  try {
    console.log('Récupération des tâches...');
    const response = await fetch(`${API_URL}/tasks`);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    tasks = data.data || [];

    console.log(`✅ ${tasks.length} tâches récupérées`);
    displayTasks(tasks);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des tâches:', error);
    showError('Impossible de charger les tâches. Vérifiez que le serveur est démarré.');
  }
}

// Afficher les tâches
function displayTasks(tasksToDisplay) {
  const tasksList = document.getElementById('tasksList');

  if (!tasksToDisplay || tasksToDisplay.length === 0) {
    tasksList.innerHTML = `
      <div class="text-center py-12 col-span-full">
        <p class="text-gray-500 text-lg">Aucune tâche à afficher</p>
        <p class="text-gray-400 mt-2">Créez votre première tâche pour commencer !</p>
      </div>
    `;
    return;
  }

  tasksList.innerHTML = tasksToDisplay.map(task => createTaskCard(task)).join('');
}

// Créer une carte de tâche
function createTaskCard(task) {
  const priorityClass = `priority-${task.priorite}`;
  const statusClass = getStatusClass(task.statut);
  const statusLabel = getStatusLabel(task.statut);

  return `
    <div class="bg-white rounded-lg shadow-md p-6 ${priorityClass} fade-in hover:shadow-lg transition">
      <div class="flex justify-between items-start mb-3">
        <h3 class="text-xl font-semibold text-gray-800 flex-1">${task.titre}</h3>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>

      <p class="text-gray-600 mb-4 line-clamp-2">${task.description || 'Pas de description'}</p>

      <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span>📅 ${formatDate(task.echeance)}</span>
        <span class="font-semibold ${getPriorityColor(task.priorite)}">${task.priorite.toUpperCase()}</span>
      </div>

      <div class="flex gap-2">
        <button onclick="viewTask('${task._id}')" class="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg transition">
          Voir détails
        </button>
        <button onclick="deleteTask('${task._id}')" class="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg transition">
          🗑️
        </button>
      </div>
    </div>
  `;
}

// Appliquer les filtres
function applyFilters() {
  console.log('Application des filtres...');
  // TODO: Implémenter la logique de filtrage
}

// Voir les détails d'une tâche
function viewTask(taskId) {
  console.log(`Voir détails de la tâche: ${taskId}`);
  // TODO: Implémenter l'affichage des détails
}

// Supprimer une tâche
async function deleteTask(taskId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
    return;
  }

  console.log(`Suppression de la tâche: ${taskId}`);
  // TODO: Implémenter la suppression
}

// Utilitaires
function getStatusClass(statut) {
  const statusMap = {
    'à faire': 'status-todo',
    'en cours': 'status-progress',
    'terminée': 'status-done',
    'annulée': 'status-cancelled'
  };
  return statusMap[statut] || 'status-todo';
}

function getStatusLabel(statut) {
  const labelMap = {
    'à faire': 'À faire',
    'en cours': 'En cours',
    'terminée': 'Terminée',
    'annulée': 'Annulée'
  };
  return labelMap[statut] || statut;
}

function getPriorityColor(priorite) {
  const colorMap = {
    'basse': 'text-green-600',
    'moyenne': 'text-amber-600',
    'haute': 'text-red-600',
    'critique': 'text-red-700'
  };
  return colorMap[priorite] || 'text-gray-600';
}

function formatDate(dateString) {
  if (!dateString) return 'Pas de date';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function showError(message) {
  const tasksList = document.getElementById('tasksList');
  tasksList.innerHTML = `
    <div class="text-center py-12 col-span-full">
      <p class="text-red-500 text-lg">❌ ${message}</p>
    </div>
  `;
}
