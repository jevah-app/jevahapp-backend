/**
 * @swagger
 * components:
 *   schemas:
 *     AIResponse:
 *       type: object
 *       properties:
 *         response:
 *           type: string
 *           description: The AI's biblical guidance response
 *         bibleVerses:
 *           type: array
 *           items:
 *             type: string
 *           description: Relevant Bible verses
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *           description: Practical spiritual recommendations
 *         followUpQuestions:
 *           type: array
 *           items:
 *             type: string
 *           description: Questions to continue conversation
 *         emotionalSupport:
 *           type: string
 *           description: Emotional support message
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Response timestamp
 *
 *     ContentMetadata:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Content ID
 *         title:
 *           type: string
 *           description: Content title
 *         description:
 *           type: string
 *           description: Content description
 *         contentType:
 *           type: string
 *           enum: [media, devotional, artist, merch, ebook, podcast]
 *           description: Type of content
 *         author:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             avatar:
 *               type: string
 *         stats:
 *           type: object
 *           properties:
 *             likes:
 *               type: number
 *             comments:
 *               type: number
 *             shares:
 *               type: number
 *             views:
 *               type: number
 *             downloads:
 *               type: number
 *         userInteraction:
 *           type: object
 *           properties:
 *             hasLiked:
 *               type: boolean
 *             hasCommented:
 *               type: boolean
 *             hasShared:
 *               type: boolean
 *             hasFavorited:
 *               type: boolean
 *             hasBookmarked:
 *               type: boolean
 *
 *     ChatMessage:
 *       type: object
 *       properties:
 *         role:
 *           type: string
 *           enum: [user, assistant]
 *         content:
 *           type: string
 *         timestamp:
 *           type: string
 *           format: date-time
 *         messageType:
 *           type: string
 *           enum: [biblical_question, emotional_support, health_guidance, relationship_counseling, spiritual_guidance, general_counseling]
 *
 *     SessionStats:
 *       type: object
 *       properties:
 *         messageCount:
 *           type: number
 *         sessionDuration:
 *           type: number
 *         topics:
 *           type: array
 *           items:
 *             type: string
 *         lastActivity:
 *           type: string
 *           format: date-time
 *
 *     ChatbotInfo:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Jevah"
 *         description:
 *           type: string
 *           example: "Biblical AI Counselor and Spiritual Guide"
 *         capabilities:
 *           type: array
 *           items:
 *             type: string
 *         features:
 *           type: array
 *           items:
 *             type: string
 *         mission:
 *           type: string
 *         disclaimer:
 *           type: string
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message"
 *
 *     Success:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operation successful"
 *         data:
 *           type: object
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * tags:
 *   - name: AI Chatbot
 *     description: Biblical AI counseling and spiritual guidance
 *   - name: Content Interactions
 *     description: Universal content interaction system
 *   - name: Authentication
 *     description: User authentication and authorization
 */

/**
 * @swagger
 * /api/ai-chatbot/info:
 *   get:
 *     summary: Get AI chatbot information and capabilities
 *     tags: [AI Chatbot]
 *     responses:
 *       200:
 *         description: Chatbot information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ChatbotInfo'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/ai-chatbot/message:
 *   post:
 *     summary: Send message to AI chatbot for biblical counseling
 *     tags: [AI Chatbot]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User's message or question
 *                 example: "I'm feeling anxious about my future. Can you help me with biblical guidance?"
 *     responses:
 *       200:
 *         description: AI response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "AI response generated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/AIResponse'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/ai-chatbot/history:
 *   get:
 *     summary: Get user's chat history with AI
 *     tags: [AI Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ChatMessage'
 *                     totalMessages:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/ai-chatbot/history:
 *   delete:
 *     summary: Clear user's chat history with AI
 *     tags: [AI Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat history cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/ai-chatbot/stats:
 *   get:
 *     summary: Get user's session statistics
 *     tags: [AI Chatbot]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SessionStats'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/content/{contentType}/{contentId}/metadata:
 *   get:
 *     summary: Get content metadata for frontend UI
 *     tags: [Content Interactions]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [media, devotional, artist, merch, ebook, podcast]
 *         description: Type of content
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Content metadata retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ContentMetadata'
 *       400:
 *         description: Invalid content type or ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/content/{contentType}/{contentId}/like:
 *   post:
 *     summary: Toggle like on any content type
 *     tags: [Content Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [media, devotional, artist, merch, ebook, podcast]
 *         description: Type of content
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Content liked successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked:
 *                       type: boolean
 *                     likeCount:
 *                       type: number
 *       400:
 *         description: Invalid content type or ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/content/{contentType}/{contentId}/comment:
 *   post:
 *     summary: Add comment to content
 *     tags: [Content Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [media, devotional]
 *         description: Type of content (only media and devotional support comments)
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Comment content
 *                 example: "This is an amazing gospel song!"
 *               parentCommentId:
 *                 type: string
 *                 description: Parent comment ID for nested comments
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Comment added successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request or content type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/content/{contentType}/{contentId}/comments:
 *   get:
 *     summary: Get comments for content
 *     tags: [Content Interactions]
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [media, devotional]
 *         description: Type of content
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       400:
 *         description: Invalid content type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/content/{contentType}/{contentId}/share:
 *   post:
 *     summary: Share content to social platforms
 *     tags: [Content Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [media, devotional, artist, merch, ebook, podcast]
 *         description: Type of content
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Content ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               platform:
 *                 type: string
 *                 description: Social platform to share to
 *                 example: "facebook"
 *               message:
 *                 type: string
 *                 description: Custom message for sharing
 *                 example: "Check out this amazing content!"
 *     responses:
 *       200:
 *         description: Content shared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Content shared successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     shareUrls:
 *                       type: object
 *                       description: URLs for different social platforms
 *                     platform:
 *                       type: string
 *                     contentType:
 *                       type: string
 *       400:
 *         description: Invalid content type or ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Content not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
