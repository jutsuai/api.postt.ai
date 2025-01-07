const mongoose = require("mongoose");

const LinkedinProfileSchema = new mongoose.Schema(
  {
    createdBy: {
      type: String,
      required: true,
    },
    profileId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["organization", "person"],
    },
    organizationType: {
      type: String,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    cover: {
      type: String,
    },
    websiteUrl: {
      type: String,
    },
    linkedinUrl: {
      type: String,
    },
    description: {
      type: String,
    },
    tags: {
      type: [String],
    },
    industries: {
      type: [String],
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("LinkedinProfile", LinkedinProfileSchema);
