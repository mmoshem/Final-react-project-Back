import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import bodyParser from 'body-parser';
import companyRoutes from './routes/companyRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userInfoRoutes from './routes/userInfoRoutes.js';
import postRoutes from './routes/postRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import profileUploadRoutes from './routes/profileUploadRoute.js';
import groupRoutes from './routes/groupRoutes.js';
import filterOptionsRoutes from './routes/filterOptionsRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { initSocket } from './config/socketConfig.js';
import http from 'http';
import commentRoutes from './routes/commentRoutes.js';

const app = express();

const server = http.createServer(app); // ניצור שרת HTTP
initSocket(server); // אתחול socket


// Middlewares
app.use(cors());
app.use(bodyParser.json());

// DB connection
connectDB();

console.log('🔥 Starting backend server');

// Routes
app.use('/api/groups', groupRoutes);
console.log('Group routes mounted at /api/groups');
// Uncomment other routes as needed:
 app.use(userRoutes);
// app.use(companyRoutes);
 app.use(authRoutes);
 app.use('/api/userinfo', userInfoRoutes);
 app.use(postRoutes);
 app.use(uploadRoutes);
 app.use('/api', profileUploadRoutes);
app.use('/api/filter-options', filterOptionsRoutes);//חדש למען שימוש בקובץ ג'ייסון 
app.use('/api/quiz', quizRoutes);//
app.use('/api/messages', messageRoutes); // <<<<<<<<<<< הוספנו את זה
app.use(commentRoutes);

console.log('All routes mounted successfully');


const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});