// Mock dataset shaped exactly like the Katalyst Platform API contract (v1.0).
// Swap USE_MOCK to false in api/client.js once the real backend is available —
// no UI code needs to change, since every api/*.js function returns this same shape.

let seq = 1000
export const nextId = (prefix) => `${prefix}_${seq++}`

export const mockUsers = {
  usr_123: {
    id: "usr_123",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    password: "Password123!",
    role: "STUDENT",
    avatarUrl: null,
    createdAt: "2026-01-12T09:00:00Z",
  },
  usr_admin: {
    id: "usr_admin",
    name: "Priya Nair",
    email: "admin@example.com",
    password: "Password123!",
    role: "ADMIN",
    avatarUrl: null,
    createdAt: "2025-11-01T09:00:00Z",
  },
}

export const mockCourses = [
  {
    id: "course_1",
    title: "Leadership Fundamentals",
    description: "Learn the fundamentals of leadership: influence, decision-making, and leading through change.",
    thumbnailUrl: null,
    category: "Leadership",
    difficulty: "BEGINNER",
    durationMinutes: 240,
    xpReward: 100,
    mandatory: true,
    progress: 75,
    enrolled: true,
    modules: [
      { id: "module_1", title: "Introduction", description: "What leadership means in practice.", order: 1, completed: true },
      { id: "module_2", title: "Communication", description: "Communicating with clarity and empathy.", order: 2, completed: true },
      { id: "module_3", title: "Decision Making", description: "Frameworks for high-stakes decisions.", order: 3, completed: true },
      { id: "module_4", title: "Leading Change", description: "Guiding teams through transitions.", order: 4, completed: false },
    ],
  },
  {
    id: "course_2",
    title: "Effective Communication",
    description: "Build the communication habits that make teams and stakeholders trust you.",
    thumbnailUrl: null,
    category: "Communication",
    difficulty: "BEGINNER",
    durationMinutes: 180,
    xpReward: 80,
    mandatory: true,
    progress: 40,
    enrolled: true,
    modules: [
      { id: "module_5", title: "Active Listening", description: "", order: 1, completed: true },
      { id: "module_6", title: "Written Communication", description: "", order: 2, completed: false },
      { id: "module_7", title: "Public Speaking", description: "", order: 3, completed: false },
    ],
  },
  {
    id: "course_3",
    title: "Project Management Essentials",
    description: "Plan, execute, and close projects with confidence using proven frameworks.",
    thumbnailUrl: null,
    category: "Management",
    difficulty: "INTERMEDIATE",
    durationMinutes: 300,
    xpReward: 150,
    mandatory: false,
    progress: 0,
    enrolled: false,
    modules: [
      { id: "module_8", title: "Project Scoping", description: "", order: 1, completed: false },
      { id: "module_9", title: "Scheduling & Budgeting", description: "", order: 2, completed: false },
      { id: "module_10", title: "Risk Management", description: "", order: 3, completed: false },
    ],
  },
  {
    id: "course_4",
    title: "Data-Driven Decision Making",
    description: "Use data to make better, faster decisions without getting lost in the numbers.",
    thumbnailUrl: null,
    category: "Analytics",
    difficulty: "INTERMEDIATE",
    durationMinutes: 210,
    xpReward: 120,
    mandatory: false,
    progress: 100,
    enrolled: true,
    modules: [
      { id: "module_11", title: "Reading Metrics", description: "", order: 1, completed: true },
      { id: "module_12", title: "Building Dashboards", description: "", order: 2, completed: true },
    ],
  },
  {
    id: "course_5",
    title: "Advanced Negotiation",
    description: "Negotiate outcomes that hold up, with counterparts who don't make it easy.",
    thumbnailUrl: null,
    category: "Leadership",
    difficulty: "ADVANCED",
    durationMinutes: 270,
    xpReward: 140,
    mandatory: false,
    progress: 0,
    enrolled: false,
    modules: [
      { id: "module_13", title: "Preparing to Negotiate", description: "", order: 1, completed: false },
      { id: "module_14", title: "Tactics & Counter-tactics", description: "", order: 2, completed: false },
    ],
  },
]

