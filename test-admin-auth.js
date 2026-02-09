const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/auth';

async function testAdminLogin() {
    console.log('=== Testing Admin Login ===');

    try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });

        console.log('✅ Login successful');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        return response.data.user.token;
    } catch (error) {
        console.error('❌ Login failed');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function testUserLogin() {
    console.log('\n=== Testing Regular User Login ===');

    try {
        const response = await axios.post(`${API_BASE_URL}/login`, {
            email: 'test@example.com',
            password: 'password123'
        });

        console.log('✅ Login successful');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        return response.data.user.token;
    } catch (error) {
        console.error('❌ Login failed');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function testGetCurrentUser(token) {
    console.log('\n=== Testing Get Current User ===');

    try {
        const response = await axios.get(`${API_BASE_URL}/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Get current user successful');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Get current user failed');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function testRegisterNewUser() {
    console.log('\n=== Testing User Registration ===');

    try {
        const response = await axios.post(`${API_BASE_URL}/register`, {
            username: 'newuser' + Date.now(),
            email: 'newuser' + Date.now() + '@example.com',
            password: 'password123'
        });

        console.log('✅ Registration successful');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        return response.data.user.token;
    } catch (error) {
        console.error('❌ Registration failed');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

async function runAllTests() {
    console.log('🚀 Starting Admin Authentication Tests\n');

    // Test admin login
    const adminToken = await testAdminLogin();

    // Test regular user login
    const userToken = await testUserLogin();

    // Test getting current user with admin token
    if (adminToken) {
        await testGetCurrentUser(adminToken);
    }

    // Test getting current user with regular user token
    if (userToken) {
        await testGetCurrentUser(userToken);
    }

    // Test registering new user
    await testRegisterNewUser();

    console.log('\n✅ All tests completed!');
}

// Run tests
runAllTests();
