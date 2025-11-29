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
  const currentUser = getCurrentUser();
  const taskIsOwned = currentUser && task.proprietaire && (task.proprietaire._id === currentUser._id || task.proprietaire === currentUser._id);

  appContainer.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Colonne gauche : Détails de la tâche (3/5) -->
        <div class="lg:col-span-3 bg-white rounded-lg shadow-lg p-8">
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
              onclick="window.history.back()"
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
            ${taskIsOwned ? `
              <button
                onclick="showAddSubtaskModal()"
                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                + Ajouter
              </button>
            ` : ''}
          </div>

          <div id="subtasksList" class="space-y-2">
            ${renderSubtasks(task.sousTaches || [])}
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="flex gap-4 pt-4 border-t">
          ${taskIsOwned ? `
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
          ` : ''}
          <button
            onclick="window.history.back()"
            class="${taskIsOwned ? 'px-8' : 'flex-1'} bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
          >
            Retour
          </button>
        </div>
        </div>
        <!-- Fin colonne gauche : Détails de la tâche -->

        <!-- Colonne droite : Commentaires (2/5) -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow-lg p-6 sticky top-4" style="max-height: calc(100vh - 2rem);">
            <h4 class="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              💬 Commentaires (<span id="commentsCount">${task.commentaires ? task.commentaires.filter(c => !c.estSupprime).length : 0}</span>)
            </h4>

            <!-- Formulaire d'ajout de commentaire -->
            ${task.visibilite === 'publique' || taskIsOwned ? `
              <div class="mb-4">
                <textarea
                  id="commentInput"
                  placeholder="Ajouter un commentaire..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                  rows="5"
                  maxlength="1000"
                ></textarea>
                <div class="flex justify-between items-center mt-2">
                  <span class="text-xs text-gray-500">
                    <span id="commentLength">0</span>/1000
                  </span>
                  <button
                    onclick="addComment()"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-semibold transition-colors"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            ` : ''}

            <!-- Liste des commentaires avec hauteur fixe et scroll -->
            <div id="commentsList" class="space-y-3" style="max-height: 400px; overflow-y: auto;">
              ${renderComments(task.commentaires || [], task)}
            </div>
          </div>
        </div>
        <!-- Fin colonne droite -->
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

  // Attacher l'event listener pour le compteur de caractères après le rendu
  const commentInput = $('commentInput');
  if (commentInput) {
    commentInput.addEventListener('input', () => {
      const length = commentInput.value.length;
      const counter = $('commentLength');
      if (counter) {
        counter.textContent = length;
      }
    });
  }
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
  // Vérifier si l'utilisateur est connecté
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showNotification('Connectez-vous pour ajouter des sous-tâches', 'error');
    return;
  }

  // Vérifier que l'utilisateur est propriétaire
  const taskIsOwned = currentUser && currentTask.proprietaire &&
    (currentTask.proprietaire._id === currentUser._id || currentTask.proprietaire === currentUser._id);

  if (!taskIsOwned) {
    showNotification('Vous n\'avez pas les droits pour modifier cette tâche', 'error');
    return;
  }

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
  // Vérifier si l'utilisateur est connecté
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showNotification('Connectez-vous pour modifier les sous-tâches', 'error');
    return;
  }

  // Vérifier que l'utilisateur est propriétaire
  const taskIsOwned = currentUser && currentTask.proprietaire &&
    (currentTask.proprietaire._id === currentUser._id || currentTask.proprietaire === currentUser._id);

  if (!taskIsOwned) {
    showNotification('Vous n\'avez pas les droits pour modifier cette tâche', 'error');
    return;
  }

  if (!currentTask.sousTaches || !currentTask.sousTaches[index]) {
    return;
  }

  const subtask = currentTask.sousTaches[index];
  subtask.statut = subtask.statut === 'terminée' ? 'à faire' : 'terminée';

  await updateTask();
}

// Supprimer une sous-tâche (uniquement si terminée)
async function deleteSubtask(index) {
  // Vérifier si l'utilisateur est connecté
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showNotification('Connectez-vous pour supprimer les sous-tâches', 'error');
    return;
  }

  // Vérifier que l'utilisateur est propriétaire
  const taskIsOwned = currentUser && currentTask.proprietaire &&
    (currentTask.proprietaire._id === currentUser._id || currentTask.proprietaire === currentUser._id);

  if (!taskIsOwned) {
    showNotification('Vous n\'avez pas les droits pour modifier cette tâche', 'error');
    return;
  }

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

// ========================================
// GESTION DES COMMENTAIRES
// ========================================

