import UserInfo from "../models/UserInfo.js";

export const updateUserInfo = async (req, res) => {
  //const { userId, updates } = req.body;
  const userId = req.params.userId || req.body.userId;
  const updates = req.body.updates || req.body; // תמיכה בשני פורמטים

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


export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query; // q is the search query
    if (!q || q.trim() === '') {
      return res.json([]);
    }

    // Search for users by first_name, last_name, or email
    const users = await UserInfo.find({
      $or: [
      { first_name: { $regex: '^' + q, $options: 'i' } }, // starts with, case-insensitive
      { last_name: { $regex: '^' + q, $options: 'i' } },
      ]
    }).limit(10);

    return res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

