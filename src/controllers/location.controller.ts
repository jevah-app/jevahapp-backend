import { Request, Response, NextFunction } from "express";
import { StateCity } from "../models/location.model";

const escapeRegex = (input: string): string =>
  input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getLocationSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Missing query parameter `q`." });
    }

    const regex = new RegExp("^" + escapeRegex(query), "i");

    const results = await StateCity.find({
      $or: [{ state: regex }, { city: regex }],
    })
      .limit(10)
      .select({ state: 1, city: 1, _id: 0 });

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching location suggestions:", error);
    next(error);
  }
};
