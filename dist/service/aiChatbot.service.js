"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIChatbotService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const logger_1 = __importDefault(require("../utils/logger"));
class AIChatbotService {
    constructor() {
        this.chatSessions = new Map();
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            logger_1.default.warn("GOOGLE_GEMINI_API_KEY not found. AI chatbot will use fallback responses.");
            this.genAI = null;
            this.model = null;
        }
        else {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        }
    }
    /**
     * Initialize or get existing chat session
     */
    getOrCreateSession(userId) {
        if (!this.chatSessions.has(userId)) {
            this.chatSessions.set(userId, {
                userId,
                messages: [],
                context: {
                    sessionStartTime: new Date(),
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }
        return this.chatSessions.get(userId);
    }
    /**
     * Generate system prompt based on user's needs
     */
    generateSystemPrompt(user, messageType) {
        const basePrompt = `You are Jevah, an AI biblical counselor and spiritual guide for the Jevah Gospel Media Platform. Your purpose is to:

1. **Biblical Guidance**: Answer questions based solely on the Bible and Christian principles
2. **Spiritual Counseling**: Provide comfort and guidance using scripture
3. **Emotional Support**: Help users through hardships with biblical wisdom
4. **Therapeutic Approach**: Offer Christian-based therapy and emotional healing
5. **Medical Guidance**: Provide spiritual guidance for health concerns (not medical advice)

**Core Principles**:
- Always base responses on biblical truth
- Show compassion and understanding
- Provide relevant Bible verses for every response
- Encourage prayer and faith
- Maintain confidentiality and trust
- Guide users toward God's love and grace

**User Context**: ${user.firstName} ${user.lastName} (${user.email})
**Session Type**: ${messageType}

**Response Format**:
- Provide a compassionate, biblical response
- Include 2-3 relevant Bible verses with references
- Offer practical spiritual recommendations
- Ask 1-2 follow-up questions to continue the conversation
- Provide emotional support and encouragement

Remember: You are here to be the "Ark of God" - a shield against worldly nonsense and a beacon of God's truth and love.`;
        return basePrompt;
    }
    /**
     * Analyze message type and user intent
     */
    analyzeMessageType(message) {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes("bible") ||
            lowerMessage.includes("scripture") ||
            lowerMessage.includes("verse")) {
            return "biblical_question";
        }
        if (lowerMessage.includes("depressed") ||
            lowerMessage.includes("sad") ||
            lowerMessage.includes("anxiety") ||
            lowerMessage.includes("stress") ||
            lowerMessage.includes("worried") ||
            lowerMessage.includes("fear")) {
            return "emotional_support";
        }
        if (lowerMessage.includes("sick") ||
            lowerMessage.includes("pain") ||
            lowerMessage.includes("health") ||
            lowerMessage.includes("medical") ||
            lowerMessage.includes("doctor")) {
            return "health_guidance";
        }
        if (lowerMessage.includes("relationship") ||
            lowerMessage.includes("marriage") ||
            lowerMessage.includes("family") ||
            lowerMessage.includes("friend") ||
            lowerMessage.includes("love")) {
            return "relationship_counseling";
        }
        if (lowerMessage.includes("pray") ||
            lowerMessage.includes("prayer") ||
            lowerMessage.includes("worship")) {
            return "spiritual_guidance";
        }
        return "general_counseling";
    }
    /**
     * Extract Bible verses from AI response
     */
    extractBibleVerses(response) {
        const versePattern = /([1-3]?\s*[A-Za-z]+\s+\d+:\d+(?:-\d+)?)/g;
        const matches = response.match(versePattern);
        return matches || [];
    }
    /**
     * Generate AI response for user message
     */
    generateResponse(userId, message, user) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const session = this.getOrCreateSession(userId);
                const messageType = this.analyzeMessageType(message);
                // Add user message to session
                session.messages.push({
                    role: "user",
                    content: message,
                    timestamp: new Date(),
                    messageType: messageType,
                });
                // Generate system prompt
                const systemPrompt = this.generateSystemPrompt(user, messageType);
                // Create conversation history
                const conversationHistory = session.messages
                    .slice(-10) // Last 10 messages for context
                    .map(msg => `${msg.role}: ${msg.content}`)
                    .join("\n");
                // Generate AI response
                if (!this.model) {
                    // Fallback response when API key is not available
                    const response = this.generateFallbackResponse(message, messageType);
                    const bibleVerses = this.extractBibleVerses(response);
                    const recommendations = this.extractRecommendations(response);
                    const followUpQuestions = this.extractFollowUpQuestions(response);
                    const emotionalSupport = this.extractEmotionalSupport(response);
                    // Add AI response to session
                    session.messages.push({
                        role: "assistant",
                        content: response,
                        timestamp: new Date(),
                        messageType: messageType,
                    });
                    session.updatedAt = new Date();
                    return {
                        response,
                        bibleVerses,
                        recommendations,
                        followUpQuestions,
                        emotionalSupport,
                    };
                }
                const prompt = `${systemPrompt}

**Conversation History**:
${conversationHistory}

**Current User Message**: ${message}

Please provide a compassionate, biblical response that includes:
1. Direct answer to the user's question/concern
2. 2-3 relevant Bible verses with full references
3. Practical spiritual recommendations
4. 1-2 follow-up questions
5. Emotional support and encouragement

**Response**:`;
                const result = yield this.model.generateContent(prompt);
                const response = result.response.text();
                // Extract Bible verses
                const bibleVerses = this.extractBibleVerses(response);
                // Generate recommendations (extract from response)
                const recommendations = this.extractRecommendations(response);
                // Generate follow-up questions
                const followUpQuestions = this.extractFollowUpQuestions(response);
                // Generate emotional support
                const emotionalSupport = this.extractEmotionalSupport(response);
                // Add AI response to session
                session.messages.push({
                    role: "assistant",
                    content: response,
                    timestamp: new Date(),
                    messageType: messageType,
                });
                session.updatedAt = new Date();
                return {
                    response,
                    bibleVerses,
                    recommendations,
                    followUpQuestions,
                    emotionalSupport,
                };
            }
            catch (error) {
                logger_1.default.error("AI chatbot error", {
                    error: error.message,
                    userId,
                });
                // Fallback response
                return {
                    response: "I'm here to help you with biblical guidance and spiritual support. Please try rephrasing your question, and I'll provide you with God's wisdom and comfort.",
                    bibleVerses: ["Psalm 46:1", "Matthew 11:28"],
                    recommendations: ["Take a moment to pray", "Read the Bible daily"],
                    followUpQuestions: [
                        "How can I pray for you today?",
                        "What specific area do you need guidance in?",
                    ],
                    emotionalSupport: "Remember, God loves you and is always with you. You are not alone in your struggles.",
                };
            }
        });
    }
    /**
     * Extract recommendations from AI response
     */
    extractRecommendations(response) {
        const recommendations = [];
        // Look for recommendation patterns
        const patterns = [
            /recommend\s+(.+?)(?=\.|$)/gi,
            /suggest\s+(.+?)(?=\.|$)/gi,
            /try\s+(.+?)(?=\.|$)/gi,
            /consider\s+(.+?)(?=\.|$)/gi,
        ];
        patterns.forEach(pattern => {
            const matches = response.match(pattern);
            if (matches) {
                recommendations.push(...matches.slice(0, 2));
            }
        });
        return recommendations.length > 0
            ? recommendations
            : [
                "Spend time in prayer and meditation",
                "Read relevant Bible passages daily",
                "Connect with your church community",
            ];
    }
    /**
     * Extract follow-up questions from AI response
     */
    extractFollowUpQuestions(response) {
        const questions = [];
        // Look for question patterns
        const questionPattern = /([^.!?]*\?)/g;
        const matches = response.match(questionPattern);
        if (matches) {
            questions.push(...matches.slice(-2)); // Last 2 questions
        }
        return questions.length > 0
            ? questions
            : [
                "How can I pray for you today?",
                "What specific guidance do you need?",
            ];
    }
    /**
     * Generate fallback response when AI is not available
     */
    generateFallbackResponse(message, messageType) {
        const responses = {
            biblical_question: "I understand you're seeking biblical guidance. While I'm currently in setup mode, I can share that God's Word is always available to guide us. Consider reading your Bible daily and praying for understanding. Remember, 'All Scripture is God-breathed and is useful for teaching, rebuking, correcting and training in righteousness' (2 Timothy 3:16).",
            emotional_support: "I hear that you're going through a difficult time. Please know that God loves you deeply and is always with you. As Psalm 34:18 says, 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.' You are not alone in your struggles.",
            health_guidance: "I understand you have health concerns. While I can offer spiritual support, please consult with healthcare professionals for medical advice. Remember that your body is a temple of the Holy Spirit (1 Corinthians 6:19-20), and God cares about your well-being.",
            relationship_counseling: "Relationships can be challenging, but God provides wisdom for all our interactions. Remember to love others as Christ loved us (John 13:34) and to be patient, kind, and forgiving. Prayer and seeking God's guidance can help in any relationship situation.",
            spiritual_guidance: "Spiritual growth is a journey that requires daily commitment. Spend time in prayer, read Scripture regularly, and connect with your church community. As James 4:8 says, 'Come near to God and he will come near to you.'",
            general_counseling: "I'm here to provide biblical guidance and spiritual support. God's Word offers wisdom for every situation in life. Remember that you are loved by God and He has a plan for your life (Jeremiah 29:11)."
        };
        return responses[messageType] || responses.general_counseling;
    }
    /**
     * Extract emotional support from AI response
     */
    extractEmotionalSupport(response) {
        const supportPatterns = [
            /(?:remember|know|understand).*?(?:God|Jesus|Lord).*?(?:loves?|cares?|with you)/i,
            /(?:you are not alone|you are loved|you are precious)/i,
            /(?:hope|comfort|peace|strength).*?(?:in Christ|from God)/i,
        ];
        for (const pattern of supportPatterns) {
            const match = response.match(pattern);
            if (match) {
                return match[0];
            }
        }
        return "Remember that God loves you and is always with you. You are not alone in your struggles.";
    }
    /**
     * Get chat history for user
     */
    getChatHistory(userId) {
        const session = this.chatSessions.get(userId);
        return session ? session.messages : [];
    }
    /**
     * Clear chat history for user
     */
    clearChatHistory(userId) {
        this.chatSessions.delete(userId);
    }
    /**
     * Get session statistics
     */
    getSessionStats(userId) {
        const session = this.chatSessions.get(userId);
        if (!session)
            return null;
        return {
            messageCount: session.messages.length,
            sessionDuration: Date.now() - session.context.sessionStartTime.getTime(),
            topics: session.context.previousTopics || [],
            lastActivity: session.updatedAt,
        };
    }
}
exports.AIChatbotService = AIChatbotService;
exports.default = new AIChatbotService();
