import express, { Request, Response } from "express";
import sql from "mssql";
import { connectDB } from "../config/db";

const friendRoutes = express.Router();

// add friends route
friendRoutes.post("/add", async (req: Request, res: Response): Promise<any> => {
  const { userId, friendId } = req.body;

  // Basic validation
  if (!userId || !friendId || userId === friendId) {
    return res.status(400).json({ message: "Invalid user IDs" });
  }

  try {
    const pool = await connectDB();

    // checking if friendship already exists
    const check = await pool
      .request()
      .input("UserID", sql.Int, userId)
      .input("FriendID", sql.Int, friendId)
      .query(
        "SELECT * FROM Friends WHERE UserID = @UserID AND FriendID = @FriendID"
      );

    if (check.recordset.length > 0) {
      return res.status(409).json({ message: "Users are already friends" });
    }

    // insert friends query
    await pool
      .request()
      .input("UserID", sql.Int, userId)
      .input("FriendID", sql.Int, friendId)
      .query(
        "INSERT INTO Friends (UserID, FriendID) VALUES (@UserID, @FriendID)"
      );

    res.status(201).json({ message: "Friend added successfully" });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// get friendships of a userID route
friendRoutes.post(
  "/list",
  async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    try {
      const pool = await connectDB();

      // Get all friendships involving the user
      const friendsResult = await pool
        .request()
        .input("UserID", sql.Int, userId).query(`
          SELECT * FROM Friends 
          WHERE UserID = @UserID OR FriendID = @UserID
        `);

      // get the id in each row that is NOT the userID in an array
      const friendIds = friendsResult.recordset.map((row) =>
        row.UserID === userId ? row.FriendID : row.UserID
      );

      // if u got no friends XD
      if (friendIds.length === 0) {
        return res.status(200).json([]);
      }

      // getting usernames of all friends
      const idsList = friendIds.join(","); // create comma-separated list
      const userQuery = await pool.request().query(`
        SELECT ID, Username, Avatar, isDeleted FROM Users WHERE ID IN (${idsList})
      `);
      const friends = userQuery.recordset
        .filter((user) => user.isDeleted !== true)
        .map((user) => ({
          id: user.ID,
          username: user.Username,
        }));
      res.status(200).json(friends);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// removing friend route
friendRoutes.post(
  "/remove",
  async (req: Request, res: Response): Promise<any> => {
    const { userId, friendId } = req.body;

    if (!userId || !friendId || userId === friendId) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    try {
      const pool = await connectDB();

      // checking if the friendship exists
      const check = await pool
        .request()
        .input("UserID", sql.Int, userId)
        .input("FriendID", sql.Int, friendId)
        .query(
          "SELECT * FROM Friends WHERE (UserID = @UserID AND FriendID = @FriendID) OR (UserID = @FriendID AND FriendID = @UserID)"
        );

      if (check.recordset.length === 0) {
        return res.status(404).json({ message: "Friendship not found" });
      }

      // remove friendship query
      await pool
        .request()
        .input("UserID", sql.Int, userId)
        .input("FriendID", sql.Int, friendId)
        .query(
          "DELETE FROM Friends WHERE (UserID = @UserID AND FriendID = @FriendID) OR (UserID = @FriendID AND FriendID = @UserID)"
        );

      // removing private messages between them
      await pool
        .request()
        .input("UserID", sql.Int, userId)
        .input("FriendID", sql.Int, friendId)
        .query(
          "DELETE FROM PrivateMessages WHERE (SenderID = @UserID AND ReceiverID = @FriendID) OR (SenderID = @FriendID AND ReceiverID = @UserID)"
        );

      res
        .status(200)
        .json({ message: "Friend removed and messages deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// get private msgs between 2 userIDs
friendRoutes.post(
  "/messages",
  async (req: Request, res: Response): Promise<any> => {
    const { userId1, userId2 } = req.body;

    if (!userId1 || !userId2 || userId1 === userId2) {
      return res.status(400).json({ message: "Invalid user IDs" });
    }

    try {
      const pool = await connectDB();

      const result = await pool
        .request()
        .input("User1", sql.Int, userId1)
        .input("User2", sql.Int, userId2).query(`
        SELECT pm.SenderID, pm.ReceiverID, pm.Content
        FROM PrivateMessages pm
        JOIN Users u1 ON u1.ID = @User1 AND u1.IsDeleted = 0
        JOIN Users u2 ON u2.ID = @User2 AND u2.IsDeleted = 0
        WHERE 
          (pm.SenderID = @User1 AND pm.ReceiverID = @User2)
          OR 
          (pm.SenderID = @User2 AND pm.ReceiverID = @User1)
        ORDER BY pm.SentTime ASC
      `);

      res.status(200).json(result.recordset);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// add msg between two ids in db
friendRoutes.post(
  "/add-message",
  async (req: Request, res: Response): Promise<any> => {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content || senderId === receiverId) {
      return res.status(400).json({ message: "Invalid data" });
    }

    try {
      const pool = await connectDB();

      // inserting msg query
      await pool
        .request()
        .input("SenderID", sql.Int, senderId)
        .input("ReceiverID", sql.Int, receiverId)
        .input("Content", sql.NVarChar, content).query(`
        INSERT INTO PrivateMessages (SenderID, ReceiverID, Content, SentTime)
        VALUES (@SenderID, @ReceiverID, @Content, GETDATE())
      `);

      res.status(201).json({ message: "Message sent successfully" });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

// get profile of a friend (same as profile in authRoutes but doesnt require u to validate token)
friendRoutes.get(
  "/profile/:id",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const userId: number = parseInt(req.params.id, 10);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      const pool = await connectDB();
      const user = await pool
        .request()
        .input("ID", sql.Int, userId)
        .query(
          "SELECT ID, FirstName, LastName, Email, Username, Avatar, AuthProvider, GamesPlayed, Bio FROM Users WHERE ID = @ID"
        );

      if (user.recordset.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user.recordset[0]);
    } catch (err) {
      console.error("Profile error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default friendRoutes;
