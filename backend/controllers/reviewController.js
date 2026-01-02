const Review = require('../models/Review');
const Shop = require('../models/Shop');

// Get all reviews for a shop
exports.getReviewsByShop = async (req, res) => {
  try {
    const { shopId } = req.params;

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const reviews = await Review.find({ shopId }).sort({ date: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new review and update shop's average rating
exports.addReview = async (req, res) => {
  try {
    const { shopId, rating, comment, reviewer } = req.body;

    // Validate input
    if (!shopId || !rating || !comment || !reviewer) {
      return res.status(400).json({ 
        message: 'shopId, rating, comment, and reviewer are required' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Create the review
    const review = new Review({
      shopId,
      rating,
      comment,
      reviewer
    });

    const savedReview = await review.save();

    // Update shop's average rating and review count
    const allReviews = await Review.find({ shopId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = (totalRating / allReviews.length).toFixed(2);

    shop.averageRating = parseFloat(averageRating);
    shop.reviewCount = allReviews.length;
    await shop.save();

    res.status(201).json({
      review: savedReview,
      updatedShop: shop
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get review by ID
exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a review and update shop's average rating
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Update shop's average rating
    const shop = await Shop.findById(review.shopId);
    const allReviews = await Review.find({ shopId: review.shopId });

    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = (totalRating / allReviews.length).toFixed(2);
      shop.averageRating = parseFloat(averageRating);
    } else {
      shop.averageRating = 0;
    }

    shop.reviewCount = allReviews.length;
    await shop.save();

    res.json({ message: 'Review deleted successfully', updatedShop: shop });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
