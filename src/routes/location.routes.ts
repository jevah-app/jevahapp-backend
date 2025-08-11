import { Router } from "express";
import { getLocationSuggestions } from "../controllers/location.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/locations", asyncHandler(getLocationSuggestions));

export default router;
