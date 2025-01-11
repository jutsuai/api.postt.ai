import { Schema, Types, model } from "mongoose";

interface IPost {
  platform: string;
  linkedinPostId: string;
  commentary: string;
  media: {
    name: string;
    fileType: string;
    url: string;
  };
  type: "text" | "image" | "video" | "carousel" | "document";

  author: string;
  authorType: "organization" | "person";
  createdBy: Types.ObjectId;

  status: "draft" | "scheduled" | "published" | "failed";
  contentReference?: Types.ObjectId;
}

const PostSchema = new Schema<IPost>(
  {
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
    authorType: {
      type: String,
      required: false,
      enum: ["organization", "person"],
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    status: {
      type: String,
      required: false,
      enum: ["draft", "scheduled", "published", "failed"],
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
  },
  { timestamps: true }
);

const Post = model("Post", PostSchema);
export default Post;
