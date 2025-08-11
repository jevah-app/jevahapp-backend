import { UserDocument } from "../models/user.model";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: UserDocument;
      userRole?: string;
      file?: Express.Multer.File;
      files?: {
        [fieldname: string]: Express.Multer.File[];
      };
    }
  }
}
