
import mongoose from 'mongoose';


const PostModel = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  imageUrl: { type: String, default: null }, // optional image URL
  likes: { type: Number, default: 0 }, // number of likes
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

const Post = mongoose.model('post', PostModel );
export default Post;