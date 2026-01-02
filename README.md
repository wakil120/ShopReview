# 🏪 ShopReview - Full Stack Shop Review System

A complete, production-ready full-stack application where users can view shops, search them, see average ratings, view reviews, and add their own reviews. Built with Node.js, Express, MongoDB, React-like vanilla JavaScript, Flutter, and Chrome Extension.

## 📦 Project Structure

```
ShopReview/
├── backend/                    # Node.js + Express API
│   ├── models/
│   │   ├── Shop.js            # Shop schema with ratings
│   │   └── Review.js          # Review schema
│   ├── controllers/
│   │   ├── shopController.js  # Shop CRUD operations
│   │   └── reviewController.js# Review CRUD operations
│   ├── routes/
│   │   ├── shopRoutes.js      # Shop API endpoints
│   │   └── reviewRoutes.js    # Review API endpoints
│   ├── server.js              # Express server setup
│   └── package.json           # Dependencies
│
├── website/                    # Pure HTML/CSS/JavaScript frontend
│   ├── index.html             # Main page (responsive, modern UI)
│   ├── style.css              # Professional styling
│   └── script.js              # Full CRUD operations
│
├── flutter_app/               # Flutter mobile application
│   └── lib/
│       └── main.dart          # Flutter app with shop listing
│
├── extension/                 # Chrome browser extension
│   ├── manifest.json          # Extension configuration
│   ├── popup.html             # Extension UI
│   └── popup.js               # Shop comparison logic
│
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14+)
- **MongoDB** (running locally on port 27017)
- **Flutter** SDK (for mobile app)
- **Google Chrome** (for extension)

### 1. Backend Setup

```bash
cd backend
npm install
npm start
```

The server will start on `http://localhost:3000` and automatically initialize sample data.

**API Endpoints:**
- `GET /api/shops` - Get all shops
- `GET /api/shops/search?name=xxx` - Search shops by name
- `GET /api/shops/compare?shop1=id&shop2=id` - Compare two shops
- `GET /api/reviews/:shopId` - Get reviews for a shop
- `POST /api/reviews` - Add a review

### 2. Website Setup

```bash
cd website
# No build process needed! Just open index.html in a browser
# Or use a simple HTTP server:
python -m http.server 8000
# Then visit http://localhost:8000
```

**Features:**
- ✅ View all shops with ratings and review count
- ✅ Search shops by name (case-insensitive)
- ✅ Beautiful modern UI with gradient design
- ✅ View shop details and all reviews
- ✅ Add new reviews with validation
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Real-time rating updates

### 3. Flutter App Setup

```bash
cd flutter_app

# Get dependencies
flutter pub get

# Run on emulator/device
flutter run

# The app connects to http://10.0.2.2:3000 (Android emulator)
# For physical device, change the IP to your machine's local IP
```

**Features:**
- ✅ Display all shops in Material Design
- ✅ Show shop name, category, location
- ✅ Display average rating with stars
- ✅ Pull-to-refresh functionality
- ✅ Error handling and loading states

### 4. Chrome Extension Setup

```bash
# The extension is ready to use! Just load it into Chrome:

1. Open Chrome and go to: chrome://extensions/
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Navigate to the extension/ folder
5. Select the folder

# Now you can use the Shop Comparator extension!
```

**Features:**
- ✅ Enter two Shop IDs to compare
- ✅ View side-by-side comparison
- ✅ See rating differences
- ✅ Identify which shop has more reviews
- ✅ Beautiful, intuitive UI

## 🗄️ Database

The application uses **MongoDB** with the following collections:

### Shops Collection
```javascript
{
  _id: ObjectId,
  name: String,
  category: String,
  location: String,
  averageRating: Number,
  reviewCount: Number,
  createdAt: Date
}
```

### Reviews Collection
```javascript
{
  _id: ObjectId,
  shopId: ObjectId,
  rating: Number (1-5),
  comment: String,
  reviewer: String,
  date: Date
}
```

## 📝 Sample Data

The backend automatically initializes 5 sample shops with reviews:
- **Pizza Paradise** (Italian, Downtown) - 4.5 stars
- **Sushi Master** (Japanese, Mall Center) - 5 stars
- **Burger King** (Fast Food, Main Street) - 3 stars
- **Thai Heaven** (Thai, Midtown) - 4 stars
- **Coffee Corner** (Café, Business District) - (No reviews yet)

