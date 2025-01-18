import { Schema, Types, model } from "mongoose";

interface IPost {
  platform: string;
  author: string;
  authorType: "organization" | "person";
  linkedinPostId: string;

  prompt: string;
  commentary: string;
  media: {
    name: string;
    fileType: string;
    url: string;
  };
  type: "text" | "image" | "video" | "carousel" | "document";
  contentReference?: Types.ObjectId;

  createdBy: Types.ObjectId;
  status: "draft" | "scheduled" | "published" | "failed";
}

const PostSchema = new Schema<IPost>(
  {
    platform: { type: String, default: "linkedin" },
    author: { type: String, required: false },
    authorType: {
      type: String,
      required: false,
      enum: ["organization", "person"],
    },
    linkedinPostId: { type: String, required: false },

    prompt: { type: String, required: false },
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
    contentReference: {
      type: Schema.Types.ObjectId,
      required: function (this: IPost) {
        return (
          this.type === "carousel" ||
          this.type === "video" ||
          this.type === "document"
        );
      },
      refPath: "type", // Dynamic reference based on `type` field
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      required: false,
      enum: [
        "draft",
        "scheduled",
        "published",
        "failed",
        "failed-download",
        "failed-upload",
        "failed-register",
        "failed-publish",
      ],
      default: "draft",
    },
  },
  { timestamps: true }
);

const Post = model("Post", PostSchema);
export default Post;
