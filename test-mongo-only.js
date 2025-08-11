require("dotenv").config();

console.log("Testing MongoDB connection only...");

const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log("✅ Connection state:", mongoose.connection.readyState);
    mongoose.connection.close();
    console.log("✅ MongoDB connection closed");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });
