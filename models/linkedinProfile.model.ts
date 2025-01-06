import { Schema, model } from "mongoose";

interface ILinkedinProfile {
  createdBy: any;
  type: string;
  linkedinId: string;
  name: string;
  slug: string;
  logo?: string;
  cover?: string;
  description?: string;
  websiteUrl?: string;
  linkedinUrl?: string;
  tags?: string[];
  industries?: string[];
}

const LinkedinProfileSchema = new Schema<ILinkedinProfile>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["organization", "person"],
      required: true,
    }, // Profile type

    linkedinId: { type: String, required: true }, // Unique LinkedIn profile ID
    name: { type: String, required: true }, // Name
    slug: { type: String, required: true }, // Slug
    logo: String, // Avatar URL
    cover: String, // Cover URL
    description: String, // localizedDescription
    websiteUrl: String, // localizedWebsite

    linkedinUrl: String, // LinkedIn URL
    tags: [String], // Tags
    industries: [String], // industries
  },
  { timestamps: true } // Adds createdAt and updatedAt fields automatically
);

const LinkedinProfile = model<ILinkedinProfile>(
  "LinkedinProfile",
  LinkedinProfileSchema
);
export default LinkedinProfile;
