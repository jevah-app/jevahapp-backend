import jwt, { SignOptions } from "jsonwebtoken";
import { Types } from "mongoose";

export interface JwtPayload {
  userId: string | Types.ObjectId;
}

export const signToken = (payload: JwtPayload): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN ||
      "30d") as SignOptions["expiresIn"],
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
};
