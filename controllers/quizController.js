import mongoose from 'mongoose';
import Question from '../models/Question.js';
import AnswerHistory from '../models/AnswerHistory.js';

export const getDailyQuestion = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId format' });
    }

    const answeredCorrectly = await AnswerHistory.find({
      userId,
      isCorrect: true
    }).select('questionId');

    const excludeIds = answeredCorrectly.map(item => item.questionId.toString());

    const question = await Question.aggregate([
      { $match: { _id: { $nin: excludeIds.map(id => new mongoose.Types.ObjectId(id)) } } },
      { $sample: { size: 1 } }
    ]);

    if (!question.length) {
      return res.status(404).json({ message: 'No more new questions available' });
    }

    res.json(question[0]);

  } catch (error) {
    console.error('Error fetching daily question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
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

    const newAnswer = new AnswerHistory({
      userId,
      questionId,
      selectedAnswerIndex,
      isCorrect,
    });

    await newAnswer.save();
    res.json({ message: 'Answer saved', isCorrect });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save answer' });
  }
};
