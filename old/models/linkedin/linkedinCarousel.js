const { Schema, model } = require("mongoose");
const { ObjectId } = Schema.Types;

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

const LinkedinCarouselSchema = new Schema(
  {
    slides: [slideSchema],
    customizations: customizationsSchema,
    createdBy: { type: ObjectId, ref: "User", required: false },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = model("LinkedinCarousel", LinkedinCarouselSchema);
