import User from "../models/User.js";
import UserInfo from "../models/UserInfo.js";

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
        const newUser = new User({
          email: data.email,
          password: data.password,
        });
        await newUser.save();
        await UserInfo.create({
          userId: newUser._id,
          first_name: data.first_name,
          last_name: data.last_name,
          birthDate: null,
          profilePicture: '',
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

// module.exports = { handleUserCommand };
export default { handleUserCommand, getUserInfo };
