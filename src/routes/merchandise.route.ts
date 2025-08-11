import { Router } from "express";
import {
  createMerchandise,
  getMerchandiseById,
  searchMerchandise,
  getTrendingMerchandise,
  updateMerchandise,
  deleteMerchandise,
  addReview,
  getSellerMerchandise,
} from "../controllers/merchandise.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { apiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

/**
 * @swagger
 * /api/merchandise:
 *   post:
 *     summary: Create new merchandise listing
 *     tags: [Merchandise]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - price
 *               - stockQuantity
 *               - category
 *               - images
 *               - thumbnailUrl
 *               - shippingInfo
 *             properties:
 *               title:
 *                 type: string
 *                 description: Product title
 *               description:
 *                 type: string
 *                 description: Product description
 *               price:
 *                 type: number
 *                 description: Product price
 *               currency:
 *                 type: string
 *                 default: USD
 *                 description: Currency code
 *               stockQuantity:
 *                 type: integer
 *                 description: Available stock quantity
 *               category:
 *                 type: string
 *                 enum: [clothing, accessories, books, music, home, gifts, electronics, other]
 *                 description: Product category
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Product tags
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Product image URLs
 *               thumbnailUrl:
 *                 type: string
 *                 description: Thumbnail image URL
 *               specifications:
 *                 type: object
 *                 description: Product specifications
 *               shippingInfo:
 *                 type: object
 *                 required:
 *                   - weight
 *                   - dimensions
 *                   - shippingCost
 *                   - estimatedDelivery
 *                 properties:
 *                   weight:
 *                     type: number
 *                     description: Product weight in grams
 *                   dimensions:
 *                     type: object
 *                     required:
 *                       - length
 *                       - width
 *                       - height
 *                     properties:
 *                       length:
 *                         type: number
 *                       width:
 *                         type: number
 *                       height:
 *                         type: number
 *                   shippingCost:
 *                     type: number
 *                     description: Shipping cost
 *                   estimatedDelivery:
 *                     type: integer
 *                     description: Estimated delivery time in days
 *     responses:
 *       201:
 *         description: Merchandise created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/", verifyToken, apiRateLimiter, createMerchandise);

/**
 * @swagger
 * /api/merchandise/{merchandiseId}:
 *   get:
 *     summary: Get merchandise by ID
 *     tags: [Merchandise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchandiseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Merchandise ID
 *     responses:
 *       200:
 *         description: Merchandise details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Merchandise not found
 *       500:
 *         description: Internal server error
 */
router.get("/:merchandiseId", verifyToken, apiRateLimiter, getMerchandiseById);

/**
 * @swagger
 * /api/merchandise:
 *   get:
 *     summary: Search merchandise
 *     tags: [Merchandise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: priceRange
 *         schema:
 *           type: string
 *         description: Price range in JSON format with min and max values
 *       - in: query
 *         name: seller
 *         schema:
 *           type: string
 *         description: Filter by seller ID
 *       - in: query
 *         name: isAvailable
 *         schema:
 *           type: boolean
 *         description: Filter by availability
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *         description: Minimum rating
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, price, rating, popularity]
 *           default: createdAt
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Merchandise search results
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/", verifyToken, apiRateLimiter, searchMerchandise);

/**
 * @swagger
 * /api/merchandise/trending:
 *   get:
 *     summary: Get trending merchandise
 *     tags: [Merchandise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items to return
 *     responses:
 *       200:
 *         description: Trending merchandise retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/trending", verifyToken, apiRateLimiter, getTrendingMerchandise);

/**
 * @swagger
 * /api/merchandise/{merchandiseId}:
 *   put:
 *     summary: Update merchandise
 *     tags: [Merchandise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchandiseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Merchandise ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stockQuantity:
 *                 type: integer
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               thumbnailUrl:
 *                 type: string
 *               specifications:
 *                 type: object
 *               shippingInfo:
 *                 type: object
 *     responses:
 *       200:
 *         description: Merchandise updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Merchandise not found
 *       500:
 *         description: Internal server error
 */
router.put("/:merchandiseId", verifyToken, apiRateLimiter, updateMerchandise);

/**
 * @swagger
 * /api/merchandise/{merchandiseId}:
 *   delete:
 *     summary: Delete merchandise
 *     tags: [Merchandise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchandiseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Merchandise ID
 *     responses:
 *       200:
 *         description: Merchandise deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Merchandise not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:merchandiseId",
  verifyToken,
  apiRateLimiter,
  deleteMerchandise
);

/**
 * @swagger
 * /api/merchandise/{merchandiseId}/review:
 *   post:
 *     summary: Add review to merchandise
 *     tags: [Merchandise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchandiseId
 *         required: true
 *         schema:
 *           type: string
 *         description: Merchandise ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating (1-5 stars)
 *               comment:
 *                 type: string
 *                 description: Optional review comment
 *     responses:
 *       200:
 *         description: Review added successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Merchandise not found
 *       500:
 *         description: Internal server error
 */
router.post("/:merchandiseId/review", verifyToken, apiRateLimiter, addReview);

/**
 * @swagger
 * /api/merchandise/seller/{sellerId}:
 *   get:
 *     summary: Get seller's merchandise
 *     tags: [Merchandise]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Seller's merchandise retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/seller/:sellerId",
  verifyToken,
  apiRateLimiter,
  getSellerMerchandise
);

export default router;
