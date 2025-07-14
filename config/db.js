// const mongoose = require('mongoose');
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://mmoshem1995:3ONqJjN019zAncoe@cluster0.pninpzq.mongodb.net/Android2?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

// module.exports = connectDB;
export default connectDB;
