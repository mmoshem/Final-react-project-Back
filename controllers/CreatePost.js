import Post from "../models/PostModel.js";

export const createPost = async (req, res) => {
  try {
    const { userId, content, mediaUrls } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ message: "userId and content are required" });
    }
    const newPost = await Post.create({
      userId,
      content,
      mediaUrls: mediaUrls || null,
      likes: 0,
      comments: []
    });
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    // Aggregate posts with user info
    const posts = await Post.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'userinfos',
          localField: 'userId',
          foreignField: 'userId',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          content: 1,
          createdAt: 1,
          userId: 1,
          mediaUrls: 1,
          likes: 1,
          comments: 1,
          profilePicture: '$userInfo.profilePicture',
          first_name: '$userInfo.first_name',
          last_name: '$userInfo.last_name',
          editedAt: 1, 
        },
      },
    ]);
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};