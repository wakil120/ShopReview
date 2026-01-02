const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// Get all reviews for a shop
router.get('/:shopId', reviewController.getReviewsByShop);

// Add a new review
router.post('/', reviewController.addReview);

// Get review by ID
router.get('/single/:id', reviewController.getReviewById);

// Delete a review
router.delete('/:id', reviewController.deleteReview);

module.exports = router;
