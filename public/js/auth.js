// AUTHENTIFICATION - LOGIQUE

// Clés localStorage
const TOKEN_KEY = 'taskManager_token';
const USER_KEY = 'taskManager_user';

function saveAuthData(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getCurrentUser() {
  const userJson = localStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
}

function isAuthenticated() {
  return !!getToken();
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  updateHeader(); // Mettre à jour le header immédiatement
  navigate('/');
}

async function fetchWithAuth(url, options = {}) {
  const token = getToken();

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };

  return fetch(url, mergedOptions);
}


let registerTemplate;

async function registerPage() {
  if (isAuthenticated()) {
    navigate('/my-tasks');
    return;
  }

  // Compiler le template
  const source = document.getElementById('register-template').innerHTML;
  registerTemplate = Handlebars.compile(source);

  // Rendre le template
  $('app').innerHTML = registerTemplate();

  // Attacher l'événement de soumission
  $('registerForm').addEventListener('submit', handleRegisterSubmit);
}

async function handleRegisterSubmit(event) {
  event.preventDefault();

  const nom = $('nom').value.trim();
  const prenom = $('prenom').value.trim();
  const username = $('username').value.trim();
  const email = $('email').value.trim();
  const password = $('password').value;
  const confirmPassword = $('confirmPassword').value;

  // Validation côté client
  if (password !== confirmPassword) {
    showNotification('Les mots de passe ne correspondent pas', 'error');
    return;
  }

  if (password.length < 6) {
    showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nom, prenom, username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de l\'inscription');
    }

    showNotification('Inscription réussie ! Redirection vers la connexion...', 'success');

    setTimeout(() => {
      navigate('/login');
    }, 1500);

  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}


let loginTemplate;

async function loginPage() {
  if (isAuthenticated()) {
    navigate('/my-tasks');
    return;
  }

  // Compiler le template
  const source = document.getElementById('login-template').innerHTML;
  loginTemplate = Handlebars.compile(source);

  // Rendre le template
  $('app').innerHTML = loginTemplate();

  // Attacher l'événement de soumission
  $('loginForm').addEventListener('submit', handleLoginSubmit);
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const emailOrUsername = $('emailOrUsername').value.trim();
  const password = $('password').value;

  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ emailOrUsername, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur lors de la connexion');
    }

    // Sauvegarder le token et les infos utilisateur
    saveAuthData(data.data.token, data.data.user);

    showNotification('Connexion réussie ! Redirection...', 'success');

    updateHeader(); // Mettre à jour le header immédiatement

    setTimeout(() => {
      navigate('/my-tasks');
    }, 1000);

  } catch (error) {
    console.error('Erreur:', error);
    showNotification('Erreur : ' + error.message, 'error');
  }
}

// MISE À JOUR DU HEADER

function updateHeader() {
  const user = getCurrentUser();
  const headerRight = document.querySelector('.header-right');

  if (!headerRight) return;

  if (isAuthenticated() && user) {
    // Header pour utilisateur connecté
    const isAdminUser = user.role === 'admin';

    headerRight.innerHTML = `
      <div class="flex items-center gap-4">
        <a href="/my-tasks" class="text-blue-100 hover:text-white transition">Mes Tâches</a>
        <a href="/public-tasks" class="text-blue-100 hover:text-white transition">Tâches Publiques</a>
        <a href="/create" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition">+ Nouvelle Tâche</a>
        ${isAdminUser ? '<a href="/admin" class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg transition">⚙️ Admin</a>' : ''}
      </div>
    `;

    let userPopup = document.getElementById('userPopup');
    if (!userPopup) {
      userPopup = document.createElement('div');
      userPopup.id = 'userPopup';
      userPopup.className = 'fixed bottom-4 right-4 z-50';
      document.body.appendChild(userPopup);
    }

    userPopup.innerHTML = `
      <div class="relative">
        <button
          id="userPopupBtn"
          onclick="toggleUserMenu()"
          class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:shadow-xl"
        >
          <span class="font-semibold">👤 @${escapeHTML(user.username)}</span>
          ${isAdminUser ? '<span class="bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold">ADMIN</span>' : ''}
        </button>

        <div
          id="userMenu"
          class="hidden absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] overflow-hidden"
        >
          <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <p class="font-semibold text-gray-800">@${escapeHTML(user.username)}</p>
            <p class="text-xs text-gray-500">${escapeHTML(user.email || '')}</p>
          </div>
          <button
            onclick="logout()"
            class="w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 font-medium transition-colors flex items-center gap-2"
          >
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </div>
    `;
  } else {
    // Header pour visiteur
    headerRight.innerHTML = `
      <div class="flex gap-3">
        <a href="/login" class="bg-white hover:bg-gray-100 text-blue-600 px-4 py-2 rounded-lg font-semibold transition">Se connecter</a>
        <a href="/register" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition">S'inscrire</a>
      </div>
    `;

    // Supprimer la pop-up utilisateur si elle existe
    const userPopup = document.getElementById('userPopup');
    if (userPopup) {
      userPopup.remove();
    }
  }
}

function toggleUserMenu() {
  const menu = document.getElementById('userMenu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

// Fermer le menu si on clique ailleurs
document.addEventListener('click', (e) => {
  const userPopupBtn = document.getElementById('userPopupBtn');
  const userMenu = document.getElementById('userMenu');

  if (userPopupBtn && userMenu && !userPopupBtn.contains(e.target) && !userMenu.contains(e.target)) {
    userMenu.classList.add('hidden');
  }
});

document.addEventListener('DOMContentLoaded', updateHeader);
