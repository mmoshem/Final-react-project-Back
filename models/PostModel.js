import mongoose from 'mongoose';

const PostModel = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  imageUrl: { type: String, default: null },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  
  // NEW LIKES STRUCTURE (array of users who liked)
  likes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    likedAt: { type: Date, default: Date.now }
  }],
  
  // NEW COMMENTS STRUCTURE  
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    likes: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      likedAt: { type: Date, default: Date.now }
    }]
  }],
  
  editedAt: { type: Date, default: null }
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

const Post = mongoose.model('post', PostModel);
export default Post;