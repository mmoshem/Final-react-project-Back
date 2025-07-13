// models/Question.js
import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    type: [String],
    validate: [arr => arr.length === 4, 'There must be exactly 4 options']
  },
  correctAnswerIndex: { type: Number, required: true }
});

const Question = mongoose.model('Question', questionSchema);
export default Question;
