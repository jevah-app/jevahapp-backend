const axios = require("axios");

const BASE_URL = "http://localhost:4000/api";

async function testInteractions() {
  console.log("🚀 Testing Interaction Endpoints...\n");

  try {
    // Test 1: Get share URLs (public endpoint)
    console.log("1. Testing share URLs endpoint...");
    try {
      const shareUrlsResponse = await axios.get(
        `${BASE_URL}/interactions/media/507f1f77bcf86cd799439011/share-urls`
      );
      console.log("✅ Share URLs endpoint working:", shareUrlsResponse.status);
    } catch (error) {
      if (error.response?.data?.message === "Media not found") {
        console.log(
          "✅ Share URLs endpoint working (expected error for fake media ID)"
        );
      } else {
        throw error;
      }
    }

    // Test 2: Get comments (public endpoint)
    console.log("2. Testing comments endpoint...");
    try {
      const commentsResponse = await axios.get(
        `${BASE_URL}/interactions/media/507f1f77bcf86cd799439011/comments`
      );
      console.log("✅ Comments endpoint working:", commentsResponse.status);
    } catch (error) {
      if (error.response?.data?.message === "Media not found") {
        console.log(
          "✅ Comments endpoint working (expected error for fake media ID)"
        );
      } else {
        throw error;
      }
    }

    // Test 3: Get share stats (public endpoint)
    console.log("3. Testing share stats endpoint...");
    try {
      const shareStatsResponse = await axios.get(
        `${BASE_URL}/interactions/media/507f1f77bcf86cd799439011/share-stats`
      );
      console.log(
        "✅ Share stats endpoint working:",
        shareStatsResponse.status
      );
    } catch (error) {
      if (error.response?.data?.message === "Media not found") {
        console.log(
          "✅ Share stats endpoint working (expected error for fake media ID)"
        );
      } else {
        throw error;
      }
    }

    console.log("\n🎉 All public endpoints are working!");
    console.log("\n📋 Available Interaction Endpoints:");
    console.log(
      "• POST /api/interactions/media/:mediaId/like - Toggle like/unlike"
    );
    console.log(
      "• POST /api/interactions/media/:mediaId/comment - Add comment"
    );
    console.log(
      "• DELETE /api/interactions/comments/:commentId - Remove comment"
    );
    console.log(
      "• POST /api/interactions/comments/:commentId/reaction - Add comment reaction"
    );
    console.log("• POST /api/interactions/media/:mediaId/share - Share media");
    console.log(
      "• GET /api/interactions/media/:mediaId/comments - Get comments"
    );
    console.log(
      "• GET /api/interactions/media/:mediaId/share-urls - Get share URLs"
    );
    console.log(
      "• GET /api/interactions/media/:mediaId/share-stats - Get share stats"
    );
    console.log(
      "• POST /api/interactions/messages/:recipientId - Send message"
    );
    console.log("• GET /api/interactions/conversations - Get conversations");
    console.log(
      "• GET /api/interactions/conversations/:conversationId/messages - Get messages"
    );
    console.log(
      "• DELETE /api/interactions/messages/:messageId - Delete message"
    );
  } catch (error) {
    console.log(
      "❌ Test failed:",
      error.response?.data?.message || error.message
    );
  }
}

testInteractions();
