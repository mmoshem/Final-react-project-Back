import Message from '../models/Message.js';

// Get all messages between two users
export const getMessagesBetweenUsers = async (req, res) => {
  const { user1, user2 } = req.params;
  const messages = await Message.find({
    $or: [
      { from: user1, to: user2 },
      { from: user2, to: user1 }
    ]
  }).sort('time');
  res.json(messages);
};

// Post a new message
export const createMessage = async (req, res) => {
  const { from, to, text, time } = req.body;
  const message = new Message({ from, to, text, time });
  await message.save();
  res.json(message);
}; 