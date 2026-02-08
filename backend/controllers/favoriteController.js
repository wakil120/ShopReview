const Favorite = require('../models/Favorite');
const Shop = require('../models/shop');

// Add a shop to favorites
exports.addFavorite = async (req, res) => {
    try {
        const { shopId, sessionId } = req.body;

        if (!shopId || !sessionId) {
            return res.status(400).json({ message: 'shopId and sessionId are required' });
        }

        // Check if shop exists
        const shop = await Shop.findById(shopId);
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        // Check if already favorited
        const existing = await Favorite.findOne({ shopId, sessionId });
        if (existing) {
            return res.status(400).json({ message: 'Shop already in favorites' });
        }

        // Create favorite
        const favorite = new Favorite({ shopId, sessionId });
        await favorite.save();

        // Update shop favorite count
        await Shop.findByIdAndUpdate(shopId, { $inc: { favoriteCount: 1 } });

        res.status(201).json({
            message: 'Shop added to favorites',
            favorite
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Shop already in favorites' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Remove a shop from favorites
exports.removeFavorite = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ message: 'sessionId is required' });
        }

        const favorite = await Favorite.findOneAndDelete({ shopId, sessionId });

        if (!favorite) {
            return res.status(404).json({ message: 'Favorite not found' });
        }

        // Update shop favorite count
        await Shop.findByIdAndUpdate(shopId, { $inc: { favoriteCount: -1 } });

        res.json({ message: 'Shop removed from favorites' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all favorites for a session
exports.getFavorites = async (req, res) => {
    try {
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ message: 'sessionId is required' });
        }

        const favorites = await Favorite.find({ sessionId })
            .populate('shopId')
            .sort({ createdAt: -1 });

        // Filter out any null shop references (in case shop was deleted)
        const validFavorites = favorites
            .filter(f => f.shopId !== null)
            .map(f => f.shopId);

        res.json(validFavorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Check if a shop is favorited
exports.checkFavorite = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { sessionId } = req.query;

        if (!sessionId) {
            return res.status(400).json({ message: 'sessionId is required' });
        }

        const favorite = await Favorite.findOne({ shopId, sessionId });

        res.json({ isFavorited: !!favorite });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get favorite count for a shop
exports.getFavoriteCount = async (req, res) => {
    try {
        const { shopId } = req.params;

        const count = await Favorite.countDocuments({ shopId });

        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
