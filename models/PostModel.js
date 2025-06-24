
import mongoose from 'mongoose';


const PostModel = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

const Post = mongoose.model('post', PostModel );
export default Post;