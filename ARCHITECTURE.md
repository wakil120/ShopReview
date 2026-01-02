# 🏗️ ShopReview Architecture

## System Overview

ShopReview is a full-stack web and mobile application that allows users to:
1. Browse and search shops
2. View shop ratings and reviews
3. Add their own reviews
4. Compare shops side-by-side

The system is built with a **centralized REST API backend** that serves multiple frontends.

```
┌─────────────────────────────────────────────────────────────┐
│                        MongoDB Database                      │
│  (Shops Collection, Reviews Collection)                      │
└────────┬──────────────────────────────────────────────────┬──┘
         │                                                   │
    ┌────▼────────────────────────────────────────────────┐ │
    │      Node.js Express REST API                       │ │
    │  (Backend - Port 3000)                              │ │
    │                                                      │ │
    │  ├─ /api/shops        (GET, POST)                  │ │
    │  ├─ /api/shops/search (GET)                        │ │
    │  ├─ /api/shops/compare (GET)                       │ │
    │  ├─ /api/reviews      (GET, POST, DELETE)          │ │
    │  └─ /api/health       (GET)                        │ │
    └────┬────────────────────────────────────────────────┘ │
         │                                                    │
    ┌────┴────────────┬────────────┬──────────────┬──────────┘
    │                 │            │              │
    │                 │            │              │
    ▼                 ▼            ▼              ▼
┌─────────┐    ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Website │    │  Mobile  │  │Extension │  │  Others  │
│ (HTML)  │    │ (Flutter)│  │ (Chrome) │  │          │
└─────────┘    └──────────┘  └──────────┘  └──────────┘
```

## Backend Architecture

### Directory Structure
```
backend/
├── models/              # Data models (Mongoose schemas)
│   ├── Shop.js         # Shop entity definition
│   └── Review.js       # Review entity definition
│
├── controllers/         # Business logic
│   ├── shopController.js
│   │   ├── getAllShops()
│   │   ├── searchShops()
│   │   ├── compareShops()
│   │   ├── getShopById()
│   │   └── createShop()
│   │
│   └── reviewController.js
│       ├── getReviewsByShop()
│       ├── addReview()
│       ├── getReviewById()
│       └── deleteReview()
│
├── routes/              # API endpoint definitions
│   ├── shopRoutes.js
│   └── reviewRoutes.js
│
└── server.js            # Express app setup & initialization
```

### Data Models

#### Shop Model
```
{
  _id: ObjectId (auto-generated)
  name: String (required)
  category: String (required)
  location: String (required)
  averageRating: Number (default: 0, min: 0, max: 5)
  reviewCount: Number (default: 0)
  createdAt: Date (auto-generated)
}
```

#### Review Model
```
{
  _id: ObjectId (auto-generated)
  shopId: ObjectId (references Shop, required)
  rating: Number (required, 1-5)
  comment: String (required)
  reviewer: String (required)
  date: Date (auto-generated)
}
```

### API Endpoints

#### Shop Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shops` | Get all shops |
| GET | `/api/shops/:id` | Get shop by ID |
| GET | `/api/shops/search?name=xxx` | Search shops by name |
| GET | `/api/shops/compare?shop1=id&shop2=id` | Compare two shops |
| POST | `/api/shops` | Create new shop |

#### Review Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews/:shopId` | Get all reviews for a shop |
| GET | `/api/reviews/single/:id` | Get review by ID |
| POST | `/api/reviews` | Add new review (updates shop rating) |
| DELETE | `/api/reviews/:id` | Delete review (updates shop rating) |

### Request/Response Examples

#### Add Review (Most Complex Operation)
**Request:**
```json
POST /api/reviews
Content-Type: application/json

{
  "shopId": "507f1f77bcf86cd799439011",
  "rating": 4,
  "comment": "Great place!",
  "reviewer": "John Doe"
}
```

**Process:**
1. Validate input (required fields, rating 1-5)
2. Check if shop exists
3. Create review document
4. Fetch ALL reviews for the shop
5. Calculate average: sum(ratings) / count
6. Update shop with new average and count
7. Return review + updated shop

**Response:**
```json
{
  "review": {
    "_id": "507f1f77bcf86cd799439012",
    "shopId": "507f1f77bcf86cd799439011",
    "rating": 4,
    "comment": "Great place!",
    "reviewer": "John Doe",
    "date": "2024-01-02T10:30:00.000Z"
  },
  "updatedShop": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Pizza Paradise",
    "category": "Italian",
    "location": "Downtown",
    "averageRating": 4.25,
    "reviewCount": 4,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Frontend Architecture

### Website (Pure HTML/CSS/JavaScript)

#### Structure
```
website/
├── index.html       # Main HTML with modals
├── style.css        # Responsive, gradient design
└── script.js        # All functionality (250+ lines)
```

#### Key Functions
```javascript
// Main Operations
loadShops()              // Fetch all shops from API
handleSearch()           // Real-time search
showShopDetails()        // Fetch and display full details
openReviewModal()        // Show review form
submitReview()           // POST new review

// UI Management
displayShops()           // Render shop grid
createShopCard()         // Build individual card
showLoading()            // Loading state
showError()              // Error messages

// Utilities
escapeHtml()             // Prevent XSS
formatDate()             // User-friendly dates
generateStars()          // Star rating display
```

#### Modal Components
1. **Review Modal** - Add new reviews
2. **Details Modal** - Full shop info + all reviews

### Flutter App

#### Architecture
```
lib/
├── main.dart        # Single file with all components
│   ├── ShopReviewApp (root)
│   ├── ShopListPage (stateful)
│   ├── ShopCard (stateless)
│   └── Shop (data model)
```

#### Key Classes
```dart
ShopReviewApp extends StatelessWidget
  └─ theme configuration
  └─ navigation

