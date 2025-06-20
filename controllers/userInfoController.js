import UserInfo from "../models/UserInfo.js";

export const updateUserInfo = async (req, res) => {
  const { userId, updates } = req.body;

  try {
    const updatedInfo = await UserInfo.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true }
    );
    res.json({ message: "User info updated", updatedInfo });
  } catch (error) {
    console.error("Error updating user info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
