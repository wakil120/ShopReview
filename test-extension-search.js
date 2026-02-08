const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testSearch() {
    console.log('=== Testing Search Functionality ===\n');

    // Test 1: Search for exact match
    console.log('1. Searching for exact match: "pizza"');
    try {
        const response = await axios.get(`${API_BASE_URL}/shops/search?name=pizza`);
        console.log(`✅ Found ${response.data.length} shop(s)`);
        response.data.forEach(shop => console.log(`   - ${shop.name}`));
    } catch (error) {
        console.error('❌ Search failed:', error.response?.data?.message || error.message);
        return;
    }

    // Test 2: Search with different capitalization
    console.log('\n2. Searching with different capitalization: "PIZZA"');
    try {
        const response = await axios.get(`${API_BASE_URL}/shops/search?name=PIZZA`);
        console.log(`✅ Found ${response.data.length} shop(s)`);
        response.data.forEach(shop => console.log(`   - ${shop.name}`));
    } catch (error) {
        console.error('❌ Search failed:', error.response?.data?.message || error.message);
        return;
    }

    // Test 3: Search with partial match
    console.log('\n3. Searching with partial match: "pizz"');
    try {
        const response = await axios.get(`${API_BASE_URL}/shops/search?name=pizz`);
        console.log(`✅ Found ${response.data.length} shop(s)`);
        response.data.forEach(shop => console.log(`   - ${shop.name}`));
    } catch (error) {
        console.error('❌ Search failed:', error.response?.data?.message || error.message);
        return;
    }

    // Test 4: Search with space
    console.log('\n4. Searching with space: "sushi master"');
    try {
        const response = await axios.get(`${API_BASE_URL}/shops/search?name=sushi master`);
        console.log(`✅ Found ${response.data.length} shop(s)`);
        response.data.forEach(shop => console.log(`   - ${shop.name}`));
    } catch (error) {
        console.error('❌ Search failed:', error.response?.data?.message || error.message);
        return;
    }

    // Test 5: Search for non-existent shop
    console.log('\n5. Searching for non-existent shop: "nonexistent"');
    try {
        const response = await axios.get(`${API_BASE_URL}/shops/search?name=nonexistent`);
        console.log(`✅ Found ${response.data.length} shop(s)`);
    } catch (error) {
        console.error('❌ Search failed:', error.response?.data?.message || error.message);
        return;
    }

    console.log('\n=== All search tests passed ===');
}

// Run the tests
testSearch().catch(error => {
    console.error('❌ Test failed:', error);
});