export const mockActivities = [
  {
    id: "activity_1",
    title: "Leadership Case Study",
    type: "ASSIGNMENT",
    description: "Analyze the provided case study and submit a written response.",
    instructions: "Read the attached case study on organizational change. Submit a 500-800 word response covering the key decision points and what you would have done differently.",
    dueDate: "2026-08-25T18:00:00Z",
    xpReward: 100,
    mandatory: true,
    submissionRequired: true,
    status: "PENDING",
    progress: 0,
    linkedId: "assignment_123",
    courseId: "course_1",
  },
  {
    id: "activity_2",
    title: "Communication Basics Quiz",
    type: "QUIZ",
    description: "Test your understanding of active listening and feedback.",
    instructions: "You have 10 minutes to answer 10 multiple-choice questions. You may attempt up to 3 times.",
    dueDate: "2026-08-23T18:00:00Z",
    xpReward: 50,
    mandatory: true,
    submissionRequired: false,
    status: "PENDING",
    progress: 0,
    linkedId: "quiz_123",
    courseId: "course_2",
  },
  {
    id: "activity_3",
    title: "Leadership Workshop",
    type: "TRAINING_SESSION",
    description: "Live workshop with a senior trainer on situational leadership.",
    instructions: "Join via the meeting link at the scheduled time. Attendance is tracked automatically.",
    dueDate: "2026-08-25T10:00:00Z",
    xpReward: 50,
    mandatory: false,
    submissionRequired: false,
    status: "PENDING",
    progress: 0,
    linkedId: "session_123",
    courseId: "course_1",
  },
  {
    id: "activity_4",
    title: "Peer Mentoring Check-in",
    type: "MENTORING",
    description: "Monthly check-in with your assigned mentor.",
    instructions: "Prepare three discussion topics before your session.",
    dueDate: "2026-08-28T12:00:00Z",
    xpReward: 30,
    mandatory: false,
    submissionRequired: false,
    status: "NOT_STARTED",
    progress: 0,
    linkedId: null,
    courseId: null,
  },
  {
    id: "activity_5",
    title: "Data Dashboard Project",
    type: "PROJECT",
    description: "Build a small dashboard summarizing a dataset of your choice.",
    instructions: "Submit a link to your dashboard along with a short write-up of your findings.",
    dueDate: "2026-09-05T18:00:00Z",
    xpReward: 150,
    mandatory: false,
    submissionRequired: true,
    status: "IN_PROGRESS",
    progress: 40,
    linkedId: "assignment_124",
    courseId: "course_4",
  },
  {
    id: "activity_6",
    title: "Research: Industry Trends",
    type: "RESEARCH",
    description: "Research and summarize three emerging trends in your industry.",
    instructions: "Submit a document with citations for each trend.",
    dueDate: "2026-08-15T18:00:00Z",
    xpReward: 80,
    mandatory: false,
    submissionRequired: true,
    status: "COMPLETED",
    progress: 100,
    linkedId: "assignment_125",
    courseId: null,
  },
  {
    id: "activity_7",
    title: "Milestone: Complete First Course",
    type: "MILESTONE",
    description: "Finish Leadership Fundamentals in full.",
    instructions: "",
    dueDate: null,
    xpReward: 250,
    mandatory: false,
    submissionRequired: false,
    status: "IN_PROGRESS",
    progress: 75,
    linkedId: "milestone_1",
    courseId: "course_1",
  },
  {
    id: "activity_8",
    title: "Weekly Knowledge Challenge",
    type: "COMPETITION",
    description: "Compete with peers in a timed knowledge challenge.",
    instructions: "The competition opens Friday and closes Monday. Highest score wins.",
    dueDate: "2026-08-24T23:59:59Z",
    xpReward: 300,
    mandatory: false,
    submissionRequired: false,
    status: "NOT_STARTED",
    progress: 0,
    linkedId: "competition_1",
    courseId: null,
  },
  {
    id: "activity_9",
    title: "Effective Communication Coaching",
    type: "COACHING",
    description: "One-on-one coaching session focused on presentation skills.",
    instructions: "Bring a recent presentation to review together.",
    dueDate: "2026-08-19T15:00:00Z",
    xpReward: 40,
    mandatory: false,
    submissionRequired: false,
    status: "OVERDUE",
    progress: 0,
    linkedId: null,
    courseId: "course_2",
  },
  {
    id: "activity_10",
    title: "Onboarding Survey",
    type: "CUSTOM",
    description: "Quick survey about your learning goals for this quarter.",
    instructions: "Takes about 3 minutes.",
    dueDate: "2026-08-10T18:00:00Z",
    xpReward: 10,
    mandatory: true,
    submissionRequired: false,
    status: "COMPLETED",
    progress: 100,
    linkedId: null,
    courseId: null,
  },
]

