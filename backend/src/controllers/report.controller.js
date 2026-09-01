import { asyncHandler } from "../utils/asynchandler.js";
import { ApiResponse } from "../utils/apiresponse.js";
import { Course } from "../models/course.model.js";
import { Team } from "../models/team.model.js";
import { runReport, EXPORT_ROW_CAP } from "../services/reports/report.service.js";
import { toCsv, csvFilename } from "../utils/csv.js";
import { REPORT_TYPES, XP_SOURCES, ACTIVITY_STATUS } from "../constants.js";
import { ACTIVITY_TYPE_FROM_FRONTEND } from "../utils/serializers.js";

// Which filters each report actually honours. The admin UI reads this to
// render the filter panel, so a filter can never be offered for a report that
// would silently ignore it.
const REPORT_CATALOG = [
  {
    type: REPORT_TYPES.STUDENT_PERFORMANCE,
    label: "Student performance",
    description: "Per-student XP, completions, average score and activity, with metrics scoped to the date range.",
    filters: ["dateRange", "team", "student", "status", "xpRange", "search"],
    statusOptions: ["ACTIVE", "INACTIVE"],
  },
  {
    type: REPORT_TYPES.SUBMISSIONS,
    label: "Submissions & grading",
    description: "Every submission with its activity, official score, reviewer and turnaround.",
    filters: ["dateRange", "course", "team", "student", "activityType", "status", "scoreRange", "mandatory", "search"],
    statusOptions: ["PENDING", "REVIEWED"],
  },
  {
    type: REPORT_TYPES.COURSE_COMPLETION,
    label: "Course & activity completion",
    description: "Enrolment, completion rate and overdue counts per activity, grouped by course.",
    filters: ["dateRange", "course", "activityType", "status", "mandatory", "search"],
    statusOptions: Object.values(ACTIVITY_STATUS).map((s) => s.toUpperCase()),
  },
  {
    type: REPORT_TYPES.XP_LEDGER,
    label: "XP ledger",
    description: "The append-only XP audit trail: every award, deduction and admin override.",
    filters: ["dateRange", "team", "student", "source", "search"],
    statusOptions: [],
  },
];

// GET /admin/reports/options — everything the filter panel needs to populate
// its dropdowns, in one round trip.
const getReportOptions = asyncHandler(async (req, res) => {
  const [courses, teams] = await Promise.all([
    Course.find({ archivedAt: null }).select("title").sort({ title: 1 }).lean(),
    Team.find({ archivedAt: null }).select("name").sort({ name: 1 }).lean(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reports: REPORT_CATALOG,
        courses: courses.map((c) => ({ id: c._id, title: c.title })),
        teams: teams.map((t) => ({ id: t._id, name: t.name })),
        activityTypes: Object.keys(ACTIVITY_TYPE_FROM_FRONTEND),
        xpSources: Object.values(XP_SOURCES),
        exportRowCap: EXPORT_ROW_CAP,
      },
      "Report options",
    ),
  );
});

// GET /admin/reports — the previewed, paginated result.
const generateReport = asyncHandler(async (req, res) => {
  const { columns, rows, summary, pagination } = await runReport(req.filters);

  return res.status(200).json({
    success: true,
    data: { type: req.filters.type, columns, rows, summary, generatedAt: new Date() },
    pagination,
  });
});

// GET /admin/reports/export — the same rows, unpaginated, as a CSV download.
const exportReport = asyncHandler(async (req, res) => {
  const { columns, rows, truncated } = await runReport(req.filters, { exportAll: true });
  const csv = toCsv(columns, rows);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${csvFilename(req.filters.type, req.filters)}"`);
  // A truncated export looks identical to a complete one once it's a file on
  // someone's desktop, so say so in a header the client surfaces as a warning.
  if (truncated) res.setHeader("X-Report-Truncated", String(EXPORT_ROW_CAP));
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, X-Report-Truncated");

  return res.status(200).send(csv);
});

export { getReportOptions, generateReport, exportReport, REPORT_CATALOG };
