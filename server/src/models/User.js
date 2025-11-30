const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    airtableId: {
      type: String,
      required: true,
      unique: true,
    },
    email: String,
    name: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);