export const mockAssignments = {
  assignment_123: {
    id: "assignment_123",
    title: "Leadership Case Study",
    description: "Analyze the provided case study and submit a written response.",
    instructions: "Read the attached case study on organizational change. Submit a 500-800 word response covering the key decision points and what you would have done differently. Cite at least two frameworks from the course.",
    dueDate: "2026-08-25T18:00:00Z",
    xpReward: 100,
    maxAttempts: 2,
    submissionTypes: ["TEXT", "FILE", "LINK"],
    status: "PENDING",
    attemptsUsed: 0,
  },
  assignment_124: {
    id: "assignment_124",
    title: "Data Dashboard Project",
    description: "Build a small dashboard summarizing a dataset of your choice.",
    instructions: "Submit a link to your dashboard along with a short write-up of your findings (300 words minimum).",
    dueDate: "2026-09-05T18:00:00Z",
    xpReward: 150,
    maxAttempts: 1,
    submissionTypes: ["LINK", "FILE"],
    status: "IN_PROGRESS",
    attemptsUsed: 0,
  },
  assignment_125: {
    id: "assignment_125",
    title: "Research: Industry Trends",
    description: "Research and summarize three emerging trends in your industry.",
    instructions: "Submit a document with citations for each trend.",
    dueDate: "2026-08-15T18:00:00Z",
    xpReward: 80,
    maxAttempts: 2,
    submissionTypes: ["FILE", "TEXT"],
    status: "COMPLETED",
    attemptsUsed: 1,
  },
}

export const mockSubmissions = {
  assignment_123: [],
  assignment_124: [],
  assignment_125: [
    {
      id: "submission_123",
      attempt: 1,
      submittedAt: "2026-08-14T10:30:00Z",
      status: "REVIEWED",
      score: 82,
      aiSuggestedScore: 80,
      feedbackAvailable: true,
    },
  ],
}

export const mockSubmissionReviews = {
  submission_123: {
    status: "COMPLETED",
    summary: "The submission demonstrates strong understanding of the three trends and connects them clearly to industry impact.",
    strengths: ["Good research", "Clear structure", "Well-cited sources"],
    improvements: ["Improve conclusion", "Add supporting evidence for trend #2"],
    aiSuggestedScore: 80,
    rubric: [
      { criterion: "Research", score: 18, maxScore: 20, feedback: "Strong research, well sourced." },
      { criterion: "Clarity", score: 16, maxScore: 20, feedback: "Mostly clear, conclusion needs work." },
      { criterion: "Structure", score: 20, maxScore: 20, feedback: "Excellent structure." },
    ],
  },
}

export const mockQuizzes = {
  quiz_123: {
    id: "quiz_123",
    title: "Communication Basics",
    description: "Test your understanding of active listening and feedback.",
    timeLimitSeconds: 600,
    totalQuestions: 5,
    xpReward: 50,
    attemptsAllowed: 3,
  },
}

