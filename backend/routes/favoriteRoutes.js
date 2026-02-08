const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected routes (require authentication)
router.post('/', authMiddleware, favoriteController.addFavorite);
router.get('/', authMiddleware, favoriteController.getFavorites);
router.get('/check/:shopId', authMiddleware, favoriteController.checkFavorite);
router.delete('/:shopId', authMiddleware, favoriteController.removeFavorite);

// Public route (no authentication required)
router.get('/count/:shopId', favoriteController.getFavoriteCount);

module.exports = router;
