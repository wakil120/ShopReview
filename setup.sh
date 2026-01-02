#!/bin/bash
# ShopReview Quick Setup Script
# Run this script to set up and start the backend

echo "🏪 ShopReview - Full Stack Setup"
echo "=================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if MongoDB is running
echo "Checking MongoDB connection..."
if ! mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "⚠️  MongoDB might not be running. Please start MongoDB:"
    echo "   Windows: mongod"
    echo "   macOS/Linux: brew services start mongodb-community"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to stop..."
fi

echo ""
echo "Setting up backend..."
cd backend

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting backend server..."
echo "=================================="
npm start