## 🎨 Design Highlights

### Website
- Modern gradient background (purple to blue)
- Card-based layout with hover effects
- Smooth animations and transitions
- Mobile-responsive design
- Accessible form inputs and buttons

### Flutter App
- Material Design 3
- Gradient header with shop initial
- Rating display with stars
- Pull-to-refresh
- Error states and loading indicators

### Chrome Extension
- Clean, professional popup UI
- Real-time comparison results
- Input validation
- Error handling
- Beautiful gradient design

## 🔧 Technologies Used

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **CORS** - Cross-origin support

### Frontend (Website)
- **HTML5** - Structure
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript (ES6+)** - No framework needed!

### Mobile
- **Flutter** - Cross-platform mobile framework
- **HTTP package** - API calls

### Extension
- **Chrome Extensions API** - Browser extension framework

## 📋 API Request/Response Examples

### Get All Shops
```bash
curl http://localhost:3000/api/shops
```

### Search Shops
```bash
curl "http://localhost:3000/api/shops/search?name=pizza"
```

### Compare Shops
```bash
curl "http://localhost:3000/api/shops/compare?shop1=<id1>&shop2=<id2>"
```

### Add Review
```bash
curl -X POST http://localhost:3000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "<shop_id>",
    "rating": 4,
    "comment": "Great food!",
    "reviewer": "John Doe"
  }'
```

## 🐛 Troubleshooting

### Backend won't start
- Make sure MongoDB is running: `mongod`
- Check if port 3000 is available
- Verify Node.js version: `node --version`

### Website API errors
- Ensure backend server is running
- Check CORS is enabled (it is by default)
- Check browser console for detailed errors

### Flutter app can't connect
- Android Emulator: Uses `10.0.2.2` to connect to host
- Physical Device: Update the API URL to your machine's local IP
- Verify backend is accessible from your network

### Extension not loading
- Go to `chrome://extensions/`
- Enable Developer Mode
- Check for errors in the extension's background/popup console

## 🔐 Security Notes

This is a demonstration project. For production:
- ✅ Use environment variables for sensitive data
- ✅ Add authentication and authorization
- ✅ Validate and sanitize all inputs
- ✅ Use HTTPS instead of HTTP
- ✅ Implement rate limiting
- ✅ Add proper error handling
- ✅ Use database indexes
- ✅ Implement input validation rules

## 📚 Key Features

### Backend
- ✅ RESTful API design
- ✅ Automatic average rating calculation
- ✅ Review count tracking
- ✅ Case-insensitive search
- ✅ Shop comparison logic
- ✅ Error handling middleware
- ✅ Automatic sample data initialization

### Website
- ✅ Real-time search
- ✅ Modal forms for reviews
- ✅ Shop detail view with reviews
- ✅ Loading states and error messages
- ✅ Professional UI/UX design
- ✅ HTML escaping for security
- ✅ Date formatting for reviews

### Flutter App
- ✅ Network requests with error handling
- ✅ State management
- ✅ Loading indicators
- ✅ Pull-to-refresh
- ✅ Material Design components
- ✅ Proper data models

### Chrome Extension
- ✅ Shop comparison functionality
- ✅ Input validation
- ✅ Beautiful results display
- ✅ Error handling
- ✅ Copy-paste friendly

## 🎯 Development Notes

### Adding New Shops
```javascript
// POST request to backend
fetch('http://localhost:3000/api/shops', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Shop',
    category: 'Category',
    location: 'Location'
  })
})
```

### Adding Reviews Programmatically
The website automatically updates the average rating when a review is added. The backend recalculates:
- Average rating = sum of all ratings / number of reviews
- Review count = total number of reviews

### Modifying API Base URL
- **Website**: Change `API_BASE_URL` in `website/script.js`
- **Flutter**: Change the URL in `flutter_app/lib/main.dart`
- **Extension**: Change `API_BASE_URL` in `extension/popup.js`

## 📄 License

This project is open source and available for educational purposes.

## 👨‍💻 Author

Created as a complete full-stack demonstration project with best practices in mind.

---

**Enjoy using ShopReview!** 🎉

For questions or issues, refer to the inline code comments in each file.