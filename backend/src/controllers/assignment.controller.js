import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { Assignment } from "../models/assignment.model.js";
import { Activity } from "../models/activity.model.js";
import { Submission } from "../models/submission.model.js";
import { AIReview } from "../models/aiReview.model.js";
import { Student } from "../models/student.model.js";
import { ActivityEnrollment } from "../models/activityEnrollment.model.js";
import { File } from "../models/file.model.js";
import { toPublicAssignment, toPublicSubmission } from "../utils/serializers.js";

async function getStudentOrThrow(userId) {
  const student = await Student.findOne({ user: userId });
  if (!student) throw new ApiError(404, "Student profile not found");
  return student;
}

const getAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const activity = await Activity.findById(assignment.activity);
  const student = await Student.findOne({ user: req.user._id });
  const attemptsUsed = student
    ? await Submission.countDocuments({ activity: activity._id, student: student._id })
    : 0;

  return res.status(200).json({ success: true, data: toPublicAssignment(assignment, activity, { attemptsUsed }) });
});

const getSubmissions = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const student = await getStudentOrThrow(req.user._id);
  const submissions = await Submission.find({ activity: assignment.activity, student: student._id }).sort({ attemptNumber: 1 });

  const data = await Promise.all(
    submissions.map(async (s) => {
      const review = await AIReview.findOne({ submission: s._id });
      const feedbackAvailable = s.officialScore !== null && s.officialScore !== undefined && !!review;
      return toPublicSubmission(s, { feedbackAvailable, aiSuggestedScore: review?.suggestedScore ?? null });
    }),
  );

  return res.status(200).json({ success: true, data });
});

const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");

  const activity = await Activity.findById(assignment.activity);
  const student = await getStudentOrThrow(req.user._id);

  const attemptsUsed = await Submission.countDocuments({ activity: activity._id, student: student._id });
  if (attemptsUsed >= assignment.maxAttempts) {
    throw new ApiError(422, "You have used all available attempts for this assignment");
  }

  const { text, link, fileIds } = req.body;
  const files = fileIds?.length
    ? (await File.find({ _id: { $in: fileIds }, owner: req.user._id })).map((f) => ({
        url: f.fileUrl,
        publicId: f.publicId,
        originalName: f.fileName,
      }))
    : [];

  const submission = await Submission.create({
    activity: activity._id,
    student: student._id,
    attemptNumber: attemptsUsed + 1,
    textContent: text ?? null,
    link: link ?? null,
    files,
    submittedAt: new Date(),
  });

  await ActivityEnrollment.findOneAndUpdate(
    { activity: activity._id, student: student._id },
    { $setOnInsert: { activity: activity._id, student: student._id }, $set: { status: "in_progress" } },
    { upsert: true },
  );

  return res.status(201).json({
    success: true,
    data: { submissionId: submission._id, status: "SUBMITTED", submittedAt: submission.submittedAt },
    message: "Submitted",
  });
});

const getSubmissionReview = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) throw new ApiError(404, "Submission not found");

  const review = await AIReview.findOne({ submission: submission._id });
  if (!review) {
    return res.status(200).json({ success: true, data: { status: "PENDING" } });
  }

  return res.status(200).json({
    success: true,
    data: {
      status: submission.officialScore !== null && submission.officialScore !== undefined ? "COMPLETED" : "PENDING",
      summary: review.summary ?? "",
      strengths: review.strengths ?? [],
      improvements: review.weaknesses ?? [],
      aiSuggestedScore: review.suggestedScore ?? null,
      rubric: (review.rubricAnalysis ?? []).map((r) => ({
        criterion: r.criterion,
        score: r.score,
        maxScore: r.maxScore,
        feedback: r.comment,
      })),
    },
  });
});

export { getAssignment, getSubmissions, submitAssignment, getSubmissionReview };
