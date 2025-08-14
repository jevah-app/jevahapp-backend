"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
/**
 * Swagger configuration for API documentation
 * Provides comprehensive documentation for all endpoints with proper schemas and examples
 */
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Jevah API",
            version: "2.0.0",
            description: `
        # Jevah - Gospel Media Platform API v2.0
        
        A comprehensive API for a gospel media platform featuring:
        
        ## 🚀 New Features in v2.0
        - **AI Biblical Counseling**: Intelligent chatbot for spiritual guidance
        - **Enhanced Analytics**: Comprehensive trending and user analytics
        - **Live Recording**: Record and manage live stream recordings
        - **Advanced Media Interactions**: Duration tracking, downloads, and sharing
        - **User Profiles**: Enhanced user profile management
        - **Real-time Features**: Socket.IO powered interactions
        
        ## Core Features
        - **User Management**: Registration, authentication, profile management
        - **Media Management**: Upload, stream, and manage gospel content
        - **Live Streaming**: Real-time streaming with Contabo infrastructure
        - **Real-time Interactions**: Socket.IO powered comments, reactions, and chat
        - **Content Discovery**: Search, filter, and recommend gospel media
        - **Artist Management**: Specialized features for gospel artists
        - **Analytics**: Comprehensive tracking and reporting
        
        ## Authentication
        Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
        \`\`\`
        Authorization: Bearer <your-jwt-token>
        \`\`\`
        
        ## Real-time Features
        The platform uses Socket.IO for real-time features:
        - Live comments and reactions
        - Real-time chat during live streams
        - User presence indicators
        - Typing indicators
        
        ## Rate Limiting
        API endpoints are rate-limited to ensure fair usage and prevent abuse:
        - Authentication: 5 requests per 15 minutes
        - Media uploads: 10 requests per hour
        - Media interactions: 100 requests per 15 minutes
        - AI Chatbot: 20 messages per minute
        
        ## Error Handling
        All endpoints return consistent error responses with appropriate HTTP status codes.
      `,
            contact: {
                name: "Jevah Team",
                email: "support@jevahapp.com",
                url: "https://jevah.com",
            },
            license: {
                name: "ISC",
                url: "https://opensource.org/licenses/ISC",
            },
            servers: [
                {
                    url: process.env.API_BASE_URL || "http://localhost:4000",
                    description: "Development server",
                },
                {
                    url: "https://api.jevah.com",
                    description: "Production server",
                },
            ],
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "JWT token for authentication",
                },
            },
            schemas: {
                // Common response schemas
                SuccessResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: true,
                        },
                        message: {
                            type: "string",
                            example: "Operation completed successfully",
                        },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: false,
                        },
                        message: {
                            type: "string",
                            example: "An error occurred",
                        },
                        error: {
                            type: "string",
                            example: "Detailed error message",
                        },
                    },
                },
                PaginationInfo: {
                    type: "object",
                    properties: {
                        page: {
                            type: "number",
                            example: 1,
                        },
                        limit: {
                            type: "number",
                            example: 10,
                        },
                        total: {
                            type: "number",
                            example: 100,
                        },
                        totalPages: {
                            type: "number",
                            example: 10,
                        },
                    },
                },
                // User schemas
                UserProfile: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "User's unique identifier",
                        },
                        firstName: {
                            type: "string",
                            description: "User's first name",
                        },
                        lastName: {
                            type: "string",
                            description: "User's last name",
                        },
                        email: {
                            type: "string",
                            format: "email",
                            description: "User's email address",
                        },
                        avatar: {
                            type: "string",
                            description: "User's avatar URL",
                        },
                        avatarUpload: {
                            type: "string",
                            description: "User's uploaded avatar URL",
                        },
                        section: {
                            type: "string",
                            enum: ["kids", "adults"],
                            description: "User's section (kids or adults)",
                        },
                        role: {
                            type: "string",
                            enum: [
                                "learner",
                                "parent",
                                "educator",
                                "moderator",
                                "admin",
                                "content_creator",
                                "vendor",
                                "church_admin",
                                "artist",
                            ],
                            description: "User's role in the platform",
                        },
                        isProfileComplete: {
                            type: "boolean",
                            description: "Whether the user's profile is complete",
                        },
                        isEmailVerified: {
                            type: "boolean",
                            description: "Whether the user's email is verified",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "User creation timestamp",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            description: "User last update timestamp",
                        },
                    },
                },
                // Media schemas
                Media: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Media's unique identifier",
                        },
                        title: {
                            type: "string",
                            description: "Media title",
                        },
                        description: {
                            type: "string",
                            description: "Media description",
                        },
                        contentType: {
                            type: "string",
                            enum: ["music", "videos", "books", "live"],
                            description: "Type of media content",
                        },
                        category: {
                            type: "string",
                            enum: [
                                "worship",
                                "inspiration",
                                "youth",
                                "teachings",
                                "marriage",
                                "counselling",
                            ],
                            description: "Media category",
                        },
                        fileUrl: {
                            type: "string",
                            description: "URL to the media file",
                        },
                        thumbnailUrl: {
                            type: "string",
                            description: "URL to the media thumbnail",
                        },
                        topics: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Topics associated with the media",
                        },
                        uploadedBy: {
                            type: "string",
                            description: "ID of the user who uploaded the media",
                        },
                        viewCount: {
                            type: "number",
                            description: "Number of views",
                        },
                        listenCount: {
                            type: "number",
                            description: "Number of listens (for audio)",
                        },
                        readCount: {
                            type: "number",
                            description: "Number of reads (for books)",
                        },
                        downloadCount: {
                            type: "number",
                            description: "Number of downloads",
                        },
                        favoriteCount: {
                            type: "number",
                            description: "Number of favorites",
                        },
                        shareCount: {
                            type: "number",
                            description: "Number of shares",
                        },
                        isLive: {
                            type: "boolean",
                            description: "Whether this is a live stream",
                        },
                        liveStreamStatus: {
                            type: "string",
                            enum: ["scheduled", "live", "ended", "archived"],
                            description: "Status of live stream",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Media creation timestamp",
                        },
                        updatedAt: {
                            type: "string",
                            format: "date-time",
                            description: "Media last update timestamp",
                        },
                    },
                },
                // Live Stream schemas
                LiveStream: {
                    type: "object",
                    properties: {
                        streamId: {
                            type: "string",
                            description: "Unique stream identifier",
                        },
                        streamKey: {
                            type: "string",
                            description: "Stream key for broadcasting",
                        },
                        rtmpUrl: {
                            type: "string",
                            description: "RTMP URL for streaming",
                        },
                        playbackUrl: {
                            type: "string",
                            description: "HLS playback URL",
                        },
                        hlsUrl: {
                            type: "string",
                            description: "HLS stream URL",
                        },
                        dashUrl: {
                            type: "string",
                            description: "DASH stream URL",
                        },
                        title: {
                            type: "string",
                            description: "Stream title",
                        },
                        description: {
                            type: "string",
                            description: "Stream description",
                        },
                        scheduledStart: {
                            type: "string",
                            format: "date-time",
                            description: "Scheduled start time",
                        },
                        actualStart: {
                            type: "string",
                            format: "date-time",
                            description: "Actual start time",
                        },
                        concurrentViewers: {
                            type: "number",
                            description: "Number of concurrent viewers",
                        },
                    },
                },
                // AI Chatbot schemas
                ChatMessage: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Message unique identifier",
                        },
                        message: {
                            type: "string",
                            description: "User's message or AI response",
                        },
                        isUser: {
                            type: "boolean",
                            description: "Whether the message is from user or AI",
                        },
                        timestamp: {
                            type: "string",
                            format: "date-time",
                            description: "Message timestamp",
                        },
                    },
                },
                AIResponse: {
                    type: "object",
                    properties: {
                        success: {
                            type: "boolean",
                            example: true,
                        },
                        data: {
                            type: "object",
                            properties: {
                                message: {
                                    type: "string",
                                    description: "AI response message",
                                },
                                timestamp: {
                                    type: "string",
                                    format: "date-time",
                                },
                            },
                        },
                    },
                },
                ChatbotInfo: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            example: "Jevah AI Counselor",
                        },
                        description: {
                            type: "string",
                            example: "Biblical counseling and spiritual guidance AI",
                        },
                        capabilities: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            example: ["Biblical counseling", "Prayer guidance", "Scripture references"],
                        },
                        version: {
                            type: "string",
                            example: "2.0.0",
                        },
                    },
                },
                SessionStats: {
                    type: "object",
                    properties: {
                        totalMessages: {
                            type: "number",
                            description: "Total messages in current session",
                        },
                        sessionDuration: {
                            type: "number",
                            description: "Session duration in minutes",
                        },
                        topicsDiscussed: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Topics discussed in the session",
                        },
                    },
                },
                // Trending Analytics schemas
                TrendingUser: {
                    type: "object",
                    properties: {
                        userId: {
                            type: "string",
                            description: "User's unique identifier",
                        },
                        firstName: {
                            type: "string",
                            description: "User's first name",
                        },
                        lastName: {
                            type: "string",
                            description: "User's last name",
                        },
                        avatar: {
                            type: "string",
                            description: "User's avatar URL",
                        },
                        role: {
                            type: "string",
                            description: "User's role",
                        },
                        stats: {
                            type: "object",
                            properties: {
                                totalViews: {
                                    type: "number",
                                    description: "Total views across all content",
                                },
                                totalInteractions: {
                                    type: "number",
                                    description: "Total interactions (likes, shares, etc.)",
                                },
                                totalContent: {
                                    type: "number",
                                    description: "Total content pieces uploaded",
                                },
                            },
                        },
                    },
                },
                TrendingAnalytics: {
                    type: "object",
                    properties: {
                        topCreators: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/TrendingUser",
                            },
                            description: "Top content creators",
                        },
                        mostViewedContent: {
                            type: "array",
                            items: {
                                $ref: "#/components/schemas/Media",
                            },
                            description: "Most viewed content",
                        },
                        trendingTopics: {
                            type: "array",
                            items: {
                                type: "string",
                            },
                            description: "Trending topics",
                        },
                        liveStreamStats: {
                            type: "object",
                            properties: {
                                activeStreams: {
                                    type: "number",
                                    description: "Number of active live streams",
                                },
                                totalViewers: {
                                    type: "number",
                                    description: "Total live stream viewers",
                                },
                                peakConcurrentViewers: {
                                    type: "number",
                                    description: "Peak concurrent viewers",
                                },
                            },
                        },
                    },
                },
                // Recording schemas
                Recording: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Recording unique identifier",
                        },
                        streamId: {
                            type: "string",
                            description: "Associated stream ID",
                        },
                        title: {
                            type: "string",
                            description: "Recording title",
                        },
                        description: {
                            type: "string",
                            description: "Recording description",
                        },
                        status: {
                            type: "string",
                            enum: ["recording", "processing", "completed", "failed"],
                            description: "Recording status",
                        },
                        fileUrl: {
                            type: "string",
                            description: "URL to the recorded file",
                        },
                        duration: {
                            type: "number",
                            description: "Recording duration in seconds",
                        },
                        fileSize: {
                            type: "number",
                            description: "File size in bytes",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Recording creation timestamp",
                        },
                    },
                },
                // Comment schemas
                Comment: {
                    type: "object",
                    properties: {
                        id: {
                            type: "string",
                            description: "Comment's unique identifier",
                        },
                        content: {
                            type: "string",
                            description: "Comment content",
                        },
                        user: {
                            type: "object",
                            properties: {
                                id: {
                                    type: "string",
                                    description: "User ID",
                                },
                                firstName: {
                                    type: "string",
                                    description: "User's first name",
                                },
                                lastName: {
                                    type: "string",
                                    description: "User's last name",
                                },
                            },
                        },
                        mediaId: {
                            type: "string",
                            description: "ID of the media this comment belongs to",
                        },
                        parentCommentId: {
                            type: "string",
                            description: "ID of parent comment (for replies)",
                        },
                        createdAt: {
                            type: "string",
                            format: "date-time",
                            description: "Comment creation timestamp",
                        },
                    },
                },
                // Socket.IO event schemas
                SocketEvent: {
                    type: "object",
                    properties: {
                        event: {
                            type: "string",
                            description: "Socket event name",
                        },
                        data: {
                            type: "object",
                            description: "Event data payload",
                        },
                        timestamp: {
                            type: "string",
                            format: "date-time",
                            description: "Event timestamp",
                        },
                    },
                },
            },
        },
        tags: [
            {
                name: "Authentication",
                description: "User authentication and authorization endpoints",
            },
            {
                name: "Users",
                description: "User management and profile operations",
            },
            {
                name: "Media",
                description: "Media upload, management, and streaming",
            },
            {
                name: "Live Streaming",
                description: "Live stream management and real-time features",
            },
            {
                name: "AI Chatbot",
                description: "AI-powered biblical counseling and spiritual guidance",
            },
            {
                name: "Trending Analytics",
                description: "Trending content and user analytics",
            },
            {
                name: "Recordings",
                description: "Live stream recording management",
            },
            {
                name: "Comments",
                description: "Comment and interaction management",
            },
            {
                name: "Analytics",
                description: "Analytics and reporting endpoints",
            },
            {
                name: "Admin",
                description: "Administrative operations and management",
            },
        ],
    },
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/models/*.ts"],
};
/**
 * Generate Swagger specification
 */
const swaggerSpec = (0, swagger_jsdoc_1.default)(swaggerOptions);
exports.default = swaggerSpec;
