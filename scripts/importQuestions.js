import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Question from '../models/Question.js';

// התחברות למסד
await mongoose.connect('mongodb+srv://edgar:14112804PE@cluster0.fwbk2qd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

// קריאת השאלות מהקובץ
const filePath = path.join('data', 'questions.json');
const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// הכנסת כל שאלה למסד
await Question.insertMany(questions);

console.log('✅ Questions inserted!');
process.exit();

