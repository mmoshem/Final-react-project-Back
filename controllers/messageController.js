import Message from '../models/Message.js';
import UserInfo from '../models/UserInfo.js';

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

// Get all users that the user has conversations with
export const getConversations = async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await Message.find({
      $or: [ { from: userId }, { to: userId } ]
    });
    const userIds = new Set();
    messages.forEach(msg => {
      if (msg.from.toString() !== userId) userIds.add(msg.from.toString());
      if (msg.to.toString() !== userId) userIds.add(msg.to.toString());
    });
    const users = await UserInfo.find({ userId: { $in: Array.from(userIds) } })
      .select('first_name last_name profilePicture userId');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
}; 