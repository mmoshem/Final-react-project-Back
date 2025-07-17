import express from 'express';
import { getDailyQuestion, submitAnswer ,  getAnswerStatus} from '../controllers/quizController.js';

const router = express.Router();

router.get('/daily-question/:userId', getDailyQuestion);

router.post('/answer', submitAnswer);
router.get('/answer-status/:userId/:questionId', getAnswerStatus);

export default router;
