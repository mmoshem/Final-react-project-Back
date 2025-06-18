// const User = require('../models/User');
import User from '../models/User.js';
const handleUserCommand = async (req, res) => {
    const { command, data } = req.body;

    try {
        switch (command) {
            case 'register':
                const existingUser = await User.findOne({ email: data.email });
                if (existingUser) {
                    return res.status(400).json({ message: 'User with current email already exists' });
                }
                const newUser = new User({
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    password: data.password
                });
                await newUser.save();
                return res.json({ message: 'User created successfully :)', user: newUser });

            case 'login':
                const user = await User.findOne({ email: data.email, password: data.password });
                if (!user) {
                    return res.status(401).json({ message: 'Invalid email or password' });
                }
                return res.json({ message: 'Login successful', user, answer: true }); 

            default:
                return res.status(400).json({ message: 'Invalid command' });
        }
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// module.exports = { handleUserCommand };
export default { handleUserCommand };