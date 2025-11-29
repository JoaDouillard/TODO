const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const userController = require('../controllers/userController');

// Toutes les routes nécessitent authentification ET droits admin
router.use(authenticate);
router.use(isAdmin);

// Routes CRUD pour les utilisateurs
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
