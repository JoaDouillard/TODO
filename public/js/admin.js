// Page d'administration
function adminPage() {
  const user = getCurrentUser();

  // Vérifier que l'utilisateur est admin
  if (!user || user.role !== 'admin') {
    showNotification('Accès refusé. Droits administrateur requis.', 'error');
    navigate('/');
    return;
  }

  const mainContent = $('app');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="max-w-7xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Administration</h1>
        <p class="text-gray-600">Gestion des utilisateurs</p>
      </div>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
            <input
              type="text"
              id="search-users"
              placeholder="Nom, email, username..."
              onkeyup="filterUsers()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Filtrer par rôle</label>
            <select
              id="filter-role"
              onchange="filterUsers()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="user">Utilisateur</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Trier par</label>
            <select
              id="sort-users"
              onchange="filterUsers()"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="username">Nom d'utilisateur</option>
              <option value="email">Email</option>
              <option value="role">Rôle</option>
              <option value="dateInscription">Date d'inscription</option>
            </select>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <button
          onclick="openCreateUserModal()"
          class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          + Créer un utilisateur
        </button>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div id="users-table-container">
          <div class="p-8 text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p class="mt-4 text-gray-600">Chargement des utilisateurs...</p>
          </div>
        </div>
      </div>
    </div>

    <div id="user-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 id="user-modal-title" class="text-2xl font-bold text-gray-900 mb-4">Créer un utilisateur</h2>

        <form id="user-form" onsubmit="submitUserForm(event)">
          <input type="hidden" id="user-form-id" value="">

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Nom d'utilisateur *</label>
            <input
              type="text"
              id="user-form-username"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john.doe"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <input
              type="email"
              id="user-form-email"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="john.doe@example.com"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Mot de passe <span id="password-optional" class="text-gray-500 text-xs">(optionnel)</span></label>
            <input
              type="password"
              id="user-form-password"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
            <input
              type="text"
              id="user-form-prenom"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Nom</label>
            <input
              type="text"
              id="user-form-nom"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Doe"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Rôle *</label>
            <select
              id="user-form-role"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          <div class="flex gap-3">
            <button
              type="button"
              onclick="closeUserModal()"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>

    <div id="delete-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Confirmer la suppression</h2>
        <p class="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera également toutes ses tâches.</p>

        <div class="flex gap-3">
          <button
            onclick="closeDeleteModal()"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            id="confirm-delete-btn"
            onclick="confirmDeleteUser()"
            class="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  `;

  // Charger les utilisateurs
  loadAllUsers();
}

// Variables globales
let allUsers = [];
let userToDeleteId = null;

async function loadAllUsers() {
  try {
    const token = localStorage.getItem('taskManager_token');

    if (!token) {
      showNotification('Vous devez être connecté.', 'error');
      navigate('/login');
      return;
    }

    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 403) {
        showNotification('Accès refusé. Droits administrateur requis.', 'error');
        navigate('/');
        return;
      }
      throw new Error(result.error || 'Erreur lors du chargement des utilisateurs');
    }

    allUsers = result.data;
    filterUsers();
  } catch (error) {
    console.error('Erreur loadAllUsers:', error);
    showNotification(error.message, 'error');
    const container = $('users-table-container');
    if (container) {
      container.innerHTML = `
        <div class="p-8 text-center">
          <p class="text-red-600">Erreur lors du chargement des utilisateurs</p>
        </div>
      `;
    }
  }
}

