import express, { Request, Response } from "express";
import { dbQuery } from "../config/db";
const requestRoutes = express.Router();

requestRoutes.post(
  "/add",
  async (req: Request, res: Response): Promise<any> => {
    const { senderID, receiverUsername } = req.body;

    try {
      // get id of receiver from username
      const result = await dbQuery("SELECT ID FROM Users WHERE Username = $1", [
        receiverUsername,
      ]);

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Receiver not found" });
      }

      const receiverID = result.rows[0].id;

      // already friends?
      const existingFriendship = await dbQuery(
        `
            SELECT 1 FROM Friends
            WHERE (UserID = $1 AND FriendID = $2) OR (UserID = $2 AND FriendID = $1)
          `,
        [senderID, receiverID]
      );

      if (existingFriendship.rows.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "You are already friends" });
      }

      // already friend request exists?
      const existingRequest = await dbQuery(
        `
            SELECT 1 FROM FriendRequests
            WHERE (SenderID = $1 AND ReceiverID = $2) 
            OR (SenderID = $2 AND ReceiverID = $1)
          `,
        [senderID, receiverID]
      );

      if (existingRequest.rows.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Friend request already exists" });
      }

      // inserting req in db
      await dbQuery(
        `
            INSERT INTO FriendRequests (SenderID, ReceiverID)
            VALUES ($1, $2)
          `,
        [senderID, receiverID]
      );

      res.status(200).json({ success: true, message: "Friend request sent!" });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

requestRoutes.post("/remove", async (req: Request, res: Response) => {
  const { senderID, receiverID } = req.body;

  try {
    await dbQuery(
      `
        DELETE FROM FriendRequests 
        WHERE SenderID = $1 AND ReceiverID = $2
      `,
      [senderID, receiverID]
    );

    res.status(200).json({ success: true, message: "Friend request removed!" });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

requestRoutes.post("/requests", async (req: Request, res: Response) => {
  const { userID } = req.body;

  try {
    const result = await dbQuery(
      `
        SELECT 
          FR.SenderID AS "SenderID",
          U.Username AS "Username",
          U.Avatar AS "Avatar"
        FROM FriendRequests FR
        JOIN Users U ON FR.SenderID = U.ID
        WHERE FR.ReceiverID = $1
      `,
      [userID]
    );

    if (result.rows.length >= 0) {
      res.status(200).json({ success: true, friendRequests: result.rows });
    }
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default requestRoutes;
