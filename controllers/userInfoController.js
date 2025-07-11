import UserInfo from "../models/UserInfo.js";

export const updateUserInfo = async (req, res) => {
  //const { userId, updates } = req.body;
  const userId = req.params.userId || req.body.userId;
  const updates = req.body.updates || req.body; 

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

export const followUser = async (req, res) => {
  try {
    const { followerId, followedId } = req.body;

    // ודא ששני המשתמשים קיימים
    const currentUser = await UserInfo.findOne({ userId: followerId  });
    const viewedUser = await UserInfo.findOne({ userId: followedId  });

    if (!currentUser || !viewedUser) {
      return res.status(404).json({ error: "One of the users not found" });
    }

    // אם כבר עוקב – אל תוסיף שוב
    if (!viewedUser.followers.includes(followerId)) {
      viewedUser.followers.push(followerId);
    }

    if (!currentUser.followingUsers.includes(followedId)) {
      currentUser.followingUsers.push(followedId);
    }

    await viewedUser.save();
    await currentUser.save();

    res.status(200).json({ message: "Followed successfully" });
  } catch (err) {
    console.error("Follow error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const unfollowUser = async (req, res) => {

  try {
    const { followerId, followedId } = req.body;

    const currentUser = await UserInfo.findOne({ userId: followerId });
    const viewedUser = await UserInfo.findOne({ userId: followedId });

    if (!currentUser || !viewedUser) {
      return res.status(404).json({ error: "One of the users not found" });
    }

    // הסרה של followerId ממערך העוקבים של המשתמש הנצפה
    viewedUser.followers = viewedUser.followers.filter(id => id.toString() !== followerId);

    // הסרה של followedId ממערך הנעקבים של המשתמש העוקב
    currentUser.followingUsers = currentUser.followingUsers.filter(id => id.toString() !== followedId);

    await viewedUser.save();
    await currentUser.save();

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserInfo.findOne({ userId });
    const followers = await UserInfo.find({ userId: { $in: user.followers } });
    res.json(followers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
};

export const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await UserInfo.findOne({ userId });
    const following = await UserInfo.find({ userId: { $in: user.followingUsers } });
    res.json(following);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch following users' });
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

