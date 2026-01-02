const Shop = require('../models/shop');

// Get all shops
exports.getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find().sort({ createdAt: -1 });
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search shops by name
exports.searchShops = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ message: 'Name parameter is required' });
    }

    const shops = await Shop.find({
      name: { $regex: name, $options: 'i' } // Case-insensitive search
    }).sort({ averageRating: -1 });

    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Compare two shops
exports.compareShops = async (req, res) => {
  try {
    const { shop1, shop2 } = req.query;

    if (!shop1 || !shop2) {
      return res.status(400).json({ message: 'Both shop1 and shop2 IDs are required' });
    }

    const shopOne = await Shop.findById(shop1);
    const shopTwo = await Shop.findById(shop2);

    if (!shopOne || !shopTwo) {
      return res.status(404).json({ message: 'One or both shops not found' });
    }

    res.json({
      shop1: shopOne,
      shop2: shopTwo,
      comparison: {
        ratingDifference: Math.abs(shopOne.averageRating - shopTwo.averageRating),
        higherRated: shopOne.averageRating > shopTwo.averageRating ? shopOne.name : shopTwo.name,
        moreReviews: shopOne.reviewCount > shopTwo.reviewCount ? shopOne.name : shopTwo.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get shop by ID
exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new shop
exports.createShop = async (req, res) => {
  const { name, category, location } = req.body;

  if (!name || !category || !location) {
    return res.status(400).json({ message: 'Name, category, and location are required' });
  }

  try {
    const shop = new Shop({
      name,
      category,
      location
    });

    const savedShop = await shop.save();
    res.status(201).json(savedShop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Compare two shops by name (easier for users than using IDs)
exports.compareShopsByName = async (req, res) => {
  try {
    const { shop1, shop2 } = req.query;

    if (!shop1 || !shop2) {
      return res.status(400).json({ message: 'Both shop1 and shop2 names are required' });
    }

    // Find shops by name (case-insensitive)
    const shopOne = await Shop.findOne({
      name: { $regex: shop1, $options: 'i' }
    });
    
    const shopTwo = await Shop.findOne({
      name: { $regex: shop2, $options: 'i' }
    });

    if (!shopOne || !shopTwo) {
      return res.status(404).json({ message: 'One or both shops not found. Try: Pizza Paradise, Sushi Master, Burger King, Thai Heaven, Coffee Corner' });
    }

    res.json({
      shop1: shopOne,
      shop2: shopTwo,
      comparison: {
        ratingDifference: Math.abs(shopOne.averageRating - shopTwo.averageRating),
        higherRated: shopOne.averageRating > shopTwo.averageRating ? shopOne.name : shopTwo.name,
        moreReviews: shopOne.reviewCount > shopTwo.reviewCount ? shopOne.name : shopTwo.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Compare two shops by name (easier for users)
exports.compareShopsByName = async (req, res) => {
  try {
    const { shop1, shop2 } = req.query;

    if (!shop1 || !shop2) {
      return res.status(400).json({ message: 'Both shop1 and shop2 names are required' });
    }

    // Find shops by name (case-insensitive)
    const shopOne = await Shop.findOne({
      name: { $regex: shop1, $options: 'i' }
    });
    
    const shopTwo = await Shop.findOne({
      name: { $regex: shop2, $options: 'i' }
    });

    if (!shopOne || !shopTwo) {
      return res.status(404).json({ message: 'One or both shops not found' });
    }

    res.json({
      shop1: shopOne,
      shop2: shopTwo,
      comparison: {
        ratingDifference: Math.abs(shopOne.averageRating - shopTwo.averageRating),
        higherRated: shopOne.averageRating > shopTwo.averageRating ? shopOne.name : shopTwo.name,
        moreReviews: shopOne.reviewCount > shopTwo.reviewCount ? shopOne.name : shopTwo.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
