import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'post', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInfo', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserInfo' }],
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment; 