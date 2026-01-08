const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // Changed to 3000 for consistency

// Middleware - UPDATED CORS
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/shopreview', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✓ MongoDB connected successfully');
  initializeData();
})
.catch(err => {
  console.error('✗ MongoDB connection error:', err.message);
  console.log('Make sure MongoDB is running: mongod');
  process.exit(1);
});

// Routes
const shopRoutes = require('./routes/shopRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

app.use('/api/shops', shopRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', port: PORT });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Initialize sample data
// Initialize sample data
async function initializeData() {
  const Shop = require('./models/shop');
  const Review = require('./models/Review');

  try {
    // Define the sample shops with corrected categories
    const sampleShops = [
      { name: 'Pizza Paradise', category: 'restaurant', location: 'Downtown' },
      { name: 'Sushi Master', category: 'restaurant', location: 'Mall Center' },
      { name: 'Burger King', category: 'restaurant', location: 'Main Street' },
      { name: 'Thai Heaven', category: 'restaurant', location: 'Midtown' },
      { name: 'Coffee Corner', category: 'restaurant', location: 'Business District' }
    ];

    // Remove only shops with the same names as sampleShops (old sample shops)
    await Shop.deleteMany({ name: { $in: sampleShops.map(s => s.name) } });

    // Insert updated sample shops
    const shops = await Shop.insertMany(sampleShops);

    // Add sample reviews
    const sampleReviews = [
      { shopId: shops[0]._id, rating: 5, comment: 'Best pizza in town!', reviewer: 'John Doe' },
      { shopId: shops[0]._id, rating: 4, comment: 'Great taste, bit pricey', reviewer: 'Jane Smith' },
      { shopId: shops[1]._id, rating: 5, comment: 'Fresh and delicious', reviewer: 'Mike Johnson' },
      { shopId: shops[2]._id, rating: 3, comment: 'Average quality', reviewer: 'Sarah Lee' },
      { shopId: shops[3]._id, rating: 4, comment: 'Authentic Thai food', reviewer: 'Tom Wilson' },
    ];

    await Review.insertMany(sampleReviews);

    // Update shop average ratings
    for (const shop of shops) {
      const reviews = await Review.find({ shopId: shop._id });
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        shop.averageRating = parseFloat(avgRating.toFixed(2));
        shop.reviewCount = reviews.length;
        await shop.save();
      }
    }

    console.log('✓ Sample shops updated and reviews initialized');
  } catch (error) {
    console.error('Error initializing sample shops:', error);
  }
}


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   GET  /api/shops - Get all shops`);
  console.log(`   GET  /api/shops/search?name=xxx - Search shops by name`);
  console.log(`   GET  /api/shops/compare?shop1=id&shop2=id - Compare two shops`);
  console.log(`   GET  /api/reviews/:shopId - Get reviews for a shop`);
  console.log(`   POST /api/reviews - Add a review`);
});

module.exports = app;