// controllers/CreatePost.js
import Post from "../models/PostModel.js";

export const createPost = async (req, res) => {
  try {
    const { userId, content, imageUrl } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ message: "userId and content are required" });
    }

    const newPost = await Post.create({
      userId,
      content,
      imageUrl: imageUrl || null,
      likes: [],  // default as array
      comments: [],
    });

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    console.log('Fetching all posts...');

    const posts = await Post.aggregate([
      { $match: { groupId: null } }, // Only posts not in groups
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'userinfos', // Updated collection name
          localField: 'userId',
          foreignField: 'userId',
          as: 'userDetails'
        }
      },
      {
        $addFields: {
          user: { $arrayElemAt: ["$userDetails", 0] }
        }
      },
      {
        $project: {
          _id: 1,
          content: 1,
          createdAt: 1,
          userId: 1,
          imageUrl: 1,
          likes: 1,
          comments: 1,
          editedAt: 1,
          "user.first_name": 1,
          "user.last_name": 1,
          "user.profilePicture": 1
        }
      }
    ]);

    console.log('Found posts:', posts.length);
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};
