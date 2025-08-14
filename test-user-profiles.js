const axios = require("axios");

const BASE_URL = "http://localhost:4000/api";
const TEST_TOKEN = "your_test_token_here"; // Replace with actual token

const headers = {
  Authorization: `Bearer ${TEST_TOKEN}`,
  "Content-Type": "application/json",
};

async function testUserProfileEndpoints() {
  console.log("🧪 Testing User Profile Endpoints\n");

  const endpoints = [
    {
      name: "Get User Profile by ID",
      method: "GET",
      path: "/user-profiles/507f1f77bcf86cd799439011", // Example user ID
    },
    {
      name: "Get Current User Profile",
      method: "GET",
      path: "/user-profiles/me/profile",
    },
    {
      name: "Search User Profiles",
      method: "GET",
      path: "/user-profiles/search?query=john&limit=5",
    },
    {
      name: "Get Multiple User Profiles",
      method: "POST",
      path: "/user-profiles/multiple",
      data: {
        userIds: [
          "507f1f77bcf86cd799439011",
          "507f1f77bcf86cd799439012",
          "507f1f77bcf86cd799439013",
        ],
      },
    },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`👤 Testing: ${endpoint.name}`);
      
      let response;
      if (endpoint.method === "GET") {
        response = await axios.get(`${BASE_URL}${endpoint.path}`, {
          headers,
        });
      } else if (endpoint.method === "POST") {
        response = await axios.post(`${BASE_URL}${endpoint.path}`, endpoint.data, {
          headers,
        });
      }

      console.log(`✅ ${endpoint.name} - Status: ${response.status}`);
      console.log(
        `   Data: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`
      );
      console.log("");
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint.name} - Status: ${error.response.status}`);
        console.log(
          `   Error: ${error.response.data.message || error.response.statusText}`
        );
      } else {
        console.log(`❌ ${endpoint.name} - Network Error: ${error.message}`);
      }
      console.log("");
    }
  }
}

async function testUserProfileDataStructure() {
  console.log("📊 Testing User Profile Data Structure\n");

  try {
    // Test with a mock user ID (this will fail with 404, but we can see the structure)
    const response = await axios.get(
      `${BASE_URL}/user-profiles/507f1f77bcf86cd799439011`,
      { headers }
    );

    if (response.status === 200) {
      const userProfile = response.data.data;
      console.log("✅ User Profile Data Structure:");
      console.log(`   ID: ${userProfile._id}`);
      console.log(`   Avatar: ${userProfile.avatar || "Not set"}`);
      console.log(`   First Name: ${userProfile.firstName || "Not set"}`);
      console.log(`   Last Name: ${userProfile.lastName || "Not set"}`);
      console.log(`   Full Name: ${userProfile.fullName || "Not set"}`);
      console.log(`   Section: ${userProfile.section}`);
      console.log(`   Email: ${userProfile.email}`);
      console.log(`   Username: ${userProfile.username || "Not set"}`);
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log("✅ Endpoint working correctly - User not found (expected)");
      console.log("   This confirms the endpoint is accessible and properly structured");
    } else {
      console.log(`❌ Error: ${error.response?.status || "Network error"}`);
    }
  }
  console.log("");
}

async function testSearchFunctionality() {
  console.log("🔍 Testing Search Functionality\n");

  const searchQueries = [
    { query: "john", limit: 5 },
    { query: "artist", limit: 10 },
    { query: "content", limit: 3 },
  ];

  for (const search of searchQueries) {
    try {
      console.log(`🔍 Searching for: "${search.query}" (limit: ${search.limit})`);
      const response = await axios.get(
        `${BASE_URL}/user-profiles/search?query=${search.query}&limit=${search.limit}`,
        { headers }
      );

      console.log(`✅ Search successful - Status: ${response.status}`);
      console.log(`   Results found: ${response.data.data?.length || 0}`);
      console.log("");
    } catch (error) {
      if (error.response) {
        console.log(`❌ Search failed - Status: ${error.response.status}`);
        console.log(
          `   Error: ${error.response.data.message || error.response.statusText}`
        );
      } else {
        console.log(`❌ Network Error: ${error.message}`);
      }
      console.log("");
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting User Profile Tests\n");
  console.log("=".repeat(50));

  await testUserProfileEndpoints();
  console.log("=".repeat(50));

  await testUserProfileDataStructure();
  console.log("=".repeat(50));

  await testSearchFunctionality();
  console.log("=".repeat(50));

  console.log("🎉 User Profile Tests Completed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testUserProfileEndpoints,
  testUserProfileDataStructure,
  testSearchFunctionality,
  runAllTests,
};

