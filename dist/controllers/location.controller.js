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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocationSuggestions = void 0;
const location_model_1 = require("../models/location.model");
const escapeRegex = (input) => input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const getLocationSuggestions = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const query = req.query.q;
        if (!query || query.trim() === "") {
            return res.status(400).json({ message: "Missing query parameter `q`." });
        }
        const regex = new RegExp("^" + escapeRegex(query), "i");
        const results = yield location_model_1.StateCity.find({
            $or: [{ state: regex }, { city: regex }],
        })
            .limit(10)
            .select({ state: 1, city: 1, _id: 0 });
        return res.status(200).json(results);
    }
    catch (error) {
        console.error("Error fetching location suggestions:", error);
        next(error);
    }
});
exports.getLocationSuggestions = getLocationSuggestions;