export const mockQuizQuestions = {
  quiz_123: [
    {
      id: "question_1",
      question: "What is the first step of active listening?",
      type: "MCQ",
      options: [
        { id: "option_1", text: "Formulating your response" },
        { id: "option_2", text: "Giving your full attention" },
        { id: "option_3", text: "Interrupting to clarify" },
        { id: "option_4", text: "Taking notes only" },
      ],
    },
    {
      id: "question_2",
      question: "Effective feedback should be:",
      type: "MCQ",
      options: [
        { id: "option_5", text: "Vague and general" },
        { id: "option_6", text: "Specific and timely" },
        { id: "option_7", text: "Delivered only in writing" },
        { id: "option_8", text: "Saved for annual reviews" },
      ],
    },
    {
      id: "question_3",
      question: "Which of these is a barrier to communication?",
      type: "MCQ",
      options: [
        { id: "option_9", text: "Asking clarifying questions" },
        { id: "option_10", text: "Making assumptions" },
        { id: "option_11", text: "Paraphrasing" },
        { id: "option_12", text: "Maintaining eye contact" },
      ],
    },
    {
      id: "question_4",
      question: "Paraphrasing during a conversation helps to:",
      type: "MCQ",
      options: [
        { id: "option_13", text: "Confirm understanding" },
        { id: "option_14", text: "End the conversation faster" },
        { id: "option_15", text: "Avoid eye contact" },
        { id: "option_16", text: "Change the subject" },
      ],
    },
    {
      id: "question_5",
      question: "Nonverbal communication includes:",
      type: "MCQ",
      options: [
        { id: "option_17", text: "Word choice only" },
        { id: "option_18", text: "Tone, posture, and facial expression" },
        { id: "option_19", text: "Email subject lines" },
        { id: "option_20", text: "Typing speed" },
      ],
    },
  ],
}

export const mockSessions = [
  {
    id: "session_123",
    title: "Leadership Workshop",
    description: "Live workshop with a senior trainer on situational leadership.",
    startTime: "2026-08-25T10:00:00Z",
    endTime: "2026-08-25T12:00:00Z",
    trainer: { id: "trainer_1", name: "John Doe" },
    location: "Online",
    meetingUrl: "https://meet.example.com/leadership-workshop",
    xpReward: 50,
    registered: false,
  },
  {
    id: "session_124",
    title: "Negotiation Roleplay",
    description: "Practice negotiation tactics in small breakout groups.",
    startTime: "2026-08-27T14:00:00Z",
    endTime: "2026-08-27T15:30:00Z",
    trainer: { id: "trainer_2", name: "Anita Rao" },
    location: "Online",
    meetingUrl: "https://meet.example.com/negotiation-roleplay",
    xpReward: 40,
    registered: true,
  },
  {
    id: "session_125",
    title: "Data Storytelling Clinic",
    description: "Bring a chart, leave with a better one.",
    startTime: "2026-09-01T11:00:00Z",
    endTime: "2026-09-01T12:00:00Z",
    trainer: { id: "trainer_3", name: "Marcus Lee" },
    location: "Room 4B, HQ",
    meetingUrl: null,
    xpReward: 30,
    registered: false,
  },
]

export const mockAchievements = {
  unlocked: [
    { id: "achievement_1", name: "First Step", description: "Complete your first activity.", iconUrl: null, xpReward: 50, unlockedAt: "2026-06-02T10:00:00Z" },
    { id: "achievement_3", name: "Quiz Whiz", description: "Score 100% on any quiz.", iconUrl: null, xpReward: 40, unlockedAt: "2026-06-20T10:00:00Z" },
    { id: "achievement_4", name: "Consistent", description: "Maintain a 7-day streak.", iconUrl: null, xpReward: 60, unlockedAt: "2026-08-15T10:00:00Z" },
  ],
  locked: [
    { id: "achievement_2", name: "Rising Star", description: "Earn 500 XP.", iconUrl: null, progress: 1240, requirement: 500 },
    { id: "achievement_5", name: "Team Player", description: "Contribute 25% of your team's XP.", iconUrl: null, progress: 23, requirement: 25 },
    { id: "achievement_6", name: "Marathoner", description: "Maintain a 30-day streak.", iconUrl: null, progress: 7, requirement: 30 },
  ],
}

