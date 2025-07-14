// routes/quizRoutes.js
import express from 'express';
import { getDailyQuestion, submitAnswer ,  getAnswerStatus} from '../controllers/quizController.js';

const router = express.Router();

// שליפת שאלה יומית אחת למשתמש (לפי userId)
router.get('/daily-question/:userId', getDailyQuestion);

// שליחת תשובה לשאלה
router.post('/answer', submitAnswer);
router.get('/answer-status/:userId/:questionId', getAnswerStatus);

export default router;
