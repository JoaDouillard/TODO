const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  addComment
} = require('../controllers/taskController');

// Routes CRUD de base
router.route('/')
  .get(getAllTasks)      // GET /api/tasks - Récupérer toutes les tâches
  .post(createTask);     // POST /api/tasks - Créer une tâche

router.route('/:id')
  .get(getTaskById)      // GET /api/tasks/:id - Récupérer une tâche
  .put(updateTask)       // PUT /api/tasks/:id - Modifier une tâche
  .delete(deleteTask);   // DELETE /api/tasks/:id - Supprimer une tâche

// Routes pour les sous-tâches
router.post('/:id/subtasks', addSubtask);  // POST /api/tasks/:id/subtasks

// Routes pour les commentaires
router.post('/:id/comments', addComment);  // POST /api/tasks/:id/comments

module.exports = router;
