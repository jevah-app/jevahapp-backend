const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:4000/api';
let authToken = '';
let testUserId = '';
let testMediaId = '';
let testCommentId = '';
let testConversationId = '';

// Test data
const testUser = {
  email: `test-${uuidv4()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

const testMedia = {
  title: 'Test Media for Interactions',
  description: 'This is a test media item for testing interactions',
  contentType: 'music',
  category: 'worship',
  fileUrl: 'https://example.com/test-media.mp3'
};

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = response.data.data.token;
    testUserId = response.data.data.user._id;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function register() {
  try {
    console.log('📝 Registering test user...');
    const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ Registration successful');
    return true;
  } catch (error) {
    console.log('❌ Registration failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function createTestMedia() {
  try {
    console.log('🎵 Creating test media...');
    const response = await axios.post(`${BASE_URL}/media`, testMedia, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testMediaId = response.data.data._id;
    console.log('✅ Test media created:', testMediaId);
    return true;
  } catch (error) {
    console.log('❌ Failed to create test media:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testLikeUnlike() {
  console.log('\n❤️ Testing Like/Unlike functionality...');
  
  try {
    // Test like
    console.log('📤 Liking media...');
    const likeResponse = await axios.post(`${BASE_URL}/interactions/media/${testMediaId}/like`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Like successful:', likeResponse.data);

    // Test unlike
    console.log('📤 Unliking media...');
    const unlikeResponse = await axios.post(`${BASE_URL}/interactions/media/${testMediaId}/like`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Unlike successful:', unlikeResponse.data);

    return true;
  } catch (error) {
    console.log('❌ Like/Unlike test failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testComments() {
  console.log('\n💬 Testing Comments functionality...');
  
  try {
    // Test adding comment
    console.log('📤 Adding comment...');
    const commentResponse = await axios.post(`${BASE_URL}/interactions/media/${testMediaId}/comment`, {
      content: 'This is a test comment!'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Comment added:', commentResponse.data);
    testCommentId = commentResponse.data.data._id;

    // Test getting comments
    console.log('📥 Getting comments...');
    const getCommentsResponse = await axios.get(`${BASE_URL}/interactions/media/${testMediaId}/comments`);
    console.log('✅ Comments retrieved:', getCommentsResponse.data);

    // Test comment reaction
    console.log('📤 Adding comment reaction...');
    const reactionResponse = await axios.post(`${BASE_URL}/interactions/comments/${testCommentId}/reaction`, {
      reactionType: 'heart'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Comment reaction added:', reactionResponse.data);

    return true;
  } catch (error) {
    console.log('❌ Comments test failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSharing() {
  console.log('\n📤 Testing Sharing functionality...');
  
  try {
    // Test share media
    console.log('📤 Sharing media...');
    const shareResponse = await axios.post(`${BASE_URL}/interactions/media/${testMediaId}/share`, {
      platform: 'facebook',
      message: 'Check out this amazing content!'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Media shared:', shareResponse.data);

    // Test get share URLs
    console.log('📥 Getting share URLs...');
    const shareUrlsResponse = await axios.get(`${BASE_URL}/interactions/media/${testMediaId}/share-urls?message=Test message`);
    console.log('✅ Share URLs retrieved:', shareUrlsResponse.data);

    // Test get share stats
    console.log('📊 Getting share stats...');
    const shareStatsResponse = await axios.get(`${BASE_URL}/interactions/media/${testMediaId}/share-stats`);
    console.log('✅ Share stats retrieved:', shareStatsResponse.data);

    return true;
  } catch (error) {
    console.log('❌ Sharing test failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testMessaging() {
  console.log('\n💌 Testing Messaging functionality...');
  
  try {
    // Create another test user for messaging
    const recipientUser = {
      email: `recipient-${uuidv4()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Recipient',
      lastName: 'User'
    };

    console.log('📝 Creating recipient user...');
    await axios.post(`${BASE_URL}/auth/register`, recipientUser);
    
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: recipientUser.email,
      password: recipientUser.password
    });
    
    const recipientId = loginResponse.data.data.user._id;

    // Test send message
    console.log('📤 Sending message...');
    const messageResponse = await axios.post(`${BASE_URL}/interactions/messages/${recipientId}`, {
      content: 'Hello! This is a test message.',
      messageType: 'text'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Message sent:', messageResponse.data);

    // Test get conversations
    console.log('📥 Getting conversations...');
    const conversationsResponse = await axios.get(`${BASE_URL}/interactions/conversations`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Conversations retrieved:', conversationsResponse.data);

    if (conversationsResponse.data.data.length > 0) {
      testConversationId = conversationsResponse.data.data[0]._id;
      
      // Test get conversation messages
      console.log('📥 Getting conversation messages...');
      const messagesResponse = await axios.get(`${BASE_URL}/interactions/conversations/${testConversationId}/messages`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Conversation messages retrieved:', messagesResponse.data);
    }

    return true;
  } catch (error) {
    console.log('❌ Messaging test failed:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testSocketConnections() {
  console.log('\n🔌 Testing Socket.IO connections...');
  
  try {
    const io = require('socket.io-client');
    
    // Connect to socket
    const socket = io('http://localhost:4000', {
      auth: {
        token: authToken
      }
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Socket connection error:', error.message);
    });

    // Test joining media room
    socket.emit('join-media', testMediaId);
    console.log('📤 Joined media room');

    // Test sending comment via socket
    socket.emit('new-comment', {
      mediaId: testMediaId,
      content: 'This is a real-time comment!'
    });
    console.log('📤 Sent real-time comment');

    // Test media reaction via socket
    socket.emit('media-reaction', {
      mediaId: testMediaId,
      actionType: 'like'
    });
    console.log('📤 Sent real-time like');

    // Wait a bit for socket events
    await new Promise(resolve => setTimeout(resolve, 2000));

    socket.disconnect();
    console.log('✅ Socket tests completed');

    return true;
  } catch (error) {
    console.log('❌ Socket test failed:', error.message);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test media
    if (testMediaId) {
      await axios.delete(`${BASE_URL}/media/${testMediaId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Test media deleted');
    }

    // Delete test comment
    if (testCommentId) {
      await axios.delete(`${BASE_URL}/interactions/comments/${testCommentId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('✅ Test comment deleted');
    }

    console.log('✅ Cleanup completed');
  } catch (error) {
    console.log('⚠️ Cleanup warning:', error.response?.data?.message || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Interaction Tests...\n');

  let successCount = 0;
  let totalTests = 0;

  // Setup
  totalTests++;
  if (await register()) successCount++;
  
  totalTests++;
  if (await login()) successCount++;
  
  totalTests++;
  if (await createTestMedia()) successCount++;

  // Core functionality tests
  totalTests++;
  if (await testLikeUnlike()) successCount++;
  
  totalTests++;
  if (await testComments()) successCount++;
  
  totalTests++;
  if (await testSharing()) successCount++;
  
  totalTests++;
  if (await testMessaging()) successCount++;
  
  totalTests++;
  if (await testSocketConnections()) successCount++;

  // Cleanup
  await cleanup();

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${successCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
  console.log(`📈 Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);

  if (successCount === totalTests) {
    console.log('\n🎉 All tests passed! The interaction system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the implementation.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testLikeUnlike,
  testComments,
  testSharing,
  testMessaging,
  testSocketConnections
};
