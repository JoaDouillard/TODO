// ========================================
// UTILITAIRES COMMUNS
// ========================================

// Configuration de l'API
const API_URL = 'http://localhost:3000/api/tasks';

// Récupérer un élément par ID
function $(id) {
  return document.getElementById(id);
}

// Échapper le HTML pour éviter les failles XSS
function escapeHTML(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Formater une date au format français
function formatDate(dateString) {
  if (!dateString) return 'Pas de date';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Afficher une notification
function showNotification(message, type = 'info') {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  };

  const notification = document.createElement('div');
  notification.className = `fixed top-20 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Obtenir la classe CSS pour un statut
function getStatusClass(status) {
  const classes = {
    'à faire': 'bg-gray-100 text-gray-700',
    'en cours': 'bg-blue-100 text-blue-700',
    'terminée': 'bg-green-100 text-green-700',
    'annulée': 'bg-red-100 text-red-700'
  };
  return classes[status] || 'bg-gray-100 text-gray-700';
}

// Obtenir la classe de bordure pour un statut
function getStatusBorderClass(status) {
  const classes = {
    'à faire': 'border-gray-300',
    'en cours': 'border-blue-400',
    'terminée': 'border-green-400',
    'annulée': 'border-red-400'
  };
  return classes[status] || 'border-gray-300';
}

// Obtenir le label pour un statut
function getStatusLabel(status) {
  const labels = {
    'à faire': 'À faire',
    'en cours': 'En cours',
    'terminée': 'Terminée',
    'annulée': 'Annulée'
  };
  return labels[status] || status;
}

// Obtenir la couleur pour une priorité
function getPriorityColor(priority) {
  const colors = {
    'basse': 'text-green-600',
    'moyenne': 'text-amber-600',
    'haute': 'text-orange-600',
    'critique': 'text-red-600'
  };
  return colors[priority] || 'text-gray-600';
}

// Obtenir la couleur de bordure pour une priorité
function getPriorityBorderColor(priority) {
  const colors = {
    'basse': 'border-green-500',
    'moyenne': 'border-amber-500',
    'haute': 'border-orange-500',
    'critique': 'border-red-500'
  };
  return colors[priority] || 'border-gray-500';
}

// Obtenir la classe de fond pour une priorité (badge)
function getPriorityBgClass(priority) {
  const classes = {
    'basse': 'bg-green-100',
    'moyenne': 'bg-amber-100',
    'haute': 'bg-orange-100',
    'critique': 'bg-red-100'
  };
  return classes[priority] || 'bg-gray-100';
}

// Obtenir la classe de texte pour une priorité (badge)
function getPriorityTextClass(priority) {
  const classes = {
    'basse': 'text-green-700',
    'moyenne': 'text-amber-700',
    'haute': 'text-orange-700',
    'critique': 'text-red-700'
  };
  return classes[priority] || 'text-gray-700';
}

// Obtenir la classe de bordure pour une priorité (badge)
function getPriorityBorderClass(priority) {
  const classes = {
    'basse': 'border-green-400',
    'moyenne': 'border-amber-400',
    'haute': 'border-orange-500',
    'critique': 'border-red-500'
  };
  return classes[priority] || 'border-gray-400';
}

// Navigation - pour changer de page sans rechargement
function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
