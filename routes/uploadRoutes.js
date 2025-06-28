import express from 'express';

console.log('Upload routes file loaded!'); // Add this line

const router = express.Router();

// GET route for browser testing
router.get('/', (req, res) => {
    console.log('GET /api/upload called'); // Add this line
    res.json({ message: 'Upload route working with GET!' });
});

// POST route for actual uploads
router.post('/', (req, res) => {
    console.log('POST /api/upload called'); // Add this line
    res.json({ message: 'Upload route working with POST!' });
});

export default router;
