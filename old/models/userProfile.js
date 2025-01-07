const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },

    // Basic Information
    name: {
      type: String,
      required: true,
    },
    targetAudience: {
      type: String, // e.g., "Young professionals in tech"
      required: true,
    },
    industry: {
      type: String,
      required: true,
    },
    valueProposition: {
      type: String, // e.g., "Affordable, eco-friendly solutions for startups"
      required: true,
    },

    // Branding
    brandPersonality: String, // e.g., "Professional, approachable, innovative"

    preferredTone: {
      type: String, // e.g., "Casual", "Formal", "Inspirational"
      enum: ["Casual", "Formal", "Humorous", "Inspirational", "Other"],
    },
    exampleBrands: [String], // e.g., ["Apple", "Google", "Tesla"]

    // Content Preferences
    contentType: {
      type: [String], // e.g., ["Educational", "Promotional", "Entertaining"]
      enum: ["Educational", "Promotional", "Entertaining", "Other"],
    },

    callToAction: String, // e.g., "Sign up for our newsletter"
    hashtags: [String], // e.g., ["#innovation", "#blockchain"]
    keywords: [String], // e.g., ["blockchain", "decentralization"]

    // Posting Preferences
    postFrequency: {
      type: String, // e.g., "Daily", "Weekly", "Monthly"
      enum: ["Daily", "Weekly", "Monthly", "Custom"],
    },
    bestTimesToPost: [String], // e.g., ["8 AM", "6 PM"]

    // Visuals
    logoUrl: String, // URL to the logo
    coverUrl: String, // URL to the cover image
    brandingColors: [String], // Hex codes, e.g., ["#FF5733", "#33FF57"]

    // Examples and Metrics
    exampleContent: [String], // URLs or text of example content the user likes
    priorityMetrics: [String], // e.g., ["Engagement", "Reach", "Conversions"]

    // Other optional fields
    additionalNotes: String, // Any extra information provided by the user
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", ProfileSchema);
