const Favorite = require('../models/Favorite');
const Shop = require('../models/shop');

// Add a shop to favorites
exports.addFavorite = async (req, res) => {
    console.log('=== addFavorite Debug ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User:', req.user);

    try {
        const { shopId } = req.body;
        let query;

        // If user is authenticated, use userId, otherwise use sessionId
        if (req.user) {
            console.log('User is authenticated, using userId:', req.user.id);
            query = { shopId, userId: req.user.id };
        } else {
            const { sessionId } = req.body;
            if (!sessionId) {
                console.log('User not authenticated and no sessionId');
                return res.status(400).json({ message: 'sessionId is required for unauthenticated users' });
            }
            console.log('User not authenticated, using sessionId:', sessionId);
            query = { shopId, sessionId };
        }

        // Check if shopId is provided
        if (!shopId) {
            console.log('No shopId provided');
            return res.status(400).json({ message: 'shopId is required' });
        }
        console.log('ShopId:', shopId);

        // Check if shop exists
        const shop = await Shop.findById(shopId);
        if (!shop) {
            console.log('Shop not found with id:', shopId);
            return res.status(404).json({ message: 'Shop not found' });
        }
        console.log('Found shop:', shop.name);

        // Check if already favorited with same identifier
        let existing = await Favorite.findOne(query);
        if (existing) {
            console.log('Shop already favorited');
            return res.status(400).json({ message: 'Shop already in favorites' });
        }

        // Check if there's an existing favorite with same shopId but different identifier
        const existingFavoriteQuery = {
            shopId,
            $or: [
                req.user ? { userId: { $ne: req.user.id }, sessionId: { $exists: true } } :
                    { sessionId: { $ne: query.sessionId }, userId: { $exists: true } }
            ]
        };

        let favorite;
        existing = await Favorite.findOne(existingFavoriteQuery);
        if (existing) {
            // If exists, update it to use current user/session
            console.log('Existing favorite found, updating...');
            existing.userId = query.userId;
            existing.sessionId = query.sessionId;
            favorite = await existing.save();
            console.log('Updated favorite:', favorite);
        } else {
            // If not exists, create new
            favorite = new Favorite(query);
            await favorite.save();
            console.log('Created favorite:', favorite);
        }

        // Update shop favorite count
        await Shop.findByIdAndUpdate(shopId, { $inc: { favoriteCount: 1 } });

        res.status(201).json({
            message: 'Shop added to favorites',
            favorite
        });
    } catch (error) {
        console.error('Error in addFavorite:', error);
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
        let query;

        // If user is authenticated, use userId, otherwise use sessionId
        if (req.user) {
            query = { shopId, userId: req.user.id };
        } else {
            const { sessionId } = req.query;
            if (!sessionId) {
                return res.status(400).json({ message: 'sessionId is required for unauthenticated users' });
            }
            query = { shopId, sessionId };
        }

        const favorite = await Favorite.findOneAndDelete(query);

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

// Get all favorites for a user or session
exports.getFavorites = async (req, res) => {
    try {
        let query;

        // If user is authenticated, use userId, otherwise use sessionId
        if (req.user) {
            query = { userId: req.user.id };
        } else {
            const { sessionId } = req.query;
            if (!sessionId) {
                return res.status(400).json({ message: 'sessionId is required for unauthenticated users' });
            }
            query = { sessionId };
        }

        const favorites = await Favorite.find(query)
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
        let query;

        // If user is authenticated, use userId, otherwise use sessionId
        if (req.user) {
            query = { shopId, userId: req.user.id };
        } else {
            const { sessionId } = req.query;
            if (!sessionId) {
                return res.status(400).json({ message: 'sessionId is required for unauthenticated users' });
            }
            query = { shopId, sessionId };
        }

        const favorite = await Favorite.findOne(query);

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
