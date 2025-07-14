import mongoose from 'mongoose';

const dailyQuestionAssignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Question' },
  assignedAt: { type: Date, default: Date.now } // מתי השאלה הוקצתה
});

export default mongoose.model('DailyQuestionAssignment', dailyQuestionAssignmentSchema);
