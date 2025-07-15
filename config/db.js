// const mongoose = require('mongoose');
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://kaza1286:mypassword123@clusterfinalproject.rq6qxuh.mongodb.net/?retryWrites=true&w=majority&appName=ClusterFinalProject');
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};

// module.exports = connectDB;
export default connectDB;