// Filtrer et afficher les utilisateurs
function filterUsers() {
  const searchTerm = $('search-users') ? $('search-users').value.toLowerCase() : '';
  const roleFilter = $('filter-role') ? $('filter-role').value : '';
  const sortBy = $('sort-users') ? $('sort-users').value : 'username';

  // Filtrer
  let filtered = allUsers.filter(user => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      (user.nom && user.nom.toLowerCase().includes(searchTerm)) ||
      (user.prenom && user.prenom.toLowerCase().includes(searchTerm));

    const matchesRole = !roleFilter || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Trier
  filtered.sort((a, b) => {
    if (sortBy === 'role') {
      // Admin avant User
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      return a.username.localeCompare(b.username);
    } else if (sortBy === 'dateInscription') {
      return new Date(b.dateInscription) - new Date(a.dateInscription);
    } else {
      return (a[sortBy] || '').localeCompare(b[sortBy] || '');
    }
  });

  displayUsersTable(filtered);
}

function displayUsersTable(users) {
  const container = $('users-table-container');
  if (!container) return;

  if (!users || users.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center">
        <p class="text-gray-600">Aucun utilisateur trouvé</p>
      </div>
    `;
    return;
  }

  const currentUser = getCurrentUser();

  container.innerHTML = `
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Utilisateur
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Email
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Rôle
          </th>
          <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Inscription
          </th>
          <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        ${users.map(user => {
          const isCurrentUser = currentUser && user._id === currentUser.userId;
          const inscriptionDate = new Date(user.dateInscription).toLocaleDateString('fr-FR');

          return `
            <tr class="${isCurrentUser ? 'bg-blue-50' : ''}">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    ${user.prenom ? user.prenom[0].toUpperCase() : user.username[0].toUpperCase()}${user.nom ? user.nom[0].toUpperCase() : ''}
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">
                      ${escapeHTML(user.username)}
                      ${isCurrentUser ? '<span class="ml-2 text-xs text-blue-600">(Vous)</span>' : ''}
                    </div>
                    ${user.prenom && user.nom ? `<div class="text-sm text-gray-500">${escapeHTML(user.prenom)} ${escapeHTML(user.nom)}</div>` : ''}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${escapeHTML(user.email)}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.role === 'admin'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }">
                  ${user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${inscriptionDate}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onclick="openEditUserModal('${user._id}')"
                  class="text-blue-600 hover:text-blue-900 mr-4"
                >
                  Modifier
                </button>
                ${!isCurrentUser ? `
                  <button
                    onclick="openDeleteModal('${user._id}')"
                    class="text-red-600 hover:text-red-900"
                  >
                    Supprimer
                  </button>
                ` : ''}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// Ouvrir le modal de création
function openCreateUserModal() {
  const modal = $('user-modal');
  const title = $('user-modal-title');
  const form = $('user-form');
  const passwordOptional = $('password-optional');

  if (!modal || !title || !form) return;

  title.textContent = 'Créer un utilisateur';
  passwordOptional.classList.add('hidden');

  // Réinitialiser le formulaire
  form.reset();
  $('user-form-id').value = '';
  $('user-form-password').required = true;

  modal.classList.remove('hidden');
}

// Ouvrir le modal de modification
async function openEditUserModal(userId) {
  const modal = $('user-modal');
  const title = $('user-modal-title');
  const passwordOptional = $('password-optional');

  if (!modal || !title) return;

  title.textContent = 'Modifier un utilisateur';
  passwordOptional.classList.remove('hidden');

  try {
    const token = localStorage.getItem('taskManager_token');
    const response = await fetch(`/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors du chargement de l\'utilisateur');
    }

    const user = result.data;

    // Remplir le formulaire
    $('user-form-id').value = user._id;
    $('user-form-username').value = user.username;
    $('user-form-email').value = user.email;
    $('user-form-password').value = '';
    $('user-form-password').required = false;
    $('user-form-prenom').value = user.prenom || '';
    $('user-form-nom').value = user.nom || '';
    $('user-form-role').value = user.role;

    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Erreur openEditUserModal:', error);
    showNotification(error.message, 'error');
  }
}

// Fermer le modal
function closeUserModal() {
  const modal = $('user-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Soumettre le formulaire
async function submitUserForm(event) {
  event.preventDefault();

  const userId = $('user-form-id').value;
  const username = $('user-form-username').value.trim();
  const email = $('user-form-email').value.trim();
  const password = $('user-form-password').value;
  const prenom = $('user-form-prenom').value.trim();
  const nom = $('user-form-nom').value.trim();
  const role = $('user-form-role').value;

  const isEdit = !!userId;

  try {
    const token = localStorage.getItem('taskManager_token');
    const body = {
      username,
      email,
      prenom,
      nom,
      role
    };

    // N'inclure le mot de passe que s'il est fourni
    if (password) {
      body.password = password;
    }

    const response = await fetch(
      isEdit ? `/api/users/${userId}` : '/api/users',
      {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || `Erreur lors de ${isEdit ? 'la modification' : 'la création'} de l'utilisateur`);
    }

    showNotification(result.message || `Utilisateur ${isEdit ? 'modifié' : 'créé'} avec succès`, 'success');
    closeUserModal();
    loadAllUsers();
  } catch (error) {
    console.error('Erreur submitUserForm:', error);
    showNotification(error.message, 'error');
  }
}

// Ouvrir le modal de suppression
function openDeleteModal(userId) {
  userToDeleteId = userId;
  const modal = $('delete-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

// Fermer le modal de suppression
function closeDeleteModal() {
  userToDeleteId = null;
  const modal = $('delete-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Confirmer la suppression
async function confirmDeleteUser() {
  if (!userToDeleteId) return;

  try {
    const token = localStorage.getItem('taskManager_token');
    const response = await fetch(`/api/users/${userToDeleteId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de la suppression de l\'utilisateur');
    }

    showNotification(result.message || 'Utilisateur supprimé avec succès', 'success');
    closeDeleteModal();
    loadAllUsers();
  } catch (error) {
    console.error('Erreur confirmDeleteUser:', error);
    showNotification(error.message, 'error');
  }
}
