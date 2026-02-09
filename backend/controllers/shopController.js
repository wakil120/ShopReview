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

// Add this new function after getAllShops
exports.getShopStatistics = async (req, res) => {
  try {
    const shops = await Shop.find({});
    const Review = require('../models/Review');

    // Calculate overall statistics
    const totalShops = shops.length;
    const totalReviews = shops.reduce((sum, shop) => sum + shop.reviewCount, 0);
    const averageRatingAll = shops.length > 0
      ? (shops.reduce((sum, shop) => sum + shop.averageRating, 0) / shops.length).toFixed(2)
      : 0;

    // Get category distribution
    const categoryStats = {};
    shops.forEach(shop => {
      const category = shop.category.toLowerCase();
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });

    // Get top rated shops
    const topRated = [...shops]
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5)
      .map(shop => ({
        name: shop.name,
        rating: shop.averageRating,
        reviews: shop.reviewCount,
        category: shop.category
      }));

    // Get most reviewed shops
    const mostReviewed = [...shops]
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 5)
      .map(shop => ({
        name: shop.name,
        reviews: shop.reviewCount,
        rating: shop.averageRating
      }));

    // Get recent reviews (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentReviews = await Review.find({
      date: { $gte: oneWeekAgo }
    }).sort({ date: -1 }).limit(10);

    res.json({
      summary: {
        totalShops,
        totalReviews,
        averageRating: parseFloat(averageRatingAll),
        averageReviewsPerShop: totalShops > 0 ? (totalReviews / totalShops).toFixed(1) : 0
      },
      categories: Object.entries(categoryStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      topRated,
      mostReviewed,
      recentActivity: {
        recentReviews: recentReviews.length,
        reviews: recentReviews.map(r => ({
          shop: shops.find(s => s._id.toString() === r.shopId.toString())?.name || 'Unknown',
          reviewer: r.reviewer,
          rating: r.rating,
          date: r.date
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add this function to get shop performance over time
exports.getShopPerformance = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { period = 'month' } = req.query; // month, week, year

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const Review = require('../models/Review');
    const reviews = await Review.find({ shopId }).sort({ date: 1 });

    // Group reviews by time period
    const performanceData = {};
    const now = new Date();

    reviews.forEach(review => {
      const date = new Date(review.date);
      let periodKey;

      if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else if (period === 'month') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        periodKey = date.getFullYear();
      }

      if (!performanceData[periodKey]) {
        performanceData[periodKey] = {
          total: 0,
          sum: 0,
          reviews: []
        };
      }

      performanceData[periodKey].total += 1;
      performanceData[periodKey].sum += review.rating;
      performanceData[periodKey].reviews.push({
        rating: review.rating,
        date: review.date
      });
    });

    // Convert to array and calculate averages
    const chartData = Object.entries(performanceData).map(([period, data]) => ({
      period,
      averageRating: data.sum / data.total,
      totalReviews: data.total,
      reviews: data.reviews.slice(-3) // Last 3 reviews of the period
    }));

    res.json({
      shop: {
        name: shop.name,
        currentRating: shop.averageRating,
        totalReviews: shop.reviewCount
      },
      period,
      chartData,
      trend: chartData.length > 1
        ? chartData[chartData.length - 1].averageRating - chartData[0].averageRating
        : 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
  const { name, category, location, photos: bodyPhotos } = req.body;

  if (!name || !category || !location) {
    return res.status(400).json({ message: 'Name, category, and location are required' });
  }

  try {
    // Process uploaded photos
    const photos = [];

    // First, process file uploads
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Create accessible URL for the image
        const photoUrl = `http://localhost:3000/uploads/shops/${file.filename}`;
        photos.push({
          url: photoUrl,
          caption: '',
          addedAt: new Date()
        });
      });
    }

    // Then, add photos from JSON body
    if (bodyPhotos && Array.isArray(bodyPhotos)) {
      bodyPhotos.forEach(photo => {
        if (photo.url) {
          photos.push({
            url: photo.url,
            caption: photo.caption || '',
            addedAt: new Date()
          });
        }
      });
    }

    const shop = new Shop({
      name: capitalize(name),         // → "pizza paradise" becomes "Pizza Paradise"
      category: capitalize(category), // → "italian" becomes "Italian"
      location: capitalize(location),  // → "downtown" becomes "Downtown"
      photos: photos
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

// Add a photo to a shop
exports.addShopPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { caption } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Photo file is required' });
    }

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Limit to 10 photos per shop
    if (shop.photos.length >= 10) {
      return res.status(400).json({ message: 'Maximum 10 photos allowed per shop' });
    }

    // Create accessible URL for the image
    const photoUrl = `http://localhost:3000/uploads/shops/${req.file.filename}`;

    shop.photos.push({
      url: photoUrl,
      caption: caption || '',
      addedAt: new Date()
    });

    await shop.save();

    res.status(201).json({
      message: 'Photo added successfully',
      photos: shop.photos
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all photos for a shop
exports.getShopPhotos = async (req, res) => {
  try {
    const { id } = req.params;

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    res.json(shop.photos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a photo from a shop
exports.deleteShopPhoto = async (req, res) => {
  try {
    const { id, photoIndex } = req.params;
    const index = parseInt(photoIndex);

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    if (index < 0 || index >= shop.photos.length) {
      return res.status(400).json({ message: 'Invalid photo index' });
    }

    // If deleting the main photo, update the main photo index
    if (index === shop.mainPhotoIndex) {
      shop.mainPhotoIndex = 0;
    } else if (index < shop.mainPhotoIndex) {
      // If deleting a photo before the main photo, adjust the index
      shop.mainPhotoIndex -= 1;
    }

    shop.photos.splice(index, 1);
    await shop.save();

    res.json({
      message: 'Photo deleted successfully',
      photos: shop.photos,
      mainPhotoIndex: shop.mainPhotoIndex
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Set main photo for a shop
exports.setMainPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { photoIndex } = req.body;

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const index = parseInt(photoIndex);
    if (index < 0 || index >= shop.photos.length) {
      return res.status(400).json({ message: 'Invalid photo index' });
    }

    shop.mainPhotoIndex = index;
    await shop.save();

    res.json({
      message: 'Main photo updated successfully',
      mainPhotoIndex: shop.mainPhotoIndex,
      photos: shop.photos
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

