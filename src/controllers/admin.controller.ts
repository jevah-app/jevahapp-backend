import { Request, Response } from "express";
import { User } from "../models/user.model";

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

/**
 * Update a user's role (admin only)
 */
export const updateUserRole = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
      res.status(400).json({ success: false, message: "Role is required" });
      return;
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};
