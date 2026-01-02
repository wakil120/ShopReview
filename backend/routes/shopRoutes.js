const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

// GET routes MUST come before /:id route
// Get all shops
router.get('/', shopController.getAllShops);

// Search shops by name
router.get('/search', shopController.searchShops);

// Compare two shops by name (MUST be before /:id)
router.get('/compare-by-name', shopController.compareShopsByName);

// Compare two shops by ID (MUST be before /:id)
router.get('/compare', shopController.compareShops);

// Get shop by ID (MUST be last because /:id matches everything)
router.get('/:id', shopController.getShopById);

// Create a new shop
router.post('/', shopController.createShop);

module.exports = router;

module.exports = router;
