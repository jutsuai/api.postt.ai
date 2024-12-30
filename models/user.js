const mongoose = require("mongoose");
const { isEmail } = require("validator");

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, required: false, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      email: {
        type: String,
        required: false,
        validate: [isEmail, "invalid email"],
      },
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    avatar: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isActive: { type: Boolean, default: false },
    accessToken: String,

    // For social login
    linkedin: {
      id: String,
      username: String,
      email: String,
      avatar: String,

      tokens: {
        access_token: String,
        expires_in: Number,
        refresh_token: String, // 60 days - 5183999
        refresh_token_expires_in: Number, // 365 days - 31536059
        scope: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
