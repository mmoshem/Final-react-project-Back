import mongoose from 'mongoose';
import Question from '../models/Question.js';
import AnswerHistory from '../models/AnswerHistory.js';
import DailyQuestionAssignment from '../models/DailyQuestionAssignment.js';


export const getDailyQuestion = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // בדיקה אם קיימת שאלה שכבר הוקצתה להיום
    let assignment = await DailyQuestionAssignment.findOne({
      userId,
      assignedAt: { $gte: todayStart }
    });

    if (assignment) {
      const question = await Question.findById(assignment.questionId);
      return res.json(question);
    }

    await DailyQuestionAssignment.deleteMany({ userId });


    const answeredCorrectly = await AnswerHistory.find({
      userId,
      isCorrect: true
    }).select('questionId');

    const excludeIds = answeredCorrectly.map(item => item.questionId.toString());

    // בחירת שאלה אקראית שלא נענתה נכון בעבר
    const availableQuestions = await Question.aggregate([
      { $match: { _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $sample: { size: 1 } }
    ]);

    if (!availableQuestions.length) {
      return res.status(404).json({ message: 'No new questions available' });
    }

    const selectedQuestion = availableQuestions[0];

    // יצירת הקצאה חדשה (רק אחת!)
    await DailyQuestionAssignment.create({
      userId,
      questionId: selectedQuestion._id,
      assignedAt: new Date()
    });

    res.json(selectedQuestion);
  } catch (error) {
    console.error('Error fetching daily question:', error);
    res.status(500).json({ error: 'Failed to fetch daily question' });
  }
};


export const submitAnswer = async (req, res) => {
  try {
    const { userId, questionId, selectedAnswerIndex } = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const isCorrect = question.correctAnswerIndex === selectedAnswerIndex;

    await AnswerHistory.updateOne(
      { userId, questionId },
      {
        $set: {
          selectedAnswerIndex,
          isCorrect,
          lastAnsweredAt: new Date(),
          answeredAt: new Date()
        },
        $inc: {
          [isCorrect ? 'correctCount' : 'incorrectCount']: 1
        }
      },
      { upsert: true }
    );

    res.json({
      message: 'Answer saved',
      isCorrect,
      correctAnswerIndex: question.correctAnswerIndex
    });
  } catch (error) {
    console.error('Failed to save answer:', error);
    res.status(500).json({ error: 'Failed to save answer' });
  }
};


export const getAnswerStatus = async (req, res) => {
  try {
    const { userId, questionId } = req.params;

    const existing = await AnswerHistory.findOne({ userId, questionId });

    if (!existing) {
      return res.json({ alreadyAnswered: false });
    }

    return res.json({
      alreadyAnswered: true,
      isCorrect: existing.isCorrect,
      selectedAnswerIndex: existing.selectedAnswerIndex
    });
  } catch (error) {
    console.error('Error in getAnswerStatus:', error);
    res.status(500).json({ error: 'Error checking answer status' });
  }
};
