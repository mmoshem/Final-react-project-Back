import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Question from '../models/Question.js';


await mongoose.connect('mongodb+srv://mmoshem1995:3ONqJjN019zAncoe@cluster0.pninpzq.mongodb.net/Android2?retryWrites=true&w=majority&appName=Cluster0');

const filePath = path.join('data', 'questions.json');
const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

await Question.insertMany(questions);

console.log('✅ Questions inserted!');
process.exit();

