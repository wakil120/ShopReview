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


// Get reviews with filtering and sorting
router.get('/:shopId/filter', reviewController.getReviewsWithFilters);

// Get review statistics
router.get('/:shopId/stats', reviewController.getReviewStatistics);

// Mark a review as helpful
router.post('/:id/helpful', reviewController.markHelpful);

// Check if user voted helpful
router.get('/:id/helpful', reviewController.checkHelpful);

// Remove helpful vote
router.delete('/:id/helpful', reviewController.unmarkHelpful);

module.exports = router;

