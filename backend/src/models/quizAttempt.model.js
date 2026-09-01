import mongoose, { Schema } from "mongoose";

const quizAttemptSchema = new Schema(
  {
    quiz: { type: Schema.Types.ObjectId, ref: "Quiz", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: "QuizQuestion", required: true },
        selectedOptionIds: [{ type: Schema.Types.ObjectId }],
        shortAnswerText: { type: String, trim: true, default: null },
        isCorrect: { type: Boolean, default: false },
        pointsEarned: { type: Number, default: 0 },
      },
    ],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, default: null },
    xpAwarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ quiz: 1, student: 1, createdAt: -1 });

export const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema);
