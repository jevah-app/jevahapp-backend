import { Request, Response } from "express";
import { Log } from "../models/log.model";

export const viewAuditLogs = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const logs = await Log.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("performedBy", "email role");

    response.status(200).json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Fetch logs error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};
