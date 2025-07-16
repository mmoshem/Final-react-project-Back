import { Server } from 'socket.io';
import Message from '../models/Message.js';

let io; // נגדיר את המשתנה כך שנוכל להשתמש בו מחוץ לפונקציה
const userIdToSocketId = {};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", // החליפי לפי כתובת ה-Frontend שלך אם שונה
      methods: ["GET", "POST"],
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 משתמש התחבר עם socket id:', socket.id);

    // קבלת userId מה-client ושמירת מיפוי
    socket.on('register', (userId) => {
      userIdToSocketId[userId] = socket.id;
      console.log('מיפוי userId:', userId, 'ל-socket.id:', socket.id);
    });

    // דוגמה לאירוע
    socket.on('sendMessage', async (data) => {
      console.log('📩 התקבלה הודעה:', data);
      // שמור את ההודעה במונגו
      try {
        const message = new Message(data);
        await message.save();
      } catch (err) {
        console.error('שגיאה בשמירת הודעה:', err);
      }
      // שלח רק לנמען (to)
      const recipientSocketId = userIdToSocketId[data.to];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receiveMessage', data);
        console.log('שלחתי הודעה ל-socket של הנמען:', recipientSocketId);
      }
      // שלח גם לשולח (כדי לעדכן את הצ'אט שלו)
      const senderSocketId = userIdToSocketId[data.from];
      if (senderSocketId && senderSocketId !== recipientSocketId) {
        io.to(senderSocketId).emit('receiveMessage', data);
        console.log('שלחתי הודעה ל-socket של השולח:', senderSocketId);
      }
    });

    socket.on('disconnect', () => {
      // מחק את המיפוי
      for (const [userId, id] of Object.entries(userIdToSocketId)) {
        if (id === socket.id) {
          delete userIdToSocketId[userId];
          break;
        }
      }
      console.log('🔴 משתמש התנתק:', socket.id);
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io עדיין לא מאותחל!");
  }
  return io;
};
