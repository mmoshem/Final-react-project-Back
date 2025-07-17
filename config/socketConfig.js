import { Server } from 'socket.io';
import Message from '../models/Message.js';

let io;
const userIdToSocketId = {};

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", 
      methods: ["GET", "POST"],
    }
  });

  io.on('connection', (socket) => {

    socket.on('register', (userId) => {
      userIdToSocketId[userId] = socket.id;
    });

socket.on('sendMessage', async (data) => {
    
    try {
        const message = new Message(data);
        await message.save();
    } catch (err) {
        console.error('שגיאה בשמירת הודעה:', err);
    }
    
    const recipientSocketId = userIdToSocketId[data.to];
    if (recipientSocketId) {
        io.to(recipientSocketId).emit('receiveMessage', data);
    }
    
    const senderSocketId = userIdToSocketId[data.from];
    if (senderSocketId && senderSocketId !== recipientSocketId) {
        io.to(senderSocketId).emit('receiveMessage', data);
    }
});

    socket.on('disconnect', () => {
      for (const [userId, id] of Object.entries(userIdToSocketId)) {
        if (id === socket.id) {
          delete userIdToSocketId[userId];
          break;
        }
      }
    });
  });
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io עדיין לא מאותחל!");
  }
  return io;
};
