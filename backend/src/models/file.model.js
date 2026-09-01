import mongoose, { Schema } from "mongoose";

// Two-step upload: POST /files/upload stores this, then submissions/etc.
// reference it by id (client/src/api/files.js + assignments.js's fileIds).
const fileSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    publicId: { type: String, default: null },
    mimeType: { type: String, default: null },
    size: { type: Number, default: 0 },
    purpose: { type: String, default: null },
  },
  { timestamps: true },
);

export const File = mongoose.model("File", fileSchema);
