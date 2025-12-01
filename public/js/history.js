// Page d'historique des modifications d'une tâche
async function historyPage(taskId) {
  const user = getCurrentUser();

  if (!user) {
    showNotification('Vous devez être connecté pour voir cette page.', 'error');
    navigate('/login');
    return;
  }

  const mainContent = $('app');
  if (!mainContent) return;

  // Afficher un loader
  mainContent.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <div class="text-center py-12">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">Chargement de l'historique...</p>
      </div>
    </div>
  `;

  try {
    // Récupérer la tâche
    const response = await fetchWithAuth(`/api/tasks/${taskId}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors du chargement de la tâche');
    }

    const task = result.data;

    // Vérifier que l'utilisateur est le propriétaire
    if (task.proprietaire._id !== user._id && task.proprietaire !== user._id) {
      showNotification('Vous n\'êtes pas autorisé à voir cet historique.', 'error');
      navigate(`/task/${taskId}`);
      return;
    }

    // Afficher la page d'historique
    mainContent.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-3xl font-bold text-gray-900">📜 Historique des modifications</h1>
            <button
              onclick="navigate('/task/${task._id}')"
              class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← Retour à la tâche
            </button>
          </div>
          <div class="border-t pt-4">
            <h2 class="text-xl font-semibold text-gray-800">${escapeHTML(task.titre)}</h2>
            <p class="text-sm text-gray-500 mt-1">
              Créée le ${formatDate(task.dateCreation)}
            </p>
          </div>
        </div>

        ${task.historiqueModifications && task.historiqueModifications.length > 0 ? `
          <div class="bg-white rounded-lg shadow-lg p-6">
            <h3 class="text-lg font-bold text-gray-800 mb-4">
              ${task.historiqueModifications.length} modification${task.historiqueModifications.length > 1 ? 's' : ''}
            </h3>
            <div class="space-y-4">
              ${task.historiqueModifications.slice().reverse().map((h, index) => `
                <div class="border-l-4 border-blue-500 pl-6 py-4 bg-gray-50 rounded-r relative ml-8">
                  <div class="absolute -left-8 top-4 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    ${index + 1}
                  </div>

                  <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-gray-900 text-base">
                      ${getChampLabel(h.champModifie)}
                    </h4>
                    <span class="text-sm text-gray-600 font-medium mr-4">
                      ${new Date(h.date).toLocaleString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 mr-4">
                    <div class="bg-red-50 border border-red-200 rounded p-3">
                      <p class="text-xs text-red-700 font-semibold mb-1">Ancienne valeur</p>
                      <p class="text-sm text-gray-800">${formatHistoriqueValue(h.champModifie, h.ancienneValeur)}</p>
                    </div>
                    <div class="bg-green-50 border border-green-200 rounded p-3">
                      <p class="text-xs text-green-700 font-semibold mb-1">Nouvelle valeur</p>
                      <p class="text-sm text-gray-800 font-medium">${formatHistoriqueValue(h.champModifie, h.nouvelleValeur)}</p>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="bg-white rounded-lg shadow-lg p-12 text-center">
            <p class="text-gray-500 text-lg">Aucune modification enregistrée pour cette tâche.</p>
          </div>
        `}
      </div>
    `;

  } catch (error) {
    console.error('Erreur historyPage:', error);
    showNotification(error.message, 'error');
    mainContent.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-lg p-12 text-center">
          <p class="text-red-600 text-lg mb-4">Erreur lors du chargement de l'historique</p>
          <button
            onclick="window.history.back()"
            class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    `;
  }
}

function getChampLabel(champ) {
  const labels = {
    'titre': 'Titre',
    'description': 'Description',
    'statut': 'Statut',
    'priorite': 'Priorité',
    'echeance': 'Échéance',
    'visibilite': 'Visibilité',
    'categorie': 'Catégorie',
    'etiquettes': 'Étiquettes',
    'sousTaches': 'Sous-tâches'
  };
  return labels[champ] || champ;
}

function formatHistoriqueValue(champ, value) {
  if (value === null || value === undefined || value === '') {
    return '<em class="text-gray-400">Vide</em>';
  }

  switch (champ) {
    case 'echeance':
      return new Date(value).toLocaleDateString('fr-FR');
    case 'statut':
      const statusLabels = {
        'à faire': 'À faire',
        'en cours': 'En cours',
        'terminée': 'Terminée',
        'annulée': 'Annulée'
      };
      return statusLabels[value] || value;
    case 'priorite':
      const prioLabels = {
        'basse': 'Basse',
        'moyenne': 'Moyenne',
        'haute': 'Haute',
        'critique': 'Critique'
      };
      return prioLabels[value] || value;
    case 'visibilite':
      return value === 'publique' ? 'Publique' : 'Privée';
    case 'etiquettes':
      if (Array.isArray(value)) {
        return value.length > 0 ? value.map(tag => `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${escapeHTML(tag)}</span>`).join(' ') : '<em class="text-gray-400">Aucune</em>';
      }
      return escapeHTML(String(value));
    case 'sousTaches':
      // Le HTML est déjà sécurisé côté serveur
      return String(value);
    default:
      return escapeHTML(String(value));
  }
}
