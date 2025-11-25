// ========================================
// PAGE DE MODIFICATION D'UNE TÂCHE
// ========================================

let editingTask = null;
let allCategoriesEdit = [];

// Charger la page de modification
async function loadEditPage(taskId) {
  currentTaskId = taskId;

  try {
    const response = await fetch(`${API_URL}/${taskId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error('Tâche non trouvée');
    }

    editingTask = data.data;
    renderEditPage(editingTask);
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

// Afficher la page de modification
async function renderEditPage(task) {
  const appContainer = $('app');

  // Formater la date pour l'input type="date"
  let echeanceValue = '';
  if (task.echeance) {
    const date = new Date(task.echeance);
    echeanceValue = date.toISOString().split('T')[0];
  }

  appContainer.innerHTML = `
    <div class="max-w-3xl mx-auto">
      <div class="bg-white rounded-lg shadow-lg p-8">
        <!-- En-tête -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-3xl font-bold text-gray-800">✏️ Modifier la tâche</h2>
          <button
            onclick="navigate('/task/${task._id}')"
            class="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <!-- Formulaire -->
        <form id="editTaskForm" class="space-y-6">
          <!-- Titre -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Titre <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="titre"
              required
              value="${escapeHTML(task.titre)}"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              rows="4"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >${escapeHTML(task.description) || ''}</textarea>
          </div>

          <!-- Statut et Priorité -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Statut -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Statut <span class="text-red-500">*</span>
              </label>
              <select
                id="statut"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="à faire" ${task.statut === 'à faire' ? 'selected' : ''}>À faire</option>
                <option value="en cours" ${task.statut === 'en cours' ? 'selected' : ''}>En cours</option>
                <option value="terminée" ${task.statut === 'terminée' ? 'selected' : ''}>Terminée</option>
                <option value="annulée" ${task.statut === 'annulée' ? 'selected' : ''}>Annulée</option>
              </select>
            </div>

            <!-- Priorité -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Priorité <span class="text-red-500">*</span>
              </label>
              <select
                id="priorite"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="basse" ${task.priorite === 'basse' ? 'selected' : ''}>Basse</option>
                <option value="moyenne" ${task.priorite === 'moyenne' ? 'selected' : ''}>Moyenne</option>
                <option value="haute" ${task.priorite === 'haute' ? 'selected' : ''}>Haute</option>
                <option value="critique" ${task.priorite === 'critique' ? 'selected' : ''}>Critique</option>
              </select>
            </div>
          </div>

          <!-- Catégorie -->
          <div class="relative">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <input
              type="text"
              id="categorie"
              autocomplete="off"
              value="${escapeHTML(task.categorie) || ''}"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Travail, Personnel..."
            >
            <div id="categoriesSuggestionsEdit" class="hidden absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto"></div>
          </div>

          <!-- Échéance -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Échéance
            </label>
            <input
              type="date"
              id="echeance"
              value="${echeanceValue}"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <!-- Étiquettes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Étiquettes (séparées par /)
            </label>
            <input
              type="text"
              id="etiquettes"
              value="${task.etiquettes ? task.etiquettes.join(' / ') : ''}"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="urgent / important / réunion..."
            >
          </div>

          <!-- Sous-tâches -->
          <div class="border-t pt-6">
            <div class="flex justify-between items-center mb-3">
              <h4 class="font-semibold text-gray-800">
                Sous-tâches (${task.sousTaches ? task.sousTaches.length : 0})
              </h4>
              <button
                type="button"
                onclick="showAddSubtaskModalEdit()"
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                + Ajouter
              </button>
            </div>

            <div id="subtasksListEdit" class="space-y-2 mb-4">
              ${renderSubtasksEdit(task.sousTaches || [])}
            </div>
          </div>

          <!-- Boutons -->
          <div class="flex gap-4 pt-4">
            <button
              type="submit"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold text-lg transition-colors"
            >
              ✓ Enregistrer les modifications
            </button>
            <button
              type="button"
              onclick="navigate('/task/${task._id}')"
              class="px-8 bg-gray-300 hover:bg-gray-400 text-gray-700 py-4 rounded-lg font-semibold transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal pour ajouter une sous-tâche -->
    <div id="addSubtaskModalEdit" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4">Ajouter une sous-tâche</h3>
        <form id="addSubtaskFormEdit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Titre <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subtaskTitreEdit"
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
              id="subtaskEcheanceEdit"
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
              onclick="hideAddSubtaskModalEdit()"
              class="px-6 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded-lg font-semibold"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Charger les catégories
  await loadCategoriesEdit();

  // Attacher les événements
  $('editTaskForm').addEventListener('submit', handleEditTask);
  $('categorie').addEventListener('input', handleCategorieInputEdit);
  $('categorie').addEventListener('focus', handleCategorieInputEdit);

  // Fermer les suggestions si on clique ailleurs
  document.addEventListener('click', (e) => {
    if (e.target.id !== 'categorie') {
      hideCategoriesSuggestionsEdit();
    }
  });
}

// Charger les catégories depuis l'API
async function loadCategoriesEdit() {
  try {
    const response = await fetch('http://localhost:3000/api/categories');
    const data = await response.json();

    if (data.success) {
      allCategoriesEdit = data.data.map(cat => cat.nom);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des catégories:', error);
  }
}

// Gérer l'input de la catégorie (autocomplétion)
function handleCategorieInputEdit(event) {
  const value = event.target.value.trim().toLowerCase();
  const suggestions = $('categoriesSuggestionsEdit');

  if (!value) {
    // Afficher toutes les catégories si le champ est vide
    if (allCategoriesEdit.length > 0) {
      displayCategoriesSuggestionsEdit(allCategoriesEdit);
    } else {
      hideCategoriesSuggestionsEdit();
    }
    return;
  }

  // Filtrer les catégories - cherche si la chaîne contient la valeur tapée
  const filtered = allCategoriesEdit.filter(cat => cat.toLowerCase().includes(value));

  if (filtered.length > 0) {
    displayCategoriesSuggestionsEdit(filtered);
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
function displayCategoriesSuggestionsEdit(categories) {
  const suggestions = $('categoriesSuggestionsEdit');

  suggestions.innerHTML = categories.map(cat => `
    <div
      class="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm"
      onclick="selectCategorieEdit('${escapeHTML(cat)}')"
    >
      📁 ${escapeHTML(cat)}
    </div>
  `).join('');

  suggestions.classList.remove('hidden');
}

// Sélectionner une catégorie
function selectCategorieEdit(categorie) {
  $('categorie').value = categorie;
  hideCategoriesSuggestionsEdit();
}

// Masquer les suggestions
function hideCategoriesSuggestionsEdit() {
  const suggestions = $('categoriesSuggestionsEdit');
  if (suggestions) {
    suggestions.classList.add('hidden');
  }
}

// Afficher les sous-tâches en mode édition
function renderSubtasksEdit(subtasks) {
  if (!subtasks || subtasks.length === 0) {
    return '<p class="text-gray-500 text-sm py-4">Aucune sous-tâche</p>';
  }

  return subtasks.map((subtask, index) => {
    const isCompleted = subtask.statut === 'terminée';

    return `
      <div class="flex items-center gap-3 bg-gray-50 p-3 rounded-lg group hover:bg-gray-100 transition-colors">
        <!-- Checkbox -->
        <button
          type="button"
          onclick="toggleSubtaskEdit(${index})"
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
            type="button"
            onclick="deleteSubtaskEdit(${index})"
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
function showAddSubtaskModalEdit() {
  $('addSubtaskModalEdit').classList.remove('hidden');
  $('subtaskTitreEdit').value = '';
  $('subtaskEcheanceEdit').value = '';

  // Attacher l'événement de soumission
  $('addSubtaskFormEdit').onsubmit = handleAddSubtaskEdit;
}

// Masquer le modal
function hideAddSubtaskModalEdit() {
  $('addSubtaskModalEdit').classList.add('hidden');
}

// Ajouter une sous-tâche
function handleAddSubtaskEdit(event) {
  event.preventDefault();

  const newSubtask = {
    titre: $('subtaskTitreEdit').value.trim(),
    statut: 'à faire'
  };

  const echeanceValue = $('subtaskEcheanceEdit').value;
  if (echeanceValue) {
    newSubtask.echeance = new Date(echeanceValue).toISOString();
  }

  // Ajouter la sous-tâche au tableau
  if (!editingTask.sousTaches) {
    editingTask.sousTaches = [];
  }
  editingTask.sousTaches.push(newSubtask);

  // Rafraîchir l'affichage
  $('subtasksListEdit').innerHTML = renderSubtasksEdit(editingTask.sousTaches);
  hideAddSubtaskModalEdit();
  showNotification('Sous-tâche ajoutée (pensez à enregistrer)', 'info');
}

// Basculer l'état d'une sous-tâche
function toggleSubtaskEdit(index) {
  if (!editingTask.sousTaches || !editingTask.sousTaches[index]) {
    return;
  }

  const subtask = editingTask.sousTaches[index];
  subtask.statut = subtask.statut === 'terminée' ? 'à faire' : 'terminée';

  // Rafraîchir l'affichage
  $('subtasksListEdit').innerHTML = renderSubtasksEdit(editingTask.sousTaches);
}

// Supprimer une sous-tâche
function deleteSubtaskEdit(index) {
  if (!editingTask.sousTaches || !editingTask.sousTaches[index]) {
    return;
  }

  if (!confirm('Supprimer cette sous-tâche ?')) {
    return;
  }

  editingTask.sousTaches.splice(index, 1);

  // Rafraîchir l'affichage
  $('subtasksListEdit').innerHTML = renderSubtasksEdit(editingTask.sousTaches);
}

// Gérer la soumission du formulaire de modification
async function handleEditTask(event) {
  event.preventDefault();

  // Récupérer les valeurs du formulaire
  const updatedData = {
    titre: $('titre').value.trim(),
    description: $('description').value.trim(),
    statut: $('statut').value,
    priorite: $('priorite').value,
    categorie: $('categorie').value.trim().toLowerCase(), // Normaliser en minuscules
    sousTaches: editingTask.sousTaches || []
  };

  // Ajouter l'échéance si renseignée
  const echeanceValue = $('echeance').value;
  if (echeanceValue) {
    updatedData.echeance = new Date(echeanceValue).toISOString();
  }

  // Ajouter les étiquettes si renseignées
  const etiquettesValue = $('etiquettes').value.trim();
  if (etiquettesValue) {
    updatedData.etiquettes = etiquettesValue
      .split('/')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  } else {
    updatedData.etiquettes = [];
  }

  try {
    const response = await fetch(`${API_URL}/${currentTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la modification');
    }

    showNotification('Tâche modifiée avec succès !', 'success');
    navigate(`/task/${currentTaskId}`);
  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}
