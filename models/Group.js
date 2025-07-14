import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
},
description: {
    type: String,
    required: false,
    maxlength: 500
},
image: {
    type: String,
    default: null
},
isPrivate: {
    type: Boolean,
    default: false
},
creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
},
members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
}],
memberCount: {
    type: Number,
    default: 0
},
createdAt: {
    type: Date,
    default: Date.now
},
pendingRequests: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Change from 'UserInfo' to 'User'
    requestedAt: { type: Date, default: Date.now }
}],
});


export default mongoose.model('Group', groupSchema);