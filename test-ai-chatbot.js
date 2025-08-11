const axios = require("axios");

const BASE_URL = "http://localhost:4000/api";

async function testAIChatbot() {
  console.log("🤖 Testing AI Chatbot Endpoints...\n");

  try {
    // Test 1: Get chatbot info (public endpoint)
    console.log("1. Testing chatbot info endpoint...");
    try {
      const infoResponse = await axios.get(`${BASE_URL}/ai-chatbot/info`);
      console.log("✅ Chatbot info endpoint working:", infoResponse.status);
      console.log("📋 Chatbot capabilities:", infoResponse.data.data.capabilities.length, "features");
    } catch (error) {
      throw error;
    }

    // Test 2: Test message endpoint (will fail without auth, but we can test the route)
    console.log("2. Testing message endpoint (should fail without auth)...");
    try {
      await axios.post(`${BASE_URL}/ai-chatbot/message`, {
        message: "Hello, I need biblical guidance"
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log("✅ Message endpoint working (correctly requires authentication)");
      } else {
        throw error;
      }
    }

    console.log("\n🎉 AI Chatbot endpoints are working!");
    console.log("\n📋 Available AI Chatbot Endpoints:");
    console.log("• GET /api/ai-chatbot/info - Get chatbot information and capabilities");
    console.log("• POST /api/ai-chatbot/message - Send message to AI (requires auth)");
    console.log("• GET /api/ai-chatbot/history - Get chat history (requires auth)");
    console.log("• DELETE /api/ai-chatbot/history - Clear chat history (requires auth)");
    console.log("• GET /api/ai-chatbot/stats - Get session statistics (requires auth)");

    console.log("\n🤖 AI Chatbot Features:");
    console.log("• Biblical guidance and interpretation");
    console.log("• Spiritual counseling and emotional support");
    console.log("• Christian-based therapy");
    console.log("• Health and wellness guidance");
    console.log("• Relationship counseling");
    console.log("• Prayer guidance and spiritual direction");

    console.log("\n📖 Response Structure:");
    console.log(`
{
  "response": "Biblical guidance response...",
  "bibleVerses": ["John 3:16", "Psalm 23:1"],
  "recommendations": ["Pray daily", "Read scripture"],
  "followUpQuestions": ["How can I help you further?"],
  "emotionalSupport": "Remember, God loves you...",
  "timestamp": "2024-12-11T10:00:00Z"
}
    `);

    console.log("\n🔧 Setup Instructions:");
    console.log("1. Get Google Gemini API key from Google Cloud Console");
    console.log("2. Add GOOGLE_GEMINI_API_KEY to your .env file");
    console.log("3. Restart the server");
    console.log("4. Test with authenticated user");

    console.log("\n🎯 Next Steps:");
    console.log("• Add your Google Gemini API key to .env");
    console.log("• Test with authenticated user");
    console.log("• Integrate with frontend chat interface");

  } catch (error) {
    console.log("❌ Test failed:", error.response?.data?.message || error.message);
  }
}

testAIChatbot();
