const axios = require("axios");

const BASE_URL = "http://localhost:4000/api";
const TEST_TOKEN = "your_test_token_here"; // Replace with actual token

const headers = {
  Authorization: `Bearer ${TEST_TOKEN}`,
  "Content-Type": "application/json",
};

async function testTrendingEndpoints() {
  console.log("🧪 Testing Trending Analytics Endpoints\n");

  const endpoints = [
    { name: "Trending Users", path: "/trending/trending" },
    { name: "Most Viewed Users", path: "/trending/most-viewed" },
    { name: "Most Read Ebook Users", path: "/trending/most-read-ebooks" },
    {
      name: "Most Listened Audio Users",
      path: "/trending/most-listened-audio",
    },
    { name: "Most Heard Sermon Users", path: "/trending/most-heard-sermons" },
    {
      name: "Most Checked Out Live Users",
      path: "/trending/most-checked-out-live",
    },
    { name: "Live Stream Timing", path: "/trending/live-stream-timing" },
    { name: "Comprehensive Analytics", path: "/trending/analytics" },
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📊 Testing: ${endpoint.name}`);
      const response = await axios.get(`${BASE_URL}${endpoint.path}`, {
        headers,
      });

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

async function testTrendingWithParams() {
  console.log("🔧 Testing Trending Endpoints with Parameters\n");

  try {
    // Test with limit parameter
    console.log("📊 Testing Trending Users with limit=5");
    const response = await axios.get(`${BASE_URL}/trending/trending?limit=5`, {
      headers,
    });
    console.log(`✅ Status: ${response.status}`);
    console.log(`   Users returned: ${response.data.data?.length || 0}`);
    console.log("");

    // Test with different limits
    console.log("📊 Testing Most Viewed Users with limit=10");
    const response2 = await axios.get(
      `${BASE_URL}/trending/most-viewed?limit=10`,
      { headers }
    );
    console.log(`✅ Status: ${response2.status}`);
    console.log(`   Users returned: ${response2.data.data?.length || 0}`);
    console.log("");
  } catch (error) {
    if (error.response) {
      console.log(
        `❌ Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`
      );
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
    console.log("");
  }
}

async function testLiveStreamTiming() {
  console.log("🎥 Testing Live Stream Timing Categories\n");

  try {
    const response = await axios.get(
      `${BASE_URL}/trending/live-stream-timing`,
      { headers }
    );

    if (response.status === 200) {
      const data = response.data.data;
      console.log("✅ Live Stream Timing Data:");
      console.log(
        `   Currently Live: ${data.currentlyLive?.length || 0} users`
      );
      console.log(
        `   Recently Ended: ${data.recentlyEnded?.length || 0} users`
      );
      console.log(
        `   Scheduled Today: ${data.scheduledToday?.length || 0} users`
      );
      console.log(
        `   Scheduled This Week: ${data.scheduledThisWeek?.length || 0} users`
      );
      console.log(
        `   Popular Live Streamers: ${data.popularLiveStreamers?.length || 0} users`
      );
    }
    console.log("");
  } catch (error) {
    if (error.response) {
      console.log(
        `❌ Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`
      );
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
    console.log("");
  }
}

async function testComprehensiveAnalytics() {
  console.log("📈 Testing Comprehensive Analytics\n");

  try {
    const response = await axios.get(`${BASE_URL}/trending/analytics?limit=5`, {
      headers,
    });

    if (response.status === 200) {
      const data = response.data.data;
      console.log("✅ Comprehensive Analytics Data:");
      console.log(`   Trending Users: ${data.trendingUsers?.length || 0}`);
      console.log(`   Most Viewed Users: ${data.mostViewedUsers?.length || 0}`);
      console.log(
        `   Most Read Ebook Users: ${data.mostReadEbookUsers?.length || 0}`
      );
      console.log(
        `   Most Listened Audio Users: ${data.mostListenedAudioUsers?.length || 0}`
      );
      console.log(
        `   Most Heard Sermon Users: ${data.mostHeardSermonUsers?.length || 0}`
      );
      console.log(
        `   Most Checked Out Live Users: ${data.mostCheckedOutLiveUsers?.length || 0}`
      );
      console.log(
        `   Live Stream Timing: ${data.liveStreamTiming ? "Available" : "Not available"}`
      );
    }
    console.log("");
  } catch (error) {
    if (error.response) {
      console.log(
        `❌ Error: ${error.response.status} - ${error.response.data.message || error.response.statusText}`
      );
    } else {
      console.log(`❌ Network Error: ${error.message}`);
    }
    console.log("");
  }
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting Trending Analytics Tests\n");
  console.log("=".repeat(50));

  await testTrendingEndpoints();
  console.log("=".repeat(50));

  await testTrendingWithParams();
  console.log("=".repeat(50));

  await testLiveStreamTiming();
  console.log("=".repeat(50));

  await testComprehensiveAnalytics();
  console.log("=".repeat(50));

  console.log("🎉 Trending Analytics Tests Completed!");
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testTrendingEndpoints,
  testTrendingWithParams,
  testLiveStreamTiming,
  testComprehensiveAnalytics,
  runAllTests,
};

