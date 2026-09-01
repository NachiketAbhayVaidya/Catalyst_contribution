import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

export const Admin = mongoose.model("Admin", adminSchema);
