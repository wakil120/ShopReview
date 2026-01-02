# 🔧 Installation & Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have installed:

### Required
- **Node.js 14+** - [Download](https://nodejs.org/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community)
- **Git** (optional) - [Download](https://git-scm.com/)

### Optional (for additional features)
- **Flutter SDK** - [Download](https://flutter.dev/docs/get-started/install)
- **Google Chrome** - for testing the extension

---

## 🖥️ Windows Installation

### 1. Install Node.js
```powershell
# Download and run installer from nodejs.org
# Or use Chocolatey:
choco install nodejs
# Verify installation
node --version
npm --version
```

### 2. Install MongoDB
```powershell
# Download MongoDB Community Server
# Run the installer and follow the setup wizard
# Or use Chocolatey:
choco install mongodb-community

# Start MongoDB:
# Option 1: Run mongod in a terminal
mongod

# Option 2: Start as Windows Service
net start MongoDB
```

### 3. Verify MongoDB is Running
```powershell
# In another terminal:
mongosh
# You should see a MongoDB shell prompt
exit
```

---

## 🐧 macOS Installation

### 1. Install Node.js
```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
# Verify installation
node --version
npm --version
```

### 2. Install MongoDB
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
mongosh
```

---

## 🐔 Linux (Ubuntu/Debian) Installation

### 1. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### 2. Install MongoDB
```bash
# Add MongoDB repository
curl -fsSL https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongosh
```

---

## 🚀 Backend Setup

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `cors` - Cross-origin support
- `dotenv` - Environment variables
- `nodemon` - Development tool (optional)

### Step 3: Create Environment File (Optional)
```bash
# Copy the example file
cp .env.example .env

# Edit .env if needed (defaults work fine):
# PORT=3000
# MONGODB_URI=mongodb://localhost:27017/shopreview
# NODE_ENV=development
```

### Step 4: Start the Backend Server
```bash
# Production
npm start

# Development (with auto-restart on file changes)
npm run dev
```

**Expected Output:**
```
✓ MongoDB connected successfully
Initializing sample data...
✓ Sample data initialized
🚀 Server running on http://localhost:3000
📚 API Documentation:
   GET  /api/shops - Get all shops
   GET  /api/shops/search?name=xxx - Search shops by name
   GET  /api/shops/compare?shop1=id&shop2=id - Compare two shops
   GET  /api/reviews/:shopId - Get reviews for a shop
   POST /api/reviews - Add a review
```

### Step 5: Test the Backend
```bash
# In another terminal, test an endpoint:
curl http://localhost:3000/api/health

# Or open in browser:
# http://localhost:3000/api/shops
```

---

## 🌐 Website Setup

### Step 1: Navigate to Website Directory
```bash
cd website
```

### Step 2: Serve the Website
**Option A: Python (Built-in)**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Option B: Node.js**
```bash
npx http-server
```

**Option C: VS Code**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

**Option D: Direct Browser**
- Simply open `index.html` in your browser
- Features requiring API will work if backend is running

### Step 3: Access Website
```
Open in browser: http://localhost:8000
```

### Step 4: Verify Connection
- You should see shops listed
- Try searching for "pizza"
- Try adding a review

---

## 📱 Flutter App Setup

### Step 1: Install Flutter SDK
```bash
# Download from flutter.dev
# Add Flutter to your PATH
# Verify installation
flutter doctor
```

### Step 2: Navigate to Flutter App Directory
```bash
cd flutter_app
```

### Step 3: Get Dependencies
```bash
flutter pub get
```

### Step 4: Configure API URL (if needed)
Edit `lib/main.dart` and change the API URL if not using `10.0.2.2:3000`:
```dart
// For physical device, use your machine's IP:
'http://192.168.1.100:3000/api/shops'
```

### Step 5: Start Emulator/Device

**Android Emulator:**
```bash
# List available devices
flutter devices

# Start emulator (if you have Android Studio)
emulator -list-avds
emulator @device_name

# Or open Android Studio and start emulator
```

**iOS Simulator (macOS only):**
```bash
open -a Simulator
```

### Step 6: Run the App
```bash
flutter run
```

**Expected Output:**
```
✓ Built build/app.apk (xxx MB)
✓ Installed build/app.apk
✓ App launched successfully
```

---

## 🧩 Chrome Extension Setup

### Step 1: Open Extension Management
```
1. Open Google Chrome
2. Go to: chrome://extensions/
3. Enable "Developer mode" (toggle in top-right corner)
```

### Step 2: Load the Extension
```
1. Click "Load unpacked"
2. Navigate to the extension/ folder
3. Select and open the folder
```

### Step 3: Verify Extension is Loaded
```
You should see:
- Extension icon in toolbar
- "Shop Comparator" listed in extensions page
- Icon changes color when active
```

### Step 4: Test the Extension
```
1. Click the extension icon
2. Enter two Shop IDs from the API
3. Click "Compare Shops"
4. View comparison results
```

---

## ✅ Verification Checklist

After setup, verify everything works:

### Backend
- [ ] Server starts without errors
- [ ] MongoDB connection successful
- [ ] Sample data initialized
- [ ] `curl http://localhost:3000/api/shops` returns data

### Website
- [ ] Loads without errors
- [ ] Shows list of shops
- [ ] Search works
- [ ] Can add reviews
- [ ] Ratings update after review

### Flutter (Optional)
- [ ] App starts
- [ ] Shows list of shops
- [ ] Ratings display correctly
- [ ] Pull-to-refresh works

### Extension (Optional)
- [ ] Extension loads
- [ ] Can enter shop IDs
- [ ] Comparison works
- [ ] Results display correctly

---

## 🐛 Troubleshooting

### Backend Won't Start

**Problem: "Port 3000 already in use"**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

**Problem: "MongoDB connection refused"**
```bash
# Make sure MongoDB is running:
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Website API Errors

**Problem: "Failed to load shops"**
- [ ] Backend running on port 3000?
- [ ] CORS enabled in backend?
- [ ] API URL correct in script.js?

**Solution:**
```javascript
// Check API_BASE_URL in script.js
const API_BASE_URL = 'http://localhost:3000/api';
```

### Flutter App Can't Connect

**Problem: "Connection refused" on Android Emulator**
```dart
// Use correct IP for emulator:
'http://10.0.2.2:3000/api/shops'
```

**Problem: "Connection refused" on physical device**
```dart
// Find your machine's IP:
// Windows: ipconfig
// macOS/Linux: ifconfig
// Then update URL in main.dart
'http://192.168.1.100:3000/api/shops'
```

### Extension Not Loading

**Problem: "Manifest file error"**
- [ ] Using manifest.json (correct spelling)?
- [ ] JSON syntax valid?
- [ ] All required fields present?

**Solution:**
- Reload extension: `chrome://extensions/` → Reload button
- Check console for errors: `Right-click extension → Inspect popup`

---

## 🔄 Development Workflow

### Terminal Setup (Recommended)
```bash
# Terminal 1: Backend
cd backend
npm run dev    # Auto-restarts on file changes

# Terminal 2: Website
cd website
python -m http.server 8000

# Terminal 3: For other commands
# Optional - for running git, documentation updates, etc.
```

### Making Changes
```bash
# Backend changes auto-reload with nodemon
# Website changes auto-reload (refresh browser)
# Flutter changes: Stop and `flutter run` again
```

### Database Reset (if needed)
```bash
# Delete database and restart backend
# This will reinitialize sample data:
mongosh
# In mongosh:
use shopreview
db.shops.deleteMany({})
db.reviews.deleteMany({})
exit

# Restart backend
npm start
```

---

## 📚 Useful Commands Reference

```bash
# Backend
npm start              # Start production server
npm run dev           # Start with auto-reload
npm install           # Install dependencies

# Website
python -m http.server # Start HTTP server

# Flutter
flutter run           # Run app
flutter pub get       # Get dependencies
flutter clean         # Clean build
flutter build apk     # Build Android APK
flutter build ios     # Build iOS app

# MongoDB
mongod                # Start MongoDB
mongosh               # Connect to MongoDB
```

---

## 🎓 Next Steps

After successful setup:
1. **Explore the code** - Read comments in each file
2. **Review the architecture** - Check ARCHITECTURE.md
3. **Test the API** - Use curl or Postman
4. **Modify features** - Add your own functionality
5. **Deploy** - Follow cloud provider guides

---

## 📖 Documentation Files

- **README.md** - Complete project overview
- **ARCHITECTURE.md** - System design and data flow
- **PROJECT_SUMMARY.md** - File inventory and features
- **This file** - Installation and setup guide

---

## 💡 Tips

1. **Keep terminals organized** - Use tabs or multiple terminal windows
2. **Check error messages** - They often indicate the exact problem
3. **Use browser DevTools** - F12 to debug frontend issues
4. **Check MongoDB data** - Use `mongosh` to inspect database
5. **Read inline comments** - Code has detailed explanations

---

## ✨ You're All Set!

If everything is working, you now have:
- ✅ Running backend API
- ✅ Working website
- ✅ Fully configured Flutter app (optional)
- ✅ Loaded Chrome extension (optional)
- ✅ MongoDB database with sample data

**Happy coding!** 🎉
