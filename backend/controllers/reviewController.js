const Review = require('../models/Review');
const Shop = require('../models/shop');

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


exports.getReviewsWithFilters = async (req, res) => {
  try {
    const { shopId } = req.params;
    const {
      minRating,
      sortBy,
      startDate,
      endDate
    } = req.query;

    // Check if shop exists
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    const filters = {};

    if (minRating) {
      const rating = parseInt(minRating);
      if (rating >= 1 && rating <= 5) {
        filters.minRating = rating;
      }
    }

    if (sortBy && ['rating_high', 'rating_low', 'date_old', 'date_new'].includes(sortBy)) {
      filters.sortBy = sortBy;
    }

    if (startDate) {
      filters.startDate = startDate;
    }

    if (endDate) {
      filters.endDate = endDate;
    }

    const reviews = await Review.getReviewsWithFilters(shopId, filters);

    // Get review statistics
    const stats = await Review.getReviewStats(shopId);

    res.json({
      reviews,
      filters: {
        applied: Object.keys(filters).length > 0 ? filters : 'none',
        available: {
          sortBy: ['rating_high', 'rating_low', 'date_new', 'date_old'],
          minRating: [1, 2, 3, 4, 5]
        }
      },
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add after addReview function
exports.getReviewStatistics = async (req, res) => {
  try {
    const { shopId } = req.params;

    const stats = await Review.getReviewStats(shopId);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a new review and update shop's average rating
exports.addReview = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
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

    // Process uploaded images
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        // Create accessible URL for the image
        const imageUrl = `http://localhost:3000/uploads/reviews/${file.filename}`;
        images.push(imageUrl);
      });
    }

    // Create the review
    const review = new Review({
      shopId,
      rating,
      comment,
      reviewer,
      images: images
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

// Mark a review as helpful
exports.markHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if already voted
    if (review.helpfulVoters.includes(sessionId)) {
      return res.status(400).json({ message: 'You have already marked this review as helpful' });
    }

    // Add vote
    review.helpfulVoters.push(sessionId);
    review.helpfulCount += 1;
    await review.save();

    res.json({
      message: 'Review marked as helpful',
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove helpful vote from a review
exports.unmarkHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if voted
    const voterIndex = review.helpfulVoters.indexOf(sessionId);
    if (voterIndex === -1) {
      return res.status(400).json({ message: 'You have not marked this review as helpful' });
    }

    // Remove vote
    review.helpfulVoters.splice(voterIndex, 1);
    review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    await review.save();

    res.json({
      message: 'Helpful vote removed',
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if a session has voted helpful on a review
exports.checkHelpful = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ message: 'sessionId is required' });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({
      hasVoted: review.helpfulVoters.includes(sessionId),
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
