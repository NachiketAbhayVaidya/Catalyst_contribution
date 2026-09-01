import mongoose, { Schema } from "mongoose";

const competitionParticipantSchema = new Schema(
  {
    competition: { type: Schema.Types.ObjectId, ref: "Competition", required: true, index: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    score: { type: Number, default: 0 },
    rank: { type: Number, default: null },
    isWinner: { type: Boolean, default: false },
  },
  { timestamps: true },
);

competitionParticipantSchema.index({ competition: 1, student: 1 }, { unique: true });

export const CompetitionParticipant = mongoose.model(
  "CompetitionParticipant",
  competitionParticipantSchema,
);
