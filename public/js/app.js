let currentTaskId = null;

const routes = {
  '/': 'homePage',
  '/register': 'registerPage',
  '/login': 'loginPage',
  '/create': 'createPage',
  '/task/:id/history': 'historyPage',
  '/task/:id': 'viewPage',
  '/edit/:id': 'editPage',
  '/my-tasks': 'myTasksPage',
  '/public-tasks': 'publicTasksPage',
  '/admin': 'adminPage'
};

function parseRoute(path) {
  for (const [route, handler] of Object.entries(routes)) {
    const routeRegex = new RegExp('^' + route.replace(':id', '([^/]+)') + '$');
    const match = path.match(routeRegex);

    if (match) {
      const params = match.slice(1);
      return { handler, params };
    }
  }

  return { handler: 'homePage', params: [] };
}

function router() {
  const path = window.location.pathname;
  const { handler, params } = parseRoute(path);

  if (window[handler]) {
    window[handler](...params);
  } else {
    console.error(`Handler ${handler} introuvable`);
    navigate('/');
  }
}

window.addEventListener('popstate', router);

document.addEventListener('DOMContentLoaded', () => {
  updateHeader();
  router();
});

function viewPage(taskId) {
  loadViewPage(taskId);
}

function editPage(taskId) {
  loadEditPage(taskId);
}
