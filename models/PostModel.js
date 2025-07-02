
import mongoose from 'mongoose';


const PostModel = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  mediaUrls: [{type: [String]}],
  likes: { type: Number, default: 0 }, // number of likes
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  editedAt: { type:Date, default:null}, // flag to indicate if the post has been edited
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

const Post = mongoose.model('post', PostModel );
export default Post;