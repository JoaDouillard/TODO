// ========================================
// PAGE DE VISUALISATION D'UNE TÂCHE
// ========================================

let currentTask = null;

// Charger la page de visualisation
async function loadViewPage(taskId) {
  currentTaskId = taskId;

  try {
    const response = await fetchWithAuth(`${API_URL}/${taskId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error('Tâche non trouvée');
    }

    currentTask = data.data;
    renderViewPage(currentTask);
  } catch (error) {
    console.error('Erreur:', error);
    $('app').innerHTML = `
      <div class="max-w-2xl mx-auto text-center py-12">
        <p class="text-red-500 text-xl mb-4">❌ Tâche introuvable</p>
        <p class="text-gray-600 mb-6">${escapeHTML(error.message)}</p>
        <button
          onclick="navigate('/')"
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
        >
          Retour à l'accueil
        </button>
      </div>
    `;
  }
}

// Afficher la page de visualisation
function renderViewPage(task) {
  const appContainer = $('app');

  appContainer.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- En-tête -->
        <div class="flex justify-between items-start mb-6">
          <h2 class="text-3xl font-bold text-gray-800">
            📋 ${escapeHTML(task.titre)}
          </h2>
          <div class="flex items-center gap-4">
            <span class="${task.visibilite === 'publique' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} text-xs px-3 py-1.5 rounded-full font-semibold border-2 shadow-sm">
              ${task.visibilite === 'publique' ? '🌍 Publique' : '🔒 Privée'}
            </span>
            <button
              onclick="navigate('/')"
              class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Description -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 class="font-semibold text-gray-700 mb-2">Description</h4>
          <p class="text-gray-600">
            ${escapeHTML(task.description) || 'Aucune description'}
          </p>
        </div>

        <!-- Informations principales -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <span class="text-sm text-gray-500 block mb-2">Statut</span>
            <span class="${getStatusClass(task.statut)} ${getStatusBorderClass(task.statut)} px-3 py-1.5 rounded-full text-sm font-semibold border-2 shadow-sm inline-block">
              ${getStatusLabel(task.statut)}
            </span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block mb-2">Priorité</span>
            <span class="${getPriorityBgClass(task.priorite)} ${getPriorityTextClass(task.priorite)} ${getPriorityBorderClass(task.priorite)} px-3 py-1.5 rounded-full text-sm font-bold border-2 shadow-sm inline-block">
              ${task.priorite.toUpperCase()}
            </span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block mb-2">Catégorie</span>
            <span class="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-semibold">
              📁 ${escapeHTML(task.categorie) || 'Aucune'}
            </span>
          </div>
          <div>
            <span class="text-sm text-gray-500 block mb-2">Échéance</span>
            <p class="font-semibold text-gray-800">📅 ${formatDate(task.echeance)}</p>
          </div>
        </div>

        <!-- Date de création -->
        <div class="mb-6">
          <span class="text-sm text-gray-500">Créée le</span>
          <p class="text-gray-600 font-medium">🕐 ${formatDate(task.dateCreation)}</p>
        </div>

        <!-- Étiquettes -->
        ${task.etiquettes && task.etiquettes.length > 0 ? `
          <div class="mb-6">
            <span class="text-sm text-gray-500 block mb-2">Étiquettes</span>
            <div class="flex flex-wrap gap-2">
              ${task.etiquettes.map(tag => `
                <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  ${escapeHTML(tag)}
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Auteur -->
        <div class="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 class="font-semibold text-blue-800 mb-2">Auteur</h4>
          <p class="text-blue-700 font-medium">
            ${escapeHTML(task.auteur.prenom)} ${escapeHTML(task.auteur.nom)}
          </p>
          <p class="text-blue-600 text-sm">${escapeHTML(task.auteur.email)}</p>
        </div>

        <!-- Sous-tâches -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-3">
            <h4 class="font-semibold text-gray-800">
              Sous-tâches (<span id="subtasksCount">${task.sousTaches ? task.sousTaches.length : 0}</span>)
            </h4>
            <button
              onclick="showAddSubtaskModal()"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
            >
              + Ajouter
            </button>
          </div>

          <div id="subtasksList" class="space-y-2">
            ${renderSubtasks(task.sousTaches || [])}
          </div>
        </div>

        <!-- Commentaires -->
        ${task.commentaires && task.commentaires.length > 0 ? `
          <div class="mb-6">
            <h4 class="font-semibold text-gray-800 mb-3">
              Commentaires (${task.commentaires.length})
            </h4>
            <div class="space-y-3">
              ${task.commentaires.map(comment => `
                <div class="bg-gray-50 rounded-lg p-4">
                  <div class="flex justify-between items-start mb-2">
                    <span class="font-medium text-gray-800">
                      ${escapeHTML(comment.auteur.prenom)} ${escapeHTML(comment.auteur.nom)}
                    </span>
                    <span class="text-xs text-gray-500">
                      ${formatDate(comment.date)}
                    </span>
                  </div>
                  <p class="text-gray-600">${escapeHTML(comment.contenu)}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Boutons d'action -->
        <div class="flex gap-4 pt-4 border-t">
          <button
            onclick="navigate('/edit/${task._id}')"
            class="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            ✏️ Modifier
          </button>
          <button
            onclick="deleteTaskAndRedirect('${task._id}')"
            class="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            🗑️ Supprimer
          </button>
          <button
            onclick="navigate('/')"
            class="px-8 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    </div>

    <!-- Modal pour ajouter une sous-tâche -->
    <div id="addSubtaskModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4">Ajouter une sous-tâche</h3>
        <form id="addSubtaskForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Titre <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subtaskTitre"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Titre de la sous-tâche"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Échéance
            </label>
            <input
              type="date"
              id="subtaskEcheance"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
          </div>
          <div class="flex gap-3">
            <button
              type="submit"
              class="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
            >
              Ajouter
            </button>
            <button
              type="button"
              onclick="hideAddSubtaskModal()"
              class="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

// Afficher les sous-tâches
function renderSubtasks(subtasks) {
  if (!subtasks || subtasks.length === 0) {
    return '<p class="text-gray-500 text-sm py-4">Aucune sous-tâche</p>';
  }

  return subtasks.map((subtask, index) => {
    const isCompleted = subtask.statut === 'terminée';

    return `
      <div class="flex items-center gap-3 bg-gray-50 p-3 rounded-lg group hover:bg-gray-100 transition-colors">
        <!-- Checkbox -->
        <button
          onclick="toggleSubtask(${index})"
          class="flex-shrink-0 w-6 h-6 rounded border-2 ${
            isCompleted
              ? 'bg-green-500 border-green-500'
              : 'border-gray-400 hover:border-green-500'
          } flex items-center justify-center transition-all"
        >
          ${isCompleted ? '<span class="text-white text-sm">✓</span>' : ''}
        </button>

        <!-- Titre -->
        <span class="flex-1 ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}">
          ${escapeHTML(subtask.titre)}
        </span>

        <!-- Date -->
        <span class="text-xs text-gray-500">
          ${formatDate(subtask.echeance)}
        </span>

        <!-- Bouton supprimer (visible au survol si terminée) -->
        ${isCompleted ? `
          <button
            onclick="deleteSubtask(${index})"
            class="flex-shrink-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 font-bold transition-opacity"
            title="Supprimer"
          >
            🗑️
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Afficher le modal d'ajout de sous-tâche
function showAddSubtaskModal() {
  $('addSubtaskModal').classList.remove('hidden');
  $('subtaskTitre').value = '';
  $('subtaskEcheance').value = '';

  // Attacher l'événement de soumission
  $('addSubtaskForm').onsubmit = handleAddSubtask;
}

// Masquer le modal
function hideAddSubtaskModal() {
  $('addSubtaskModal').classList.add('hidden');
}

// Ajouter une sous-tâche
async function handleAddSubtask(event) {
  event.preventDefault();

  const newSubtaskTitre = $('subtaskTitre').value.trim();

  // Vérifier si une sous-tâche avec le même titre existe déjà
  if (!currentTask.sousTaches) {
    currentTask.sousTaches = [];
  }

  const existeDeja = currentTask.sousTaches.some(st => st.titre.toLowerCase() === newSubtaskTitre.toLowerCase());
  if (existeDeja) {
    showNotification('Une sous-tâche avec ce titre existe déjà', 'error');
    return;
  }

  const newSubtask = {
    titre: newSubtaskTitre,
    statut: 'à faire'
  };

  const echeanceValue = $('subtaskEcheance').value;
  if (echeanceValue) {
    newSubtask.echeance = new Date(echeanceValue).toISOString();
  }

  // Ajouter la sous-tâche au tableau
  currentTask.sousTaches.push(newSubtask);

  // Mettre à jour la tâche sur le serveur
  await updateTask();
  hideAddSubtaskModal();
}

// Basculer l'état d'une sous-tâche (terminée / à faire)
async function toggleSubtask(index) {
  if (!currentTask.sousTaches || !currentTask.sousTaches[index]) {
    return;
  }

  const subtask = currentTask.sousTaches[index];
  subtask.statut = subtask.statut === 'terminée' ? 'à faire' : 'terminée';

  await updateTask();
}

// Supprimer une sous-tâche (uniquement si terminée)
async function deleteSubtask(index) {
  if (!currentTask.sousTaches || !currentTask.sousTaches[index]) {
    return;
  }

  if (!confirm('Supprimer cette sous-tâche ?')) {
    return;
  }

  currentTask.sousTaches.splice(index, 1);
  await updateTask();
}

// Mettre à jour la tâche sur le serveur
async function updateTask() {
  try {
    const response = await fetchWithAuth(`${API_URL}/${currentTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(currentTask)
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour');
    }

    const data = await response.json();
    currentTask = data.data;

    // Rafraîchir l'affichage des sous-tâches
    $('subtasksList').innerHTML = renderSubtasks(currentTask.sousTaches || []);

    // Mettre à jour le compteur de sous-tâches
    const countElement = $('subtasksCount');
    if (countElement) {
      countElement.textContent = currentTask.sousTaches ? currentTask.sousTaches.length : 0;
    }

    showNotification('Mis à jour avec succès', 'success');
  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}

// Supprimer la tâche et rediriger
async function deleteTaskAndRedirect(taskId) {
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
    navigate('/');
  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}
