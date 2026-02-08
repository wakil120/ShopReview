const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

// Add a shop to favorites
router.post('/', favoriteController.addFavorite);

// Get all favorites for a session
router.get('/', favoriteController.getFavorites);

// Check if a shop is favorited
router.get('/check/:shopId', favoriteController.checkFavorite);

// Get favorite count for a shop
router.get('/count/:shopId', favoriteController.getFavoriteCount);

// Remove a shop from favorites
router.delete('/:shopId', favoriteController.removeFavorite);

module.exports = router;
