const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testFavorites() {
    console.log('=== Testing Favorites Functionality ===\n');

    // Test 1: Register and login
    console.log('1. Registering and logging in...');
    const testUser = `testuser${Date.now()}`;
    const testEmail = `${testUser}@example.com`;

    // Register new user
    let registerResponse;
    try {
        registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
            username: testUser,
            email: testEmail,
            password: 'password123'
        });
        console.log('✅ Registration successful');
    } catch (error) {
        console.error('❌ Registration failed:', error.response?.data?.message || error.message);
        return;
    }

    // Login
    let loginResponse;
    try {
        loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: testEmail,
            password: 'password123'
        });
        console.log('✅ Login successful');
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.message || error.message);
        return;
    }

    const token = loginResponse.data.user.token;

    // Test 2: Get shops to favorite
    console.log('\n2. Getting shops...');
    let shopsResponse;
    try {
        shopsResponse = await axios.get(`${API_BASE_URL}/shops`);
        console.log(`✅ Found ${shopsResponse.data.length} shops`);
    } catch (error) {
        console.error('❌ Failed to get shops:', error.response?.data?.message || error.message);
        return;
    }

    const firstShopId = shopsResponse.data[0]._id;

    // Test 3: Add to favorites
    console.log('\n3. Adding to favorites...');
    try {
        await axios.post(`${API_BASE_URL}/favorites`, {
            shopId: firstShopId
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Added to favorites');
    } catch (error) {
        console.error('❌ Failed to add to favorites:', error.response?.data?.message || error.message);
        return;
    }

    // Test 4: Get favorites
    console.log('\n4. Getting favorites...');
    let favoritesResponse;
    try {
        favoritesResponse = await axios.get(`${API_BASE_URL}/favorites`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Found ${favoritesResponse.data.length} favorite(s)`);
    } catch (error) {
        console.error('❌ Failed to get favorites:', error.response?.data?.message || error.message);
        return;
    }

    // Test 5: Check if favorited
    console.log('\n5. Checking if favorited...');
    try {
        const checkResponse = await axios.get(`${API_BASE_URL}/favorites/check/${firstShopId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Shop is favorited: ${checkResponse.data.isFavorited}`);
    } catch (error) {
        console.error('❌ Failed to check favorite:', error.response?.data?.message || error.message);
        return;
    }

    // Test 6: Remove from favorites
    console.log('\n6. Removing from favorites...');
    try {
        await axios.delete(`${API_BASE_URL}/favorites/${firstShopId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Removed from favorites');
    } catch (error) {
        console.error('❌ Failed to remove from favorites:', error.response?.data?.message || error.message);
        return;
    }

    // Test 7: Verify removed
    console.log('\n7. Verifying removed...');
    try {
        const checkResponse = await axios.get(`${API_BASE_URL}/favorites/check/${firstShopId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Shop is favorited: ${checkResponse.data.isFavorited}`);
    } catch (error) {
        console.error('❌ Failed to check favorite:', error.response?.data?.message || error.message);
        return;
    }

    console.log('\n=== All favorites tests passed ===');
}

testFavorites();
