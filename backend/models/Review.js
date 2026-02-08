const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  reviewer: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});


reviewSchema.statics.getReviewsWithFilters = async function(shopId, filters = {}) {
  let query = { shopId };
  
  // Apply rating filter
  if (filters.minRating) {
    query.rating = { $gte: filters.minRating };
  }
  
  // Apply date range filter
  if (filters.startDate) {
    query.date = { $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    if (query.date) {
      query.date.$lte = new Date(filters.endDate);
    } else {
      query.date = { $lte: new Date(filters.endDate) };
    }
  }
  
  // Apply sorting
  let sort = {};
  if (filters.sortBy === 'rating_high') {
    sort = { rating: -1, date: -1 };
  } else if (filters.sortBy === 'rating_low') {
    sort = { rating: 1, date: -1 };
  } else if (filters.sortBy === 'date_old') {
    sort = { date: 1 };
  } else {
    // Default: newest first
    sort = { date: -1 };
  }
  
  return await this.find(query).sort(sort);
};

reviewSchema.statics.getReviewStats = async function(shopId) {
  const reviews = await this.find({ shopId });
  
  const ratingDistribution = {
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  };
  
  reviews.forEach(review => {
    ratingDistribution[review.rating] += 1;
  });
  
  return {
    total: reviews.length,
    average: reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length,
    distribution: ratingDistribution,
    recent: reviews.slice(0, 3).map(r => ({
      reviewer: r.reviewer,
      rating: r.rating,
      comment: r.comment.substring(0, 100) + (r.comment.length > 100 ? '...' : ''),
      date: r.date
    }))
  };
};

module.exports = mongoose.models.Review || mongoose.model('Review', reviewSchema);
