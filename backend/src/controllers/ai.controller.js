import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apierror.js";
import { Student } from "../models/student.model.js";
import { AIConversation } from "../models/aiConversation.model.js";
import { AIMessage } from "../models/aiMessage.model.js";
import { buildStudentContext } from "../services/ai/context.builder.js";
import { AIService } from "../services/ai/ai.service.js";

async function getStudentOrThrow(userId) {
  const student = await Student.findOne({ user: userId });
  if (!student) throw new ApiError(404, "Student profile not found");
  return student;
}

// POST /ai/coach — real Gemini call, scoped to only this student's own data
// (context.builder.js never pulls another student's records, per spec §17).
const sendCoachMessage = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;
  const student = await getStudentOrThrow(req.user._id);

  let conversation = conversationId ? await AIConversation.findOne({ _id: conversationId, student: student._id }) : null;
  if (!conversation) {
    conversation = await AIConversation.create({ student: student._id, title: message.slice(0, 40) });
  }

  const history = await AIMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 }).limit(20);

  await AIMessage.create({ conversation: conversation._id, role: "user", content: message });

  const context = await buildStudentContext(student._id);
  const replyText = await AIService.chatWithCoach(
    context,
    message,
    history.map((m) => ({ role: m.role, content: m.content })),
  );

  const assistantMessage = await AIMessage.create({ conversation: conversation._id, role: "assistant", content: replyText });
  conversation.updatedAt = new Date();
  await conversation.save();

  const recommendations = context.upcomingDeadlines.slice(0, 1).map((d) => ({
    type: d.type,
    title: d.title,
    priority: "HIGH",
  }));

  return res.status(200).json({
    success: true,
    data: {
      conversationId: conversation._id,
      message: { id: assistantMessage._id, role: "assistant", content: assistantMessage.content },
      recommendations,
    },
  });
});

const getConversations = asyncHandler(async (req, res) => {
  const student = await getStudentOrThrow(req.user._id);
  const conversations = await AIConversation.find({ student: student._id }).sort({ updatedAt: -1 });

  return res.status(200).json({
    success: true,
    data: conversations.map((c) => ({ id: c._id, title: c.title, updatedAt: c.updatedAt })),
  });
});

const getConversation = asyncHandler(async (req, res) => {
  const student = await getStudentOrThrow(req.user._id);
  const conversation = await AIConversation.findOne({ _id: req.params.conversationId, student: student._id });
  if (!conversation) throw new ApiError(404, "Conversation not found");

  const messages = await AIMessage.find({ conversation: conversation._id }).sort({ createdAt: 1 });

  return res.status(200).json({
    success: true,
    data: { id: conversation._id, messages: messages.map((m) => ({ id: m._id, role: m.role, content: m.content })) },
  });
});

export { sendCoachMessage, getConversations, getConversation };
