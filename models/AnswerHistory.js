import mongoose from 'mongoose';

const answerHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // אם יש לך קולקשן של משתמשים
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Question'
  },
  selectedAnswerIndex: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    required: true
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
});

const AnswerHistory = mongoose.model('AnswerHistory', answerHistorySchema);
export default AnswerHistory;