// Vérifier si l'utilisateur est propriétaire
function isOwner(task) {
  const user = getCurrentUser();
  if (!user || !task.proprietaire) return false;
  return task.proprietaire._id === user._id || task.proprietaire === user._id;
}

// Afficher les commentaires
function renderComments(comments, task) {
  if (!comments || comments.length === 0) {
    return '<p class="text-gray-500 text-sm py-4 text-center">Aucun commentaire</p>';
  }

  const currentUser = getCurrentUser();

  // Séparer les commentaires supprimés des commentaires actifs
  const activeComments = comments.filter(c => !c.estSupprime);
  const deletedComments = comments.filter(c => c.estSupprime);

  // Trier uniquement les commentaires actifs par score
  const sortedActiveComments = [...activeComments].sort((a, b) => {
    const scoreA = (a.votesPositifs?.length || 0) - (a.votesNegatifs?.length || 0);
    const scoreB = (b.votesPositifs?.length || 0) - (b.votesNegatifs?.length || 0);
    return scoreB - scoreA; // Tri décroissant (meilleur score en haut)
  });

  // Recombiner : commentaires actifs triés + commentaires supprimés à la fin
  const sortedComments = [...sortedActiveComments, ...deletedComments];

  return sortedComments.map(comment => {
    // Si le commentaire est supprimé
    if (comment.estSupprime) {
      const suppressionText = comment.suppressionParNom
        ? `Commentaire supprimé par @${escapeHTML(comment.suppressionParNom)}`
        : 'Commentaire supprimé';
      return `
        <div class="bg-gray-100 rounded-lg p-4 border border-gray-200">
          <p class="text-gray-500 italic text-sm">
            [${suppressionText}]
          </p>
        </div>
      `;
    }

    const isAuthor = currentUser && comment.auteur === currentUser._id;
    const isAdmin = currentUser && currentUser.role === 'admin';

    // Calculer le score et vérifier si l'utilisateur a voté
    const score = (comment.votesPositifs?.length || 0) - (comment.votesNegatifs?.length || 0);
    const userVotedUp = currentUser && comment.votesPositifs?.some(id => id === currentUser._id);
    const userVotedDown = currentUser && comment.votesNegatifs?.some(id => id === currentUser._id);

    return `
      <div class="bg-gray-50 rounded-lg p-4 border border-gray-200" style="word-wrap: break-word; overflow-wrap: break-word;">
        <div class="flex justify-between items-start mb-2">
          <div>
            <span class="font-medium text-gray-800">
              @${escapeHTML(comment.auteurNom)}
            </span>
            ${comment.estModifie ? '<span class="text-xs text-gray-500 ml-2">(modifié)</span>' : ''}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500">
              ${formatDate(comment.dateCreation)}
            </span>
          </div>
        </div>

        <!-- Système de votes -->
        ${currentUser ? `
          <div class="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200">
            <button
              onclick="voteComment('${comment._id}', 'up')"
              class="flex items-center gap-1 px-2 py-1 rounded ${userVotedUp ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-green-50'} text-sm transition-colors"
            >
              👍 <span class="font-medium">${comment.votesPositifs?.length || 0}</span>
            </button>
            <button
              onclick="voteComment('${comment._id}', 'down')"
              class="flex items-center gap-1 px-2 py-1 rounded ${userVotedDown ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600 hover:bg-red-50'} text-sm transition-colors"
            >
              👎 <span class="font-medium">${comment.votesNegatifs?.length || 0}</span>
            </button>
            <div class="flex-1 text-center">
              <span class="text-sm font-bold ${score > 0 ? 'text-green-600' : score < 0 ? 'text-red-600' : 'text-gray-600'}">
                Score: ${score > 0 ? '+' : ''}${score}
              </span>
            </div>
          </div>
        ` : ''}

        <!-- Contenu du commentaire -->
        <div id="comment-content-${comment._id}">
          ${comment.contenu.length > 100 ? `
            <div id="comment-short-${comment._id}" class="text-gray-700" style="max-height: 3em; overflow: hidden; word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; line-height: 1.5em; margin: 0; padding: 0;">${escapeHTML(comment.contenu)}</div>
            <div id="comment-full-${comment._id}" class="hidden text-gray-700" style="word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; margin: 0; padding: 0;">${escapeHTML(comment.contenu)}</div>
          ` : `
            <div class="text-gray-700" style="word-wrap: break-word; overflow-wrap: break-word; white-space: pre-wrap; margin: 0; padding: 0;">${escapeHTML(comment.contenu)}</div>
          `}
        </div>

        <!-- Formulaire d'édition (caché par défaut) -->
        <div id="comment-edit-${comment._id}" class="hidden mb-2">
          <textarea
            id="comment-edit-input-${comment._id}"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            rows="3"
            maxlength="1000"
            oninput="updateEditCharCount('${comment._id}')"
          >${escapeHTML(comment.contenu)}</textarea>
          <div class="flex justify-between items-center mt-2">
            <span class="text-xs text-gray-500">
              <span id="comment-edit-length-${comment._id}">${comment.contenu.length}</span>/1000
            </span>
            <div class="flex gap-2">
              <button
                onclick="saveEditComment('${comment._id}')"
                class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              >
                Enregistrer
              </button>
              <button
                onclick="cancelEditComment('${comment._id}')"
                class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-3 py-1 rounded text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="flex justify-end gap-2 mt-2">
          ${comment.contenu.length > 100 ? `
            <button
              onclick="toggleCommentExpand('${comment._id}')"
              id="comment-toggle-${comment._id}"
              class="text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              Voir plus
            </button>
          ` : ''}
          ${isAuthor || isAdmin ? `
            ${isAuthor ? `
              <button
                onclick="editComment('${comment._id}')"
                class="text-blue-600 hover:text-blue-700 text-xs font-medium"
              >
                ✏️ Modifier
              </button>
            ` : ''}
            <button
              onclick="deleteComment('${comment._id}')"
              class="text-red-600 hover:text-red-700 text-xs font-medium"
            >
              🗑️ Supprimer
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Ajouter un commentaire
async function addComment() {
  // Vérifier si l'utilisateur est connecté
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showNotification('Connectez-vous pour ajouter un commentaire', 'error');
    return;
  }

  const input = $('commentInput');
  const contenu = input.value.trim();

  if (!contenu) {
    showNotification('Le commentaire ne peut pas être vide', 'error');
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/${currentTaskId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contenu })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de l\'ajout du commentaire');
    }

    // Recharger la tâche pour afficher le nouveau commentaire
    await loadViewPage(currentTaskId);
    showNotification('Commentaire ajouté avec succès', 'success');

  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}

