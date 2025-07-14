import { Server } from 'socket.io';

let io; // נגדיר את המשתנה כך שנוכל להשתמש בו מחוץ לפונקציה

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", // החליפי לפי כתובת ה-Frontend שלך אם שונה
      methods: ["GET", "POST"],
    }
  });

  io.on('connection', (socket) => {
    console.log('🟢 משתמש התחבר עם socket id:', socket.id);

    // דוגמה לאירוע
    socket.on('sendMessage', (data) => {
      console.log('📩 התקבלה הודעה:', data);
      // נשלח את ההודעה לכל המשתמשים
      io.emit('receiveMessage', data);
    });

    socket.on('disconnect', () => {
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