ShopListPage extends StatefulWidget
  └─ API calls
  └─ state management
  └─ error handling

ShopCard extends StatelessWidget
  └─ individual shop display
  └─ navigation tap handling

Shop (data class)
  └─ fromJson() factory constructor
  └─ fields mapping
```

### Chrome Extension

#### Architecture
```
extension/
├── manifest.json    # Configuration & permissions
├── popup.html       # UI with form + results
└── popup.js         # Comparison logic
```

#### Flow
```
User Input (2 Shop IDs)
    ↓
Validation
    ↓
API Request (/api/shops/compare)
    ↓
Parse Response
    ↓
Display Results (side-by-side)
```

## Data Flow Diagrams

### Searching Shops
```
User Types Search Term
        ↓
  handleSearch()
        ↓
  API: /api/shops/search?name=xxx
        ↓
  MongoDB: Find shops with regex match
        ↓
  Return matching shops
        ↓
  displayShops() - render cards
```

### Adding a Review
```
User Fills Form
        ↓
  Form Validation (UI)
        ↓
  POST /api/reviews
        ↓
  Backend Validation (required fields, rating 1-5)
        ↓
  Check Shop Exists
        ↓
  Create Review Document
        ↓
  Recalculate Average Rating
        ↓
  Update Shop Document
        ↓
  Return Success + Updated Shop
        ↓
  Reload Shop List
        ↓
  UI Update (Rating Changed!)
```

### Comparing Shops
```
User Enters 2 Shop IDs
        ↓
  Input Validation
        ↓
  API: /api/shops/compare?shop1=X&shop2=Y
        ↓
  MongoDB: Find both shops
        ↓
  Calculate Differences
        ↓
  Return Comparison Data
        ↓
  Format Results
        ↓
  Display Side-by-Side
```

## Database Schema Relationships

```
┌─────────────────────┐
│   Shops             │
├─────────────────────┤
│ _id (Primary Key)   │◄──────────┐
│ name                │           │
│ category            │           │
│ location            │           │ One-to-Many
│ averageRating       │           │
│ reviewCount         │           │
│ createdAt           │           │
└─────────────────────┘           │
                                  │
                          ┌──────────────────┐
                          │   Reviews        │
                          ├──────────────────┤
                          │ _id              │
                          │ shopId (FK)      ├──────→ References Shop._id
                          │ rating           │
                          │ comment          │
                          │ reviewer         │
                          │ date             │
                          └──────────────────┘
```

## Security & Best Practices

### Input Validation
- ✅ Required field checks
- ✅ Rating range validation (1-5)
- ✅ HTML escaping in frontend

### Error Handling
- ✅ Try-catch blocks in API routes
- ✅ Meaningful error messages
- ✅ HTTP status codes (200, 201, 400, 404, 500)
- ✅ CORS middleware
- ✅ 404 handler for undefined routes

### Data Integrity
- ✅ Average rating calculated server-side
- ✅ Review count tracked accurately
- ✅ Automatic update on review deletion
- ✅ No duplicate data storage

### Frontend Security
- ✅ HTML entity escaping (XSS prevention)
- ✅ Input trimming
- ✅ Form validation
- ✅ Error message sanitization

## Performance Considerations

### Backend
- ✅ Indexed database queries
- ✅ Single shop search instead of fetching all
- ✅ Efficient average rating calculation
- ✅ Stateless API design

### Frontend
- ✅ Lazy loading reviews (on-demand)
- ✅ Event delegation for dynamically created elements
- ✅ CSS animations (GPU accelerated)
- ✅ Minimal DOM manipulation

### Mobile
- ✅ HTTP client with timeout (10s)
- ✅ Error states and retry functionality
- ✅ Pull-to-refresh for better UX
- ✅ Connection awareness

## Scalability Notes

### Current Limitations
- Single MongoDB instance (no replication)
- No caching layer (Redis)
- No rate limiting
- No pagination

### Future Improvements
- Implement pagination for shops/reviews
- Add Redis caching layer
- Use connection pooling
- Implement rate limiting
- Add authentication & authorization
- Deploy with load balancing
- Use CDN for static assets
- Implement database indexing strategy

## Testing Considerations

### Manual Testing
1. Create shops via API
2. Add reviews and verify ratings update
3. Search with various terms
4. Compare shops with different ratings
5. Test on different screen sizes
6. Test error scenarios (invalid IDs, etc.)

### Automated Testing (Future)
```javascript
// Example unit test structure
describe('Shop Controller', () => {
  it('should search shops case-insensitively', () => { ... })
  it('should recalculate rating on review addition', () => { ... })
  it('should handle missing shops gracefully', () => { ... })
})
```

## Deployment Architecture

### Current (Development)
```
localhost:3000    (Backend)
localhost:8000    (Website)
10.0.2.2:3000    (Flutter Emulator)
Chrome Extension  (Popup)
```

### Production Ready
```
Cloud Provider (AWS/Azure/GCP)
├─ API Server (Port 3000)
├─ MongoDB Atlas
├─ S3/Blob Storage (static assets)
└─ CDN (global distribution)
```

---

This architecture is designed for:
- ✅ Maintainability
- ✅ Scalability
- ✅ Security
- ✅ Performance
- ✅ Developer Experience
