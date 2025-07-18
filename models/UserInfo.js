
import mongoose from 'mongoose';


const userInfoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  birthDate: { type: Date, default: null },
  gender: { type: String, default: '' },
  experienceLevel: { type: String, default: '' },
  headline: { type: String, default: '' },
  location: {
    city: { type: String, default: '' },
    country: { type: String, default: '' },
  },
  about: { type: String, default: '' },
  education: [
    {
      university: { type: String, default: '' },
      startYear: { type: Number },
      endYear: { type: Number }
    }
  ],
  experience: [
  {
    company: { type: String, default: '' },
    startYear: { type: Number },
    endYear: { type: Number }
  }
  ],
  profilePicture: { type: String, default: '' },
  followingUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followingGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
}, {
  timestamps: true 
});
userInfoSchema.index({ userId: 1 });
const UserInfo = mongoose.model('UserInfo', userInfoSchema);
export default UserInfo;
