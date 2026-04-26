import express, { Request, Response } from "express";
import { dbQuery } from "../config/db";

const friendRoutes = express.Router();

// add friends route
friendRoutes.post("/add", async (req: Request, res: Response): Promise<any> => {
  const { userId, friendId } = req.body;

  // Basic validation
  if (!userId || !friendId || userId === friendId) {
    return res.status(400).json({ message: "Invalid user IDs" });
  }

  try {
    // checking if friendship already exists
    const check = await dbQuery(
      "SELECT * FROM Friends WHERE UserID = $1 AND FriendID = $2",
      [userId, friendId]
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ message: "Users are already friends" });
    }

    // insert friends query
    await dbQuery("INSERT INTO Friends (UserID, FriendID) VALUES ($1, $2)", [
      userId,
      friendId,
    ]);

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
      // getting all friendships
      const friendsResult = await dbQuery(
        `
        SELECT * FROM Friends 
        WHERE UserID = $1 OR FriendID = $1
      `,
        [userId]
      );

      // getting just ids that arent user's id
      const friendIds: number[] = friendsResult.rows.map((row: any) =>
        row.userid === userId ? row.friendid : row.userid
      );

      if (friendIds.length === 0) {
        return res.status(200).json([]);
      }

      // now query
      const userQuery = await dbQuery(
        `
      SELECT ID, Username, Avatar, IsDeleted FROM Users 
      WHERE ID = ANY($1::int[])
    `,
        [friendIds]
      );

      // making array of ids and usernames from result
      const friends = userQuery.rows
        .filter((user: any) => user.isdeleted !== true)
        .map((user: any) => ({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
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
      // checking if the friendship exists
      const check = await dbQuery(
        "SELECT * FROM Friends WHERE (UserID = $1 AND FriendID = $2) OR (UserID = $2 AND FriendID = $1)",
        [userId, friendId]
      );

      if (check.rows.length === 0) {
        return res.status(404).json({ message: "Friendship not found" });
      }

      // remove friendship query
      await dbQuery(
        "DELETE FROM Friends WHERE (UserID = $1 AND FriendID = $2) OR (UserID = $2 AND FriendID = $1)",
        [userId, friendId]
      );

      // removing private messages between them
      await dbQuery(
        "DELETE FROM PrivateMessages WHERE (SenderID = $1 AND ReceiverID = $2) OR (SenderID = $2 AND ReceiverID = $1)",
        [userId, friendId]
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
      const result = await dbQuery(
        `
        SELECT pm.SenderID, pm.ReceiverID, pm.Content
        FROM PrivateMessages pm
        JOIN Users u1 ON u1.ID = $1 AND u1.IsDeleted = false
        JOIN Users u2 ON u2.ID = $2 AND u2.IsDeleted = false
        WHERE 
          (pm.SenderID = $1 AND pm.ReceiverID = $2)
          OR 
          (pm.SenderID = $2 AND pm.ReceiverID = $1)
        ORDER BY pm.SentTime ASC
      `,
        [userId1, userId2]
      );

      res.status(200).json(
        result.rows.map((row: any) => ({
          SenderID: row.senderid,
          ReceiverID: row.receiverid,
          Content: row.content,
        }))
      );
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
      // inserting msg query
      await dbQuery(
        `
        INSERT INTO PrivateMessages (SenderID, ReceiverID, Content, SentTime)
        VALUES ($1, $2, $3, NOW())
      `,
        [senderId, receiverId, content]
      );

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
      const user = await dbQuery(
        'SELECT ID AS "ID", FirstName AS "FirstName", LastName AS "LastName", Email AS "Email", Username AS "Username", Avatar AS "Avatar", AuthProvider AS "AuthProvider", GamesPlayed AS "GamesPlayed", Bio AS "Bio" FROM Users WHERE ID = $1',
        [userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json(user.rows[0]);
    } catch (err) {
      console.error("Profile error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default friendRoutes;