export const mockMilestones = [
  { id: "milestone_1", name: "Complete First Course", description: "Complete your first course.", xpReward: 250, status: "IN_PROGRESS", progress: 75, target: 100 },
  { id: "milestone_2", name: "Reach 1500 XP", description: "Earn a total of 1500 XP.", xpReward: 300, status: "IN_PROGRESS", progress: 1240, target: 1500 },
  { id: "milestone_3", name: "Complete Onboarding", description: "Finish all onboarding activities.", xpReward: 50, status: "COMPLETED", completedAt: "2026-08-10T18:00:00Z" },
  { id: "milestone_4", name: "Join a Team", description: "Join or get assigned to a team.", xpReward: 20, status: "COMPLETED", completedAt: "2026-06-01T09:00:00Z" },
]

export const mockStreak = {
  currentStreak: 7,
  longestStreak: 14,
  lastActivityDate: "2026-08-21",
  nextMilestone: 10,
}

export const mockXp = {
  totalXP: 1240,
  level: 5,
  xpForNextLevel: 1500,
  xpProgress: 240,
  transactions: [
    { id: "xp_1", amount: 100, reason: "Assignment completed: Research: Industry Trends", activityId: "activity_6", createdAt: "2026-08-15T18:20:00Z" },
    { id: "xp_2", amount: 50, reason: "Quiz completed: Communication Basics", activityId: "activity_2", createdAt: "2026-08-12T09:10:00Z" },
    { id: "xp_3", amount: 10, reason: "Onboarding survey completed", activityId: "activity_10", createdAt: "2026-08-10T18:05:00Z" },
    { id: "xp_4", amount: 250, reason: "Milestone unlocked: Complete Onboarding", activityId: null, createdAt: "2026-08-10T18:06:00Z" },
    { id: "xp_5", amount: 80, reason: "Module completed: Reading Metrics", activityId: null, createdAt: "2026-08-05T12:00:00Z" },
  ],
}

export const mockLeaderboard = {
  myRank: 14,
  myXP: 1240,
  entries: [
    { rank: 1, student: { id: "usr_201", name: "Aditi Kapoor", avatarUrl: null }, xp: 2450, level: 8 },
    { rank: 2, student: { id: "usr_202", name: "Vikram Singh", avatarUrl: null }, xp: 2310, level: 7 },
    { rank: 3, student: { id: "usr_203", name: "Sara Iqbal", avatarUrl: null }, xp: 2190, level: 7 },
    { rank: 4, student: { id: "usr_204", name: "Devansh Mehta", avatarUrl: null }, xp: 1980, level: 6 },
    { rank: 5, student: { id: "usr_205", name: "Neha Joshi", avatarUrl: null }, xp: 1870, level: 6 },
    { rank: 12, student: { id: "usr_456", name: "Aarav", avatarUrl: null }, xp: 1350, level: 5 },
    { rank: 13, student: { id: "usr_789", name: "Riya", avatarUrl: null }, xp: 1290, level: 5 },
    { rank: 14, student: { id: "usr_123", name: "Rahul Sharma", avatarUrl: null }, xp: 1240, level: 5 },
    { rank: 15, student: { id: "usr_301", name: "Kabir Malhotra", avatarUrl: null }, xp: 1190, level: 5 },
    { rank: 16, student: { id: "usr_302", name: "Meera Pillai", avatarUrl: null }, xp: 1120, level: 4 },
  ],
}

export const mockMission = {
  id: "mission_123",
  title: "This Week's Challenge",
  description: "Complete three learning activities before the week ends.",
  xpReward: 250,
  startDate: "2026-08-18T00:00:00Z",
  endDate: "2026-08-24T23:59:59Z",
  progress: { completed: 2, required: 3 },
  tasks: [
    { id: "task_1", title: "Complete one quiz", completed: true },
    { id: "task_2", title: "Attend one session", completed: true },
    { id: "task_3", title: "Submit one assignment", completed: false },
  ],
}

