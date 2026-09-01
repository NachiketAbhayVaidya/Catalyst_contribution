// Report builders for the admin "Reports" tool.
//
// Each builder turns the validated filter set into an aggregation *spec*
// ({ model, pipeline, columns, sortable, summary }) rather than running the
// query itself. A single executor then applies sorting, pagination and the
// summary roll-up, so the paginated table view and the CSV export always
// return byte-identical rows for the same filters — the export can't drift
// from what the admin previewed.
import mongoose from "mongoose";

import { Student } from "../../models/student.model.js";
import { Submission } from "../../models/submission.model.js";
import { Activity } from "../../models/activity.model.js";
import { XPTransaction } from "../../models/xpTransaction.model.js";
import { REPORT_TYPES, ACTIVE_WINDOW_MS, ENROLLMENT_STATUS } from "../../constants.js";
import { ACTIVITY_TYPE_TO_FRONTEND, ACTIVITY_TYPE_FROM_FRONTEND } from "../../utils/serializers.js";

// A CSV export skips pagination, so it needs its own ceiling to keep one
// click from pulling an unbounded collection into memory.
export const EXPORT_ROW_CAP = 10_000;

const oid = (v) => new mongoose.Types.ObjectId(String(v));

// Escape user text before it becomes a regex — otherwise a search for "a+b"
// is a malformed pattern (or a catastrophic one).
const searchRegex = (term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

function dateRange(from, to) {
  if (!from && !to) return null;
  const range = {};
  if (from) range.$gte = from;
  if (to) range.$lte = to;
  return range;
}

// Same range, expressed as aggregation operators for use inside $cond/$expr.
function rangeConditions(field, from, to) {
  const conditions = [];
  if (from) conditions.push({ $gte: [field, from] });
  if (to) conditions.push({ $lte: [field, to] });
  return conditions;
}

const activeSince = () => new Date(Date.now() - ACTIVE_WINDOW_MS);

// MongoDB's $round rounds halves to even (94.5 -> 94) while JS Math.round,
// used for the summary roll-ups, rounds halves up (94.5 -> 95). Left alone the
// same average renders differently in a row than in the tile above it, so all
// row-level rounding goes through this half-up form instead. Null-safe, and
// only ever applied to non-negative values (scores, percentages).
const roundHalfUp = (expr) => ({
  $cond: [{ $eq: [{ $ifNull: [expr, null] }, null] }, null, { $floor: { $add: [expr, 0.5] } }],
});

// ---------------------------------------------------------------------------
// 1. Student performance
// ---------------------------------------------------------------------------
// Which students appear is driven by team/status/XP filters; the date range
// scopes the *metrics* (XP earned, activities completed, submissions, average
// score) to that window rather than hiding students entirely. A report for
// "last month" should still list a student who did nothing — that's the
// finding, not a row to omit.
function buildStudentPerformance(filters, { studentObjectId }) {
  const { from, to } = filters;
  const cutoff = activeSince();

  const match = {};
  if (filters.teamId) match.team = oid(filters.teamId);
  if (studentObjectId) match._id = studentObjectId;
  if (filters.minXp != null || filters.maxXp != null) {
    match.xp = {};
    if (filters.minXp != null) match.xp.$gte = filters.minXp;
    if (filters.maxXp != null) match.xp.$lte = filters.maxXp;
  }
  if (filters.status === "ACTIVE") {
    match.lastActivityDate = { $gte: cutoff };
  } else if (filters.status === "INACTIVE") {
    match.$or = [{ lastActivityDate: null }, { lastActivityDate: { $lt: cutoff } }];
  }

  const xpMatch = { $expr: { $and: [{ $eq: ["$student", "$$sid"] }, { $gt: ["$amount", 0] }] } };
  const xpRange = dateRange(from, to);
  if (xpRange) xpMatch.createdAt = xpRange;

  const subMatch = { $expr: { $eq: ["$student", "$$sid"] } };
  const subRange = dateRange(from, to);
  if (subRange) subMatch.submittedAt = subRange;

  const completedMatch = {
    $expr: {
      $and: [
        { $eq: ["$student", "$$sid"] },
        { $eq: ["$status", ENROLLMENT_STATUS.COMPLETED] },
        ...rangeConditions("$completedAt", from, to),
      ],
    },
  };

  const pipeline = [
    { $match: match },
    { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
    { $unwind: "$user" },
    { $match: { "user.role": "student" } },
    { $lookup: { from: "teams", localField: "team", foreignField: "_id", as: "team" } },
    { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },
  ];

  if (filters.search) {
    const rx = searchRegex(filters.search);
    pipeline.push({ $match: { $or: [{ "user.fullName": rx }, { "user.email": rx }] } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "xptransactions",
        let: { sid: "$_id" },
        pipeline: [{ $match: xpMatch }, { $group: { _id: null, total: { $sum: "$amount" } } }],
        as: "xpAgg",
      },
    },
    {
      $lookup: {
        from: "submissions",
        let: { sid: "$_id" },
        pipeline: [
          { $match: subMatch },
          { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: "$officialScore" } } },
        ],
        as: "subAgg",
      },
    },
    {
      $lookup: {
        from: "activityenrollments",
        let: { sid: "$_id" },
        pipeline: [{ $match: completedMatch }, { $count: "count" }],
        as: "completedAgg",
      },
    },
    {
      $project: {
        _id: 0,
        id: "$user._id",
        name: "$user.fullName",
        email: "$user.email",
        team: { $ifNull: ["$team.name", null] },
        level: 1,
        totalXp: "$xp",
        xpInRange: { $ifNull: [{ $arrayElemAt: ["$xpAgg.total", 0] }, 0] },
        activitiesCompleted: { $ifNull: [{ $arrayElemAt: ["$completedAgg.count", 0] }, 0] },
        submissions: { $ifNull: [{ $arrayElemAt: ["$subAgg.count", 0] }, 0] },
        avgScore: roundHalfUp({ $arrayElemAt: ["$subAgg.avgScore", 0] }),
        currentStreak: 1,
        lastActive: "$lastActivityDate",
        status: {
          $cond: [{ $gte: [{ $ifNull: ["$lastActivityDate", new Date(0)] }, cutoff] }, "ACTIVE", "INACTIVE"],
        },
      },
    },
  );

  return {
    model: Student,
    pipeline,
    columns: [
      { key: "name", label: "Student", format: "text" },
      { key: "email", label: "Email", format: "text" },
      { key: "team", label: "Team", format: "text" },
      { key: "level", label: "Level", format: "number" },
      { key: "totalXp", label: "Total XP", format: "number" },
      { key: "xpInRange", label: "XP in range", format: "number" },
      { key: "activitiesCompleted", label: "Completed", format: "number" },
      { key: "submissions", label: "Submissions", format: "number" },
      { key: "avgScore", label: "Avg score", format: "score" },
      { key: "currentStreak", label: "Streak", format: "number" },
      { key: "lastActive", label: "Last active", format: "date" },
      { key: "status", label: "Status", format: "badge" },
    ],
    sortable: {
      name: "name",
      totalXp: "totalXp",
      xpInRange: "xpInRange",
      activitiesCompleted: "activitiesCompleted",
      submissions: "submissions",
      avgScore: "avgScore",
      currentStreak: "currentStreak",
      lastActive: "lastActive",
      level: "level",
    },
    defaultSort: { xpInRange: -1 },
    summary: {
      group: {
        students: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "ACTIVE"] }, 1, 0] } },
        xpInRange: { $sum: "$xpInRange" },
        activitiesCompleted: { $sum: "$activitiesCompleted" },
        avgScore: { $avg: "$avgScore" },
      },
      format: (d) => [
        { label: "Students", value: d.students, format: "number" },
        { label: "Active", value: d.active, format: "number" },
        { label: "XP in range", value: d.xpInRange, format: "number" },
        { label: "Activities completed", value: d.activitiesCompleted, format: "number" },
        { label: "Avg score", value: d.avgScore == null ? null : Math.round(d.avgScore), format: "score" },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// 2. Submissions / grading
// ---------------------------------------------------------------------------
function buildSubmissions(filters, { studentObjectId }) {
  const match = {};
  const range = dateRange(filters.from, filters.to);
  if (range) match.submittedAt = range;
  if (studentObjectId) match.student = studentObjectId;

  // "Reviewed" means an admin set an official score — the same rule
  // toPublicAdminSubmission uses, kept identical so the two views agree.
  if (filters.status === "REVIEWED") match.officialScore = { $ne: null };
  else if (filters.status === "PENDING") match.officialScore = null;

  if (filters.minScore != null || filters.maxScore != null) {
    match.officialScore = { ...(match.officialScore ?? {}), $ne: null };
    if (filters.minScore != null) match.officialScore.$gte = filters.minScore;
    if (filters.maxScore != null) match.officialScore.$lte = filters.maxScore;
  }

  const pipeline = [
    { $match: match },
    { $lookup: { from: "activities", localField: "activity", foreignField: "_id", as: "activity" } },
    { $unwind: "$activity" },
  ];

  if (filters.courseId) pipeline.push({ $match: { "activity.course": oid(filters.courseId) } });
  if (filters.activityType) {
    pipeline.push({ $match: { "activity.type": ACTIVITY_TYPE_FROM_FRONTEND[filters.activityType] } });
  }
  if (filters.mandatory != null) pipeline.push({ $match: { "activity.mandatory": filters.mandatory } });

  pipeline.push(
    { $lookup: { from: "courses", localField: "activity.course", foreignField: "_id", as: "course" } },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "students", localField: "student", foreignField: "_id", as: "student" } },
    { $unwind: "$student" },
    { $lookup: { from: "users", localField: "student.user", foreignField: "_id", as: "studentUser" } },
    { $unwind: "$studentUser" },
    { $lookup: { from: "users", localField: "scoredBy", foreignField: "_id", as: "reviewer" } },
    { $unwind: { path: "$reviewer", preserveNullAndEmptyArrays: true } },
  );

  if (filters.teamId) pipeline.push({ $match: { "student.team": oid(filters.teamId) } });
  if (filters.search) {
    const rx = searchRegex(filters.search);
    pipeline.push({ $match: { $or: [{ "studentUser.fullName": rx }, { "activity.title": rx }] } });
  }

  pipeline.push({
    $project: {
      _id: 0,
      id: "$_id",
      student: "$studentUser.fullName",
      email: "$studentUser.email",
      activity: "$activity.title",
      course: { $ifNull: ["$course.title", null] },
      internalType: "$activity.type",
      mandatory: { $cond: ["$activity.mandatory", "Yes", "No"] },
      attempt: "$attemptNumber",
      submittedAt: 1,
      dueDate: "$activity.dueDate",
      status: { $cond: [{ $ne: [{ $ifNull: ["$officialScore", null] }, null] }, "REVIEWED", "PENDING"] },
      score: { $ifNull: ["$officialScore", null] },
      xp: "$activity.xp",
      reviewer: { $ifNull: ["$reviewer.fullName", null] },
      scoredAt: { $ifNull: ["$scoredAt", null] },
    },
  });

  return {
    model: Submission,
    pipeline,
    // Internal enum values are translated to the frontend's casing on the way
    // out, the same way the serializers do it for every other admin endpoint.
    postProcess: (rows) =>
      rows.map(({ internalType, ...row }) => ({
        ...row,
        type: ACTIVITY_TYPE_TO_FRONTEND[internalType] ?? internalType,
      })),
    columns: [
      { key: "student", label: "Student", format: "text" },
      { key: "activity", label: "Activity", format: "text" },
      { key: "course", label: "Course", format: "text" },
      { key: "type", label: "Type", format: "type" },
      { key: "mandatory", label: "Mandatory", format: "text" },
      { key: "attempt", label: "Attempt", format: "number" },
      { key: "submittedAt", label: "Submitted", format: "date" },
      { key: "dueDate", label: "Due", format: "date" },
      { key: "status", label: "Status", format: "badge" },
      { key: "score", label: "Score", format: "score" },
      { key: "xp", label: "XP", format: "number" },
      { key: "reviewer", label: "Reviewed by", format: "text" },
      { key: "scoredAt", label: "Reviewed on", format: "date" },
    ],
    sortable: {
      student: "student",
      activity: "activity",
      submittedAt: "submittedAt",
      dueDate: "dueDate",
      score: "score",
      scoredAt: "scoredAt",
      status: "status",
    },
    defaultSort: { submittedAt: -1 },
    summary: {
      group: {
        total: { $sum: 1 },
        reviewed: { $sum: { $cond: [{ $eq: ["$status", "REVIEWED"] }, 1, 0] } },
        avgScore: { $avg: "$score" },
        late: {
          $sum: {
            $cond: [
              { $and: [{ $ne: [{ $ifNull: ["$dueDate", null] }, null] }, { $gt: ["$submittedAt", "$dueDate"] }] },
              1,
              0,
            ],
          },
        },
      },
      format: (d) => [
        { label: "Submissions", value: d.total, format: "number" },
        { label: "Reviewed", value: d.reviewed, format: "number" },
        { label: "Pending", value: d.total - d.reviewed, format: "number" },
        { label: "Avg score", value: d.avgScore == null ? null : Math.round(d.avgScore), format: "score" },
        { label: "Submitted late", value: d.late, format: "number" },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// 3. Course & activity completion
// ---------------------------------------------------------------------------
// One row per activity, carrying its parent course. Enrolment totals are
// lifetime (an activity's cohort doesn't change with the report window) while
// completions are counted inside the range, so "completed this month" is what
// the rate actually measures.
function buildCourseCompletion(filters) {
  const { from, to } = filters;

  const match = { archivedAt: null };
  if (filters.courseId) match.course = oid(filters.courseId);
  if (filters.activityType) match.type = ACTIVITY_TYPE_FROM_FRONTEND[filters.activityType];
  if (filters.mandatory != null) match.mandatory = filters.mandatory;
  if (filters.status) match.status = filters.status.toLowerCase();

  const completedCond = {
    $and: [{ $eq: ["$status", ENROLLMENT_STATUS.COMPLETED] }, ...rangeConditions("$completedAt", from, to)],
  };

  const subMatch = { $expr: { $eq: ["$activity", "$$aid"] } };
  const subRange = dateRange(from, to);
  if (subRange) subMatch.submittedAt = subRange;

  const pipeline = [
    { $match: match },
    { $lookup: { from: "courses", localField: "course", foreignField: "_id", as: "course" } },
    { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
  ];

  if (filters.search) {
    const rx = searchRegex(filters.search);
    pipeline.push({ $match: { $or: [{ title: rx }, { "course.title": rx }] } });
  }

  pipeline.push(
    {
      $lookup: {
        from: "activityenrollments",
        let: { aid: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$activity", "$$aid"] } } },
          {
            $group: {
              _id: null,
              enrolled: { $sum: 1 },
              completed: { $sum: { $cond: [completedCond, 1, 0] } },
              overdue: { $sum: { $cond: [{ $eq: ["$status", ENROLLMENT_STATUS.OVERDUE] }, 1, 0] } },
            },
          },
        ],
        as: "enr",
      },
    },
    {
      $lookup: {
        from: "submissions",
        let: { aid: "$_id" },
        pipeline: [
          { $match: subMatch },
          { $group: { _id: null, count: { $sum: 1 }, avgScore: { $avg: "$officialScore" } } },
        ],
        as: "subAgg",
      },
    },
    {
      $addFields: {
        enrolledCount: { $ifNull: [{ $arrayElemAt: ["$enr.enrolled", 0] }, 0] },
        completedCount: { $ifNull: [{ $arrayElemAt: ["$enr.completed", 0] }, 0] },
        overdueCount: { $ifNull: [{ $arrayElemAt: ["$enr.overdue", 0] }, 0] },
      },
    },
    {
      $project: {
        _id: 0,
        id: "$_id",
        title: 1,
        course: { $ifNull: ["$course.title", null] },
        internalType: "$type",
        mandatory: { $cond: ["$mandatory", "Yes", "No"] },
        state: { $toUpper: "$status" },
        dueDate: { $ifNull: ["$dueDate", null] },
        xp: 1,
        enrolled: "$enrolledCount",
        completed: "$completedCount",
        completionRate: {
          $cond: [
            { $gt: ["$enrolledCount", 0] },
            roundHalfUp({ $multiply: [{ $divide: ["$completedCount", "$enrolledCount"] }, 100] }),
            0,
          ],
        },
        submissions: { $ifNull: [{ $arrayElemAt: ["$subAgg.count", 0] }, 0] },
        avgScore: roundHalfUp({ $arrayElemAt: ["$subAgg.avgScore", 0] }),
        overdue: "$overdueCount",
      },
    },
  );

  return {
    model: Activity,
    pipeline,
    postProcess: (rows) =>
      rows.map(({ internalType, ...row }) => ({
        ...row,
        type: ACTIVITY_TYPE_TO_FRONTEND[internalType] ?? internalType,
      })),
    columns: [
      { key: "title", label: "Activity", format: "text" },
      { key: "course", label: "Course", format: "text" },
      { key: "type", label: "Type", format: "type" },
      { key: "mandatory", label: "Mandatory", format: "text" },
      { key: "state", label: "State", format: "badge" },
      { key: "dueDate", label: "Due", format: "date" },
      { key: "xp", label: "XP", format: "number" },
      { key: "enrolled", label: "Enrolled", format: "number" },
      { key: "completed", label: "Completed", format: "number" },
      { key: "completionRate", label: "Completion", format: "percent" },
      { key: "submissions", label: "Submissions", format: "number" },
      { key: "avgScore", label: "Avg score", format: "score" },
      { key: "overdue", label: "Overdue", format: "number" },
    ],
    sortable: {
      title: "title",
      course: "course",
      dueDate: "dueDate",
      enrolled: "enrolled",
      completed: "completed",
      completionRate: "completionRate",
      avgScore: "avgScore",
      overdue: "overdue",
      xp: "xp",
    },
    defaultSort: { completionRate: -1 },
    summary: {
      group: {
        activities: { $sum: 1 },
        enrolled: { $sum: "$enrolled" },
        completed: { $sum: "$completed" },
        overdue: { $sum: "$overdue" },
        avgScore: { $avg: "$avgScore" },
      },
      format: (d) => [
        { label: "Activities", value: d.activities, format: "number" },
        { label: "Enrolments", value: d.enrolled, format: "number" },
        { label: "Completions", value: d.completed, format: "number" },
        {
          label: "Completion rate",
          // Rolled up from the totals, not averaged across rows — a 1-student
          // activity shouldn't weigh as much as a 200-student one.
          value: d.enrolled ? Math.round((d.completed / d.enrolled) * 100) : 0,
          format: "percent",
        },
        { label: "Overdue", value: d.overdue, format: "number" },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// 4. XP ledger
// ---------------------------------------------------------------------------
// The append-only audit trail, straight out of XPTransaction — this is the
// report you hand someone disputing a score.
function buildXpLedger(filters, { studentObjectId }) {
  const match = {};
  const range = dateRange(filters.from, filters.to);
  if (range) match.createdAt = range;
  if (studentObjectId) match.student = studentObjectId;
  if (filters.source) match.source = filters.source;

  const pipeline = [
    { $match: match },
    { $lookup: { from: "students", localField: "student", foreignField: "_id", as: "student" } },
    { $unwind: "$student" },
    { $lookup: { from: "users", localField: "student.user", foreignField: "_id", as: "studentUser" } },
    { $unwind: "$studentUser" },
    { $lookup: { from: "teams", localField: "student.team", foreignField: "_id", as: "team" } },
    { $unwind: { path: "$team", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "activities", localField: "activity", foreignField: "_id", as: "activity" } },
    { $unwind: { path: "$activity", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "users", localField: "adminOverride.admin", foreignField: "_id", as: "overrideAdmin" } },
    { $unwind: { path: "$overrideAdmin", preserveNullAndEmptyArrays: true } },
  ];

  if (filters.teamId) pipeline.push({ $match: { "student.team": oid(filters.teamId) } });
  if (filters.search) {
    const rx = searchRegex(filters.search);
    pipeline.push({ $match: { $or: [{ "studentUser.fullName": rx }, { reason: rx }] } });
  }

  pipeline.push({
    $project: {
      _id: 0,
      id: "$_id",
      date: "$createdAt",
      student: "$studentUser.fullName",
      email: "$studentUser.email",
      team: { $ifNull: ["$team.name", null] },
      amount: 1,
      source: { $toUpper: "$source" },
      reason: 1,
      activity: { $ifNull: ["$activity.title", null] },
      override: { $cond: [{ $eq: ["$adminOverride.isOverride", true] }, "Yes", "No"] },
      overrideBy: { $ifNull: ["$overrideAdmin.fullName", null] },
      overrideNote: { $ifNull: ["$adminOverride.note", null] },
    },
  });

  return {
    model: XPTransaction,
    pipeline,
    columns: [
      { key: "date", label: "Date", format: "datetime" },
      { key: "student", label: "Student", format: "text" },
      { key: "team", label: "Team", format: "text" },
      { key: "amount", label: "XP", format: "signed" },
      { key: "source", label: "Source", format: "type" },
      { key: "reason", label: "Reason", format: "text" },
      { key: "activity", label: "Activity", format: "text" },
      { key: "override", label: "Override", format: "text" },
      { key: "overrideBy", label: "Override by", format: "text" },
      { key: "overrideNote", label: "Note", format: "text" },
    ],
    sortable: { date: "date", student: "student", amount: "amount", source: "source" },
    defaultSort: { date: -1 },
    summary: {
      group: {
        transactions: { $sum: 1 },
        net: { $sum: "$amount" },
        awarded: { $sum: { $cond: [{ $gt: ["$amount", 0] }, "$amount", 0] } },
        deducted: { $sum: { $cond: [{ $lt: ["$amount", 0] }, "$amount", 0] } },
        overrides: { $sum: { $cond: [{ $eq: ["$override", "Yes"] }, 1, 0] } },
      },
      format: (d) => [
        { label: "Transactions", value: d.transactions, format: "number" },
        { label: "XP awarded", value: d.awarded, format: "number" },
        { label: "XP deducted", value: d.deducted, format: "number" },
        { label: "Net XP", value: d.net, format: "number" },
        { label: "Admin overrides", value: d.overrides, format: "number" },
      ],
    },
  };
}

const BUILDERS = {
  [REPORT_TYPES.STUDENT_PERFORMANCE]: buildStudentPerformance,
  [REPORT_TYPES.SUBMISSIONS]: buildSubmissions,
  [REPORT_TYPES.COURSE_COMPLETION]: buildCourseCompletion,
  [REPORT_TYPES.XP_LEDGER]: buildXpLedger,
};

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------
export async function runReport(filters, { exportAll = false } = {}) {
  // Filters name students by User id (the id the admin UI has); every report
  // collection keys off Student._id, so resolve it once here. An id with no
  // Student document yields no rows rather than silently ignoring the filter.
  let studentObjectId;
  if (filters.studentId) {
    const student = await Student.findOne({ user: filters.studentId }).select("_id").lean();
    if (!student) {
      const spec = BUILDERS[filters.type](filters, {});
      return {
        columns: spec.columns.map((c) => ({ ...c, sortable: Boolean(spec.sortable[c.key]) })),
        rows: [],
        summary: [],
        pagination: emptyPage(filters),
        truncated: false,
      };
    }
    studentObjectId = student._id;
  }

  const spec = BUILDERS[filters.type](filters, { studentObjectId });

  const sortField = filters.sortBy && spec.sortable[filters.sortBy];
  const sort = sortField ? { [sortField]: filters.sortDir === "asc" ? 1 : -1 } : spec.defaultSort;
  // Aggregation sorts aren't stable, so paging can repeat or drop a row when
  // the sort key ties. A unique tiebreaker pins the order across pages.
  const stableSort = { ...sort, id: 1 };

  const rowStages = exportAll
    ? [{ $sort: stableSort }, { $limit: EXPORT_ROW_CAP }]
    : [{ $sort: stableSort }, { $skip: (filters.page - 1) * filters.limit }, { $limit: filters.limit }];

  const [result] = await spec.model
    .aggregate([
      ...spec.pipeline,
      {
        $facet: {
          rows: rowStages,
          meta: [{ $count: "total" }],
          summary: [{ $group: { _id: null, ...spec.summary.group } }],
        },
      },
    ])
    .allowDiskUse(true);

  const rawRows = result?.rows ?? [];
  const rows = spec.postProcess ? spec.postProcess(rawRows) : rawRows;
  const total = result?.meta?.[0]?.total ?? 0;
  const summaryDoc = result?.summary?.[0];

  return {
    // Tell the client which headers are clickable, so it can't offer a sort
    // the whitelist would quietly ignore.
    columns: spec.columns.map((c) => ({ ...c, sortable: Boolean(spec.sortable[c.key]) })),
    rows,
    summary: summaryDoc ? spec.summary.format(summaryDoc) : [],
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
    truncated: exportAll && total > EXPORT_ROW_CAP,
  };
}

function emptyPage(filters) {
  return { page: filters.page, limit: filters.limit, total: 0, totalPages: 1 };
}
