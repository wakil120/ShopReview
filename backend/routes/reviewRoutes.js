const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure review images directory exists
const reviewImagesDir = path.join(__dirname, '../uploads/reviews');
if (!fs.existsSync(reviewImagesDir)) {
    fs.mkdirSync(reviewImagesDir, { recursive: true });
}

// Multer configuration for review images
const reviewStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, reviewImagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const reviewFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const reviewUpload = multer({
    storage: reviewStorage,
    fileFilter: reviewFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all reviews for a shop
router.get('/:shopId', reviewController.getReviewsByShop);

// Add a new review with image uploads
router.post('/', reviewUpload.array('images', 5), reviewController.addReview);

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

