const express = require('express');
const router = express.Router();
const {
  getAllCategories,
  syncCategories
} = require('../controllers/categoryController');

// Routes pour les catégories
router.get('/', getAllCategories);           // GET /api/categories - Récupérer toutes les catégories
router.post('/sync', syncCategories);        // POST /api/categories/sync - Synchroniser les catégories

module.exports = router;
