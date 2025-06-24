import Post from "../models/PostModel.js";

export const createPost = async (req, res) => {
  try {
    const { userId, content } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ message: "userId and content are required" });
    }
    const newPost = await Post.create({ userId, content });
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};