// const express = require('express');
// const cors = require('cors');

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
// const bodyParser = require('body-parser');
import bodyParser from 'body-parser';
// const connectDB = require('./config/db');
// const userRoutes = require('./routes/userRoutes');
import companyRoutes from './routes/companyRoutes.js';
import authRoutes from './routes/authRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());
// DB connection
connectDB();

// Routes
app.use(userRoutes);
app.use(companyRoutes);
app.use(authRoutes);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
