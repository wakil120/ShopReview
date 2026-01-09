const Shop = require('../models/shop');

// Helper to capitalize first letter and make rest lowercase
function capitalize(str) {
  if (!str) return '';
  const trimmed = str.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}


// Get all shops - with optional case-insensitive category/location filters
exports.getAllShops = async (req, res) => {
  try {
    const { category, location } = req.query;

    let filter = {};

    // Case-insensitive exact match for category
    if (category) {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // Case-insensitive exact match for location
    if (location) {
      filter.location = { $regex: new RegExp(`^${location.trim()}$`, 'i') };
    }

    const shops = await Shop.find(filter).sort({ createdAt: -1 });
    res.json(shops);
  } catch (error) {
    console.error('Error fetching shops:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};


// Search shops by name
// Search shops by name - IMPROVED VERSION
exports.searchShops = async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ message: 'Name parameter is required' });
    }

    // Split the input by spaces to get individual search terms
    const searchTerms = name.trim().split(/\s+/);
    
    // Create regex patterns for each term
    const regexPatterns = searchTerms.map(term => ({
      name: { $regex: term, $options: 'i' }
    }));

    // Find shops that match ANY of the terms
    const shops = await Shop.find({
      $or: regexPatterns
    }).sort({ averageRating: -1 });

    // If you want shops that match ALL terms instead, use $and:
    // const shops = await Shop.find({
    //   $and: regexPatterns
    // }).sort({ averageRating: -1 });

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
// Create a new shop
exports.createShop = async (req, res) => {
  const { name, category, location } = req.body;

  if (!name || !category || !location) {
    return res.status(400).json({ message: 'Name, category, and location are required' });
  }

  try {
    const shop = new Shop({
      name: capitalize(name),         // → "pizza paradise" becomes "Pizza Paradise"
      category: capitalize(category), // → "italian" becomes "Italian"
      location: capitalize(location)  // → "downtown" becomes "Downtown"
    });

    const savedShop = await shop.save();
    res.status(201).json(savedShop);
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
