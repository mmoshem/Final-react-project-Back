import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: null }, // URL to profile photo
    name: { type: String, required: false }
});

const User = mongoose.model('User', userSchema, 'registerdUsers');

export default User;