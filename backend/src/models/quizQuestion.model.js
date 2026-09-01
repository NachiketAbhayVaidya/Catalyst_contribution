import mongoose, { Schema } from "mongoose";
import { QUESTION_TYPES } from "../constants.js";

const quizQuestionSchema = new Schema(
  {
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    type: {
      type: String,
      enum: Object.values(QUESTION_TYPES),
      required: true,
    },
    prompt: { type: String, required: true, trim: true },
    options: [
      {
        text: { type: String, trim: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    correctShortAnswer: { type: String, trim: true, default: null },
    points: { type: Number, default: 1 },
    order: { type: Number, default: 0 },
    generatedByAi: { type: Boolean, default: false },
  },
  { timestamps: true },
);

quizQuestionSchema.index({ quiz: 1, order: 1 });

export const QuizQuestion = mongoose.model("QuizQuestion", quizQuestionSchema);
