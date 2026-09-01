import mongoose, { Schema } from "mongoose";

const quizSchema = new Schema(
  {
    activity: { type: Schema.Types.ObjectId, ref: "Activity", required: true, unique: true },
    isDynamic: { type: Boolean, default: false },
    timeLimitMinutes: { type: Number, default: null },
    allowRetry: { type: Boolean, default: false },
    generationParams: {
      topic: { type: String, trim: true },
      difficulty: { type: String, trim: true },
      numQuestions: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export const Quiz = mongoose.model("Quiz", quizSchema);
