import express from 'express';
import { handleCompanyCommand } from '../controllers/companyController.js';

const router = express.Router();

router.post('/api/companies', handleCompanyCommand);

export default router;