export const mockTeam = {
  id: "team_1",
  name: "Team Alpha",
  rank: 2,
  xp: 5240,
  completionPercentage: 76,
  members: [
    { id: "usr_123", name: "Rahul Sharma", xp: 1240, contributionPercentage: 23 },
    { id: "usr_456", name: "Aarav", xp: 1350, contributionPercentage: 26 },
    { id: "usr_303", name: "Ishaan Verma", xp: 1310, contributionPercentage: 25 },
    { id: "usr_304", name: "Tanvi Desai", xp: 1340, contributionPercentage: 26 },
  ],
}

export const mockCompetition = {
  id: "competition_1",
  title: "Weekly Knowledge Challenge",
  description: "A timed multiple-choice challenge covering this month's courses.",
  startDate: "2026-08-21T00:00:00Z",
  endDate: "2026-08-24T23:59:59Z",
  xpReward: 300,
  participantCount: 85,
  myRank: 12,
}

export const mockNotifications = [
  { id: "notification_1", type: "ACHIEVEMENT_UNLOCKED", title: "Achievement Unlocked!", message: "You unlocked Consistent for a 7-day streak.", read: false, createdAt: "2026-08-21T09:30:00Z", metadata: { achievementId: "achievement_4" } },
  { id: "notification_2", type: "ASSIGNMENT_DUE", title: "Assignment due tomorrow", message: "Leadership Case Study is due Aug 25.", read: false, createdAt: "2026-08-21T08:00:00Z", metadata: { activityId: "activity_1" } },
  { id: "notification_3", type: "SUBMISSION_REVIEWED", title: "Submission reviewed", message: "Your Research: Industry Trends submission scored 82.", read: false, createdAt: "2026-08-20T16:10:00Z", metadata: { submissionId: "submission_123" } },
  { id: "notification_4", type: "SESSION_REMINDER", title: "Session starting soon", message: "Leadership Workshop starts Aug 25, 10:00 AM.", read: true, createdAt: "2026-08-19T10:00:00Z", metadata: { sessionId: "session_123" } },
  { id: "notification_5", type: "MILESTONE_COMPLETED", title: "Milestone completed", message: "You completed Complete Onboarding.", read: true, createdAt: "2026-08-10T18:06:00Z", metadata: { milestoneId: "milestone_3" } },
  { id: "notification_6", type: "TEAM_UPDATE", title: "Team Alpha moved up", message: "Your team is now ranked #2 overall.", read: true, createdAt: "2026-08-08T09:00:00Z", metadata: { teamId: "team_1" } },
]

export const mockConversations = {
  conversation_123: {
    id: "conversation_123",
    title: "Study planning",
    updatedAt: "2026-08-21T10:30:00Z",
    messages: [
      { id: "message_1", role: "user", content: "How am I doing?" },
      { id: "message_2", role: "assistant", content: "You've completed 68% of your activities and you're on a 7-day streak. Your highest priority right now is the Leadership Case Study, due tomorrow." },
    ],
  },
}

export const mockAdminStudents = [
  { id: "usr_123", name: "Rahul Sharma", email: "rahul@example.com", team: "Team Alpha", xp: 1240, level: 5, completionPercentage: 68, currentStreak: 7, status: "ACTIVE" },
  { id: "usr_201", name: "Aditi Kapoor", email: "aditi@example.com", team: "Team Beta", xp: 2450, level: 8, completionPercentage: 92, currentStreak: 21, status: "ACTIVE" },
  { id: "usr_202", name: "Vikram Singh", email: "vikram@example.com", team: "Team Beta", xp: 2310, level: 7, completionPercentage: 88, currentStreak: 5, status: "ACTIVE" },
  { id: "usr_305", name: "Ananya Rao", email: "ananya@example.com", team: "Team Alpha", xp: 420, level: 2, completionPercentage: 22, currentStreak: 0, status: "INACTIVE" },
  { id: "usr_306", name: "Farhan Ali", email: "farhan@example.com", team: "Team Gamma", xp: 980, level: 4, completionPercentage: 54, currentStreak: 2, status: "ACTIVE" },
  { id: "usr_307", name: "Lakshmi Nair", email: "lakshmi@example.com", team: "Team Gamma", xp: 150, level: 1, completionPercentage: 8, currentStreak: 0, status: "INACTIVE" },
]

