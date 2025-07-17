import Message from '../models/Message.js';
import UserInfo from '../models/UserInfo.js';
import mongoose from 'mongoose';

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


export const createMessage = async (req, res) => {
  const { from, to, text, time } = req.body;
  const message = new Message({ from, to, text, time });
  await message.save();
  res.json(message);
};


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


export const getUnreadCounts = async (req, res) => {
  const { userId } = req.params;
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const counts = await Message.aggregate([
      { $match: { to: userObjectId, isRead: false } },
      { $group: { _id: '$from', count: { $sum: 1 } } }
    ]);

    const result = {};
    counts.forEach(c => {
      result[String(c._id)] = c.count;
      
    });
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
};


export const markAsRead = async (req, res) => {
  const { from, to } = req.body;
  try {
    const fromObjectId = new mongoose.Types.ObjectId(from);
    const toObjectId = new mongoose.Types.ObjectId(to);
    const updateResult = await Message.updateMany(
      { from: fromObjectId, to: toObjectId, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
}; 