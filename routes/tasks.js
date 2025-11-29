const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getPublicTasks,
  getTaskById,
  createTask,
  updateTask,
  toggleVisibility,
  deleteTask,
  addComment,
  updateComment,
  deleteComment,
  voteComment
} = require('../controllers/taskController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

// Route pour les tâches publiques (AVANT les routes avec :id pour éviter les conflits)
// Accessible sans token, mais avec token permet de voir toutes les tâches publiques
router.get('/public', optionalAuthenticate, getPublicTasks);

// Routes CRUD de base - Toutes protégées sauf getTaskById qui est optionnel
router.route('/')
  .get(authenticate, getAllTasks)      // GET /api/tasks - Récupérer les tâches de l'utilisateur (protégé)
  .post(authenticate, createTask);     // POST /api/tasks - Créer une tâche (protégé)

router.route('/:id')
  .get(optionalAuthenticate, getTaskById)      // GET /api/tasks/:id - Récupérer une tâche (optionnel : publique ou propriétaire)
  .put(authenticate, updateTask)               // PUT /api/tasks/:id - Modifier une tâche (protégé)
  .delete(authenticate, deleteTask);           // DELETE /api/tasks/:id - Supprimer une tâche (protégé)

// Route pour changer la visibilité
router.patch('/:id/visibility', authenticate, toggleVisibility);  // PATCH /api/tasks/:id/visibility

// Routes pour les commentaires
router.post('/:id/comments', authenticate, addComment);                        // POST /api/tasks/:id/comments
router.put('/:id/comments/:commentId', authenticate, updateComment);           // PUT /api/tasks/:id/comments/:commentId
router.delete('/:id/comments/:commentId', authenticate, deleteComment);        // DELETE /api/tasks/:id/comments/:commentId
router.post('/:id/comments/:commentId/vote', authenticate, voteComment);       // POST /api/tasks/:id/comments/:commentId/vote

module.exports = router;