// Éditer un commentaire (afficher le formulaire)
function editComment(commentId) {
  $(`comment-content-${commentId}`).classList.add('hidden');
  $(`comment-edit-${commentId}`).classList.remove('hidden');
}

// Annuler l'édition
function cancelEditComment(commentId) {
  $(`comment-content-${commentId}`).classList.remove('hidden');
  $(`comment-edit-${commentId}`).classList.add('hidden');
}

// Sauvegarder l'édition du commentaire
async function saveEditComment(commentId) {
  const input = $(`comment-edit-input-${commentId}`);
  const contenu = input.value.trim();

  if (!contenu) {
    showNotification('Le commentaire ne peut pas être vide', 'error');
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/${currentTaskId}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contenu })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la modification');
    }

    // Recharger la tâche
    await loadViewPage(currentTaskId);
    showNotification('Commentaire modifié avec succès', 'success');

  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}

// Supprimer un commentaire
async function deleteComment(commentId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce commentaire ?')) {
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/${currentTaskId}/comments/${commentId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors de la suppression');
    }

    // Recharger la tâche
    await loadViewPage(currentTaskId);
    showNotification('Commentaire supprimé avec succès', 'success');

  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}

// Voter sur un commentaire
async function voteComment(commentId, type) {
  // Vérifier si l'utilisateur est connecté
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showNotification('Connectez-vous pour voter sur les commentaires', 'error');
    return;
  }

  try {
    const response = await fetchWithAuth(`${API_URL}/${currentTaskId}/comments/${commentId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ type })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erreur lors du vote');
    }

    // Recharger la tâche pour mettre à jour les votes
    await loadViewPage(currentTaskId);

  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}

// Toggle expand/collapse comment
function toggleCommentExpand(commentId) {
  const shortText = $(`comment-short-${commentId}`);
  const fullText = $(`comment-full-${commentId}`);
  const toggleBtn = $(`comment-toggle-${commentId}`);

  if (shortText.classList.contains('hidden')) {
    // Actuellement étendu, réduire
    shortText.classList.remove('hidden');
    fullText.classList.add('hidden');
    toggleBtn.textContent = 'Voir plus';
  } else {
    // Actuellement réduit, étendre
    shortText.classList.add('hidden');
    fullText.classList.remove('hidden');
    toggleBtn.textContent = 'Voir moins';
  }
}

// Mettre à jour le compteur de caractères pendant l'édition
function updateEditCharCount(commentId) {
  const input = $(`comment-edit-input-${commentId}`);
  const counter = $(`comment-edit-length-${commentId}`);
  if (input && counter) {
    counter.textContent = input.value.length;
  }
}

