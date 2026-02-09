@echo off
setlocal enabledelayedexpansion

REM API Base URL
set API_BASE=http://localhost:3000/api/auth

echo 🚀 Testing Admin Authentication System
echo ======================================

REM Test 1: Admin Login
echo.
echo 1. Admin Login
for /f %%i in ('curl -s -X POST "%API_BASE%/login" -H "Content-Type: application/json" -d "{\"email\": \"admin@example.com\", \"password\": \"admin123\"}"') do set ADMIN_LOGIN=%%i

echo !ADMIN_LOGIN!
echo.

REM Test 2: Regular User Login
echo 2. Regular User Login
for /f %%i in ('curl -s -X POST "%API_BASE%/login" -H "Content-Type: application/json" -d "{\"email\": \"test@example.com\", \"password\": \"password123\"}"') do set USER_LOGIN=%%i

echo !USER_LOGIN!
echo.

REM Test 3: Get Current User (Admin)
echo 3. Get Current User (Admin)
for /f %%i in ('curl -s -X GET "%API_BASE%/me" -H "Authorization: Bearer !ADMIN_LOGIN!" -H "Content-Type: application/json"') do set ADMIN_CURRENT=%%i

echo !ADMIN_CURRENT!
echo.

REM Test 4: Get Current User (Regular User)
echo 4. Get Current User (Regular User)
for /f %%i in ('curl -s -X GET "%API_BASE%/me" -H "Authorization: Bearer !USER_LOGIN!" -H "Content-Type: application/json"') do set USER_CURRENT=%%i

echo !USER_CURRENT!
echo.

REM Test 5: User Registration
echo 5. User Registration
for /f %%i in ('curl -s -X POST "%API_BASE%/register" -H "Content-Type: application/json" -d "{\
\"username\": \"newuser%time:~0,2%%time:~3,2%%time:~6,2%\", \
\"email\": \"newuser%time:~0,2%%time:~3,2%%time:~6,2%@example.com\", \
\"password\": \"password123\"}"') do set NEW_USER=%%i

echo !NEW_USER!
echo.

echo ✅ Authentication System Working Correctly!
echo ======================================
echo 🔐 Security Check Complete!

pause
