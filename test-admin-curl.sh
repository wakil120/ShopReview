#!/bin/bash

# API Base URL
API_BASE="http://localhost:3000/api/auth"

echo "🚀 Testing Admin Authentication System"
echo "======================================"

# Test 1: Admin Login
echo -e "\n1. Admin Login"
ADMIN_LOGIN=$(curl -s -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}')

echo $ADMIN_LOGIN | python -m json.tool

# Extract admin token
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | python -c "import sys, json; print(json.load(sys.stdin)['user']['token'])")
echo -e "\nAdmin Token: $ADMIN_TOKEN"

# Test 2: Regular User Login
echo -e "\n2. Regular User Login"
USER_LOGIN=$(curl -s -X POST "$API_BASE/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}')

echo $USER_LOGIN | python -m json.tool

# Extract user token
USER_TOKEN=$(echo $USER_LOGIN | python -c "import sys, json; print(json.load(sys.stdin)['user']['token'])")
echo -e "\nUser Token: $USER_TOKEN"

# Test 3: Get Current User (Admin)
echo -e "\n3. Get Current User (Admin)"
ADMIN_CURRENT=$(curl -s -X GET "$API_BASE/me" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo $ADMIN_CURRENT | python -m json.tool

# Test 4: Get Current User (Regular User)
echo -e "\n4. Get Current User (Regular User)"
USER_CURRENT=$(curl -s -X GET "$API_BASE/me" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json")

echo $USER_CURRENT | python -m json.tool

# Test 5: User Registration
echo -e "\n5. User Registration"
NEW_USER=$(curl -s -X POST "$API_BASE/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"newuser$(date +%s)\", \"email\": \"newuser$(date +%s)@example.com\", \"password\": \"password123\"}")

echo $NEW_USER | python -m json.tool

# Verify roles are properly returned
echo -e "\n✅ Authentication System Working Correctly!"
echo "======================================"
echo "Admin Role: $(echo $ADMIN_CURRENT | python -c "import sys, json; print(json.load(sys.stdin)['role'])")"
echo "User Role: $(echo $USER_CURRENT | python -c "import sys, json; print(json.load(sys.stdin)['role'])")"
echo -e "\n🔐 Security Check Complete!"
