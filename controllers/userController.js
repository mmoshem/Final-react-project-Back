import User from "../models/User.js";
import UserInfo from "../models/UserInfo.js";
import mongoose from "mongoose";

import bcrypt from 'bcryptjs'
const handleUserCommand = async (req, res) => {
  const { command, data } = req.body;

  try {
    switch (command) {
      case "register":
        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
          return res
            .status(400)
            .json({ message: "User with current email already exists" });
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(data.password, saltRounds);
        const newUser = new User({
          email: data.email,
          password: hashedPassword
        });
        await newUser.save();
        await UserInfo.create({
          userId: newUser._id,
          first_name: data.first_name,
          last_name: data.last_name,
          birthDate: null,
          profilePicture: 'https://www.w3schools.com/howto/img_avatar.png',
          followingUsers: [],
          followingPages: []
        });



        return res.json({
          message: "User created successfully :)",
          user: newUser,
        });

      case "login":
        const user = await User.findOne({
          email: data.email,
          password: data.password,
        });
        if (!user) {
          return res.status(401).json({ message: "Invalid email or password" });
        }
        return res.json({ message: "Login successful", type:"user" ,user, answer: true });

      default:
        return res.status(400).json({ message: "Invalid command" });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    const userInfo = await UserInfo.findOne({ userId });
    if (!userInfo) {
      return res.status(404).json({ message: 'UserInfo not found' });
    }
    return res.json(userInfo);
  } catch (error) {
    console.error('Error fetching userInfo:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};


const getFriendsInfo = async (req, res) => {
  try {
    const ids = req.body.allFriendsId;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No friend IDs provided" });
    }

    // Fetch all friends in a single query using $in
    const friends = await UserInfo.find({ userId: { $in: ids } });

    // Map to desired format
    const result = friends.map(friend => ({
      userId: friend.userId,
      profilePicture: friend.profilePicture,
      firstName: friend.first_name,
      lastName: friend.last_name,
    }));

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: `Something went wrong: ${err}` });
  }
};


// module.exports = { handleUserCommand };
export default { handleUserCommand, getUserInfo, getFriendsInfo };
