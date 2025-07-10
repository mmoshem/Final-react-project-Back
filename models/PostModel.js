import mongoose from 'mongoose';


const PostModel = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  mediaUrls: [{type: String}],
  likes: {
     numberOfLikes:{type: Number, default: 0 },
     users:[{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
  }, // number of likes
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserInfo', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  editedAt: { type:Date, default:null}, // flag to indicate if the post has been edited
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

// Indexes for optimal query performance
PostModel.index({ userId: 1, createdAt: -1 }); // For user posts with date filtering (also covers simple userId queries)
PostModel.index({ userId: 1, mediaUrls: 1 }); // For content filtering (media posts)
PostModel.index({ content: 'text' }); // For text search
PostModel.index({ createdAt: -1 }); // For general date sorting

const Post = mongoose.model('post', PostModel );
export default Post;