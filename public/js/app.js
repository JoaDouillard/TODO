// ========================================
// APP PRINCIPAL - ROUTER SIMPLE
// ========================================

// Variable globale pour stocker l'ID de la tâche en cours
let currentTaskId = null;

// Routes de l'application
const routes = {
  '/': 'homePage',
  '/register': 'registerPage',
  '/login': 'loginPage',
  '/create': 'createPage',
  '/task/:id': 'viewPage',
  '/edit/:id': 'editPage',
  '/my-tasks': 'myTasksPage',
  '/public-tasks': 'publicTasksPage'
};

// Parser la route actuelle et extraire les paramètres
function parseRoute(path) {
  for (const [route, handler] of Object.entries(routes)) {
    // Convertir la route en regex (ex: /task/:id => /task/([^/]+))
    const routeRegex = new RegExp('^' + route.replace(':id', '([^/]+)') + '$');
    const match = path.match(routeRegex);

    if (match) {
      const params = match.slice(1); // Récupérer les paramètres capturés
      return { handler, params };
    }
  }

  // Par défaut, retourner la page d'accueil
  return { handler: 'homePage', params: [] };
}

// Router principal
function router() {
  const path = window.location.pathname;
  const { handler, params } = parseRoute(path);

  // Appeler le handler correspondant s'il existe
  if (window[handler]) {
    window[handler](...params);
  } else {
    console.error(`Handler ${handler} introuvable`);
    navigate('/');
  }
}

// Gestion du bouton retour du navigateur
window.addEventListener('popstate', router);

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  updateHeader(); // Mettre à jour le header selon l'état de connexion
  router();
});

// Handlers pour les pages (appelés par le router)
function viewPage(taskId) {
  loadViewPage(taskId);
}

function editPage(taskId) {
  loadEditPage(taskId);
}

// Les fonctions myTasksPage() et publicTasksPage() sont définies dans tasks.js
