
import mongoose from 'mongoose';


const userInfoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  birthDate: { type: Date, default: null },
  profilePicture: { type: String, default: '' },
  followingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followingPages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Page' }]
}, {
  timestamps: true // adds createdAt and updatedAt automatically
});

const UserInfo = mongoose.model('UserInfo', userInfoSchema);
export default UserInfo;