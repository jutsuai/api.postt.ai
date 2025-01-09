import { Schema, model } from "mongoose";

interface IPost {
  platform: string;
  linkedinPostId: string;
  commentary: string;
  media: {
    name: string;
    fileType: string;
    url: string;
  };
  type: "text" | "image" | "video" | "carousel";

  author: string;
  authorType: "organization" | "person";
  createdBy: any;

  status: "draft" | "scheduled" | "published" | "failed";
  // scheduled: boolean;
  // published: boolean;
  // scheduledAt: Date;
  // publishedAt: Date;
}

const PostSchema = new Schema<IPost>({
  platform: { type: String, default: "linkedin" },
  linkedinPostId: { type: String, required: false },
  commentary: { type: String, required: false },

  media: {
    name: { type: String, required: false },
    fileType: { type: String, required: false },
    url: { type: String, required: false },
  },

  type: {
    type: String,
    required: true,
    enum: ["text", "image", "video", "carousel"],
  },

  author: { type: String, required: false },
  authorType: { type: String, required: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

  status: {
    type: String,
    required: false,
    enum: ["draft", "scheduled", "published", "failed"],
  },
  // scheduled: { type: Boolean, required: false },
  // published: { type: Boolean, required: false },
  // scheduledAt: { type: Date, required: false },
  // publishedAt: { type: Date, required: false },
});

const Post = model("Post", PostSchema);
export default Post;
