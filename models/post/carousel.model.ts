import { Schema, model } from "mongoose";

interface IPostCarousel {
  slides: {
    pageType: "start" | "slide" | "end";
    title: string;
    description: string;
    image: string;
  }[];

  customizations: {
    backgroundColor: string;
    fontColor: string;
    pageIndex: {
      visible: boolean;
    };
    title: {
      visible: boolean;
    };
    description: {
      visible: boolean;
    };
    content: {
      horizontal: "left" | "center" | "right";
      vertical: "top" | "center" | "bottom";
    };
    createdBy: {
      visible: boolean;
      horizontal: "left" | "center" | "right";
      vertical: "top" | "center" | "bottom";
    };
    size: {
      height: number;
      width: number;
    };
  };

  createdBy: any;
}

const slideSchema = new Schema({
  pageType: {
    type: String,
    required: true,
    enum: ["start", "slide", "end"],
  },
  title: { type: String },
  description: { type: String },
  image: { type: String },
});

const customizationsSchema = new Schema({
  backgroundColor: { type: String },
  fontColor: { type: String, default: "#000000" },
  pageIndex: { visible: { type: Boolean, default: true } },
  title: { visible: { type: Boolean } },
  description: { visible: { type: Boolean } },
  content: {
    horizontal: { type: String, enum: ["left", "center", "right"] },
    vertical: { type: String, enum: ["top", "center", "bottom"] },
  },
  createdBy: {
    visible: { type: Boolean },
    horizontal: { type: String, enum: ["left", "center", "right"] },
    vertical: { type: String, enum: ["top", "center", "bottom"] },
  },

  size: {
    height: { type: Number },
    width: { type: Number },
  },
});

const PostCarouselSchema = new Schema<IPostCarousel>({
  slides: [slideSchema],
  customizations: customizationsSchema,
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
});

const PostCarousel = model("PostCarousel", PostCarouselSchema);
export default PostCarousel;