export const mockAdminSubmissions = [
  { id: "submission_201", student: { id: "usr_305", name: "Ananya Rao" }, activityTitle: "Leadership Case Study", courseId: "course_1", submittedAt: "2026-08-20T14:00:00Z", status: "PENDING", aiSuggestedScore: 74 },
  { id: "submission_202", student: { id: "usr_306", name: "Farhan Ali" }, activityTitle: "Data Dashboard Project", courseId: "course_4", submittedAt: "2026-08-19T11:20:00Z", status: "PENDING", aiSuggestedScore: 88 },
  { id: "submission_203", student: { id: "usr_123", name: "Rahul Sharma" }, activityTitle: "Research: Industry Trends", courseId: null, submittedAt: "2026-08-14T10:30:00Z", status: "REVIEWED", score: 82, aiSuggestedScore: 80 },
  { id: "submission_204", student: { id: "usr_202", name: "Vikram Singh" }, activityTitle: "Leadership Case Study", courseId: "course_1", submittedAt: "2026-08-18T09:00:00Z", status: "PENDING", aiSuggestedScore: 91 },
  { id: "submission_205", student: { id: "usr_307", name: "Lakshmi Nair" }, activityTitle: "Research: Industry Trends", courseId: null, submittedAt: "2026-08-13T17:45:00Z", status: "PENDING", aiSuggestedScore: 62 },
]

export const mockAdminDashboard = {
  students: { total: 500, active: 420, inactive: 80 },
  engagement: { weeklyParticipation: 78, monthlyParticipation: 82 },
  completion: { overall: 74, assignments: 81, courses: 68 },
  xp: { average: 1240, total: 620000 },
  attentionRequired: { inactiveStudents: 32, overdueAssignments: 18, missedMandatoryActivities: 12 },
  teamPerformance: [
    { id: "team_1", name: "Team Alpha", xp: 5240, completionPercentage: 76 },
    { id: "team_2", name: "Team Beta", xp: 6120, completionPercentage: 85 },
    { id: "team_3", name: "Team Gamma", xp: 3480, completionPercentage: 52 },
  ],
  charts: {
    participation: [
      { date: "2026-08-01", value: 72 }, { date: "2026-08-08", value: 75 },
      { date: "2026-08-15", value: 79 }, { date: "2026-08-21", value: 78 },
    ],
    completion: [
      { date: "2026-08-01", value: 65 }, { date: "2026-08-08", value: 69 },
      { date: "2026-08-15", value: 72 }, { date: "2026-08-21", value: 74 },
    ],
    xpDistribution: [
      { bucket: "0-500", count: 120 }, { bucket: "500-1000", count: 160 },
      { bucket: "1000-1500", count: 140 }, { bucket: "1500+", count: 80 },
    ],
  },
}

export const mockAdminAnalytics = {
  participationRate: 82,
  completionRate: 76,
  averageXP: 1240,
  averageScore: 78,
  participationTrend: [
    { date: "2026-08-01", value: 72 }, { date: "2026-08-08", value: 75 },
    { date: "2026-08-15", value: 79 }, { date: "2026-08-21", value: 78 },
  ],
  coursePerformance: mockCourses.map((c) => ({ id: c.id, title: c.title, completionRate: c.progress })),
  teamPerformance: mockAdminDashboard.teamPerformance,
  activityPerformance: mockActivities.slice(0, 5).map((a) => ({ id: a.id, title: a.title, completionRate: a.progress })),
}
