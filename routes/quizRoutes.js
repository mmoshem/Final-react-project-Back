import express from 'express';
import { getDailyQuestion, submitAnswer } from '../controllers/quizController.js';

const router = express.Router();

// שליפת שאלה יומית
router.get('/daily-question/:userId', getDailyQuestion);

// שליחת תשובה
router.post('/answer', submitAnswer);

export default router;
