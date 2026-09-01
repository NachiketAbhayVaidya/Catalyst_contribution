// Imported once at app startup so every schema is registered with Mongoose,
// even models only ever reached indirectly via a `.populate()` ref (e.g. Team
// is never imported directly by a controller, only populated from Student).
import "./user.model.js";
import "./student.model.js";
import "./admin.model.js";
import "./team.model.js";
import "./course.model.js";
import "./module.model.js";
import "./session.model.js";
import "./activity.model.js";
import "./activityEnrollment.model.js";
import "./assignment.model.js";
import "./quiz.model.js";
import "./quizQuestion.model.js";
import "./quizAttempt.model.js";
import "./submission.model.js";
import "./feedback.model.js";
import "./attendance.model.js";
import "./xpTransaction.model.js";
import "./streak.model.js";
import "./achievement.model.js";
import "./studentAchievement.model.js";
import "./milestone.model.js";
import "./studentMilestone.model.js";
import "./mission.model.js";
import "./missionProgress.model.js";
import "./competition.model.js";
import "./competitionParticipant.model.js";
import "./leaderboardSnapshot.model.js";
import "./aiReview.model.js";
import "./aiConversation.model.js";
import "./aiMessage.model.js";
import "./notification.model.js";
import "./notificationPreference.model.js";
import "./file.model.js";
import "./courseEnrollment.model.js";
