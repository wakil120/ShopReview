const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure shop images directory exists
const shopImagesDir = path.join(__dirname, '../uploads/shops');
if (!fs.existsSync(shopImagesDir)) {
    fs.mkdirSync(shopImagesDir, { recursive: true });
}

// Multer configuration for shop images
const shopStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, shopImagesDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const shopFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const shopUpload = multer({
    storage: shopStorage,
    fileFilter: shopFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET routes MUST come before /:id route
// Get all shops
router.get('/', shopController.getAllShops);

// Search shops by name
router.get('/search', shopController.searchShops);

// Compare two shops by name (MUST be before /:id)
router.get('/compare-by-name', shopController.compareShopsByName);

// Compare two shops by ID (MUST be before /:id)
router.get('/compare', shopController.compareShops);


// Get shop statistics
router.get('/stats/overview', shopController.getShopStatistics);

// Get shop performance over time
router.get('/:id/performance', shopController.getShopPerformance);

// Get shop by ID (MUST be last because /:id matches everything)
// Create a new shop (admin only) with file uploads
router.post('/', authMiddleware, adminMiddleware, shopUpload.array('photos', 5), shopController.createShop);

// Add a photo to a shop (admin only) with file upload
router.post('/:id/photos', authMiddleware, adminMiddleware, shopUpload.single('photo'), shopController.addShopPhoto);

// Get all photos for a shop
router.get('/:id/photos', shopController.getShopPhotos);

// Delete a photo from a shop (admin only)
router.delete('/:id/photos/:photoIndex', authMiddleware, adminMiddleware, shopController.deleteShopPhoto);

// Delete a shop (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, shopController.deleteShop);

// Set main photo for a shop (admin only)
router.put('/:id/main-photo', authMiddleware, adminMiddleware, shopController.setMainPhoto);

// Get shop by ID (MUST be last because /:id matches everything)
router.get('/:id', shopController.getShopById);

module.exports = router;

