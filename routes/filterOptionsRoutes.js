import express from 'express';
import { getFilterOptions, addFilterValue } from '../controllers/filterOptionsController.js';

const router = express.Router();

router.get('/', getFilterOptions);
router.post('/add', addFilterValue);

export default router;
