import { Schema, Types, model } from "mongoose";

interface ISchedule {
  createdBy: Types.ObjectId;
  postId: any;
  platform: string; // e.g., 'linkedin'
  status: "scheduled" | "published" | "failed" | "duplicated";
  scheduledAt: Date;
  publishedAt?: Date;
}

const ScheduleSchema = new Schema<ISchedule>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      unique: true,
    },
    platform: { type: String, required: true, default: "linkedin" },
    status: {
      type: String,
      required: true,
      enum: ["scheduled", "published", "failed", "duplicated"],
    },
    scheduledAt: { type: Date, required: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

const Schedule = model("Schedule", ScheduleSchema);
export default Schedule;
