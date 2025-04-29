import express, { Request, Response } from "express";
import sql from "mssql";
import { connectDB } from "../config/db";
const requestRoutes = express.Router();

requestRoutes.post(
  "/add",
  async (req: Request, res: Response): Promise<any> => {
    const { senderID, receiverUsername } = req.body;

    try {
      const pool = await connectDB();

      // get id of receiver from username
      const result = await pool
        .request()
        .input("receiverUsername", sql.NVarChar, receiverUsername).query(`
            SELECT ID FROM Users WHERE Username = @receiverUsername
          `);

      if (result.recordset.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Receiver not found" });
      }

      const receiverID = result.recordset[0].ID;

      // already friends?
      const existingFriendship = await pool
        .request()
        .input("senderID", sql.Int, senderID)
        .input("receiverID", sql.Int, receiverID).query(`
            SELECT 1 FROM Friends
            WHERE (UserID = @senderID AND FriendID = @receiverID) OR (UserID = @receiverID AND FriendID = @senderID)
          `);

      if (existingFriendship.recordset.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "You are already friends" });
      }

      // already friend request exists?
      const existingRequest = await pool
        .request()
        .input("senderID", sql.Int, senderID)
        .input("receiverID", sql.Int, receiverID).query(`
            SELECT 1 FROM FriendRequests
            WHERE (SenderID = @senderID AND ReceiverID = @receiverID) 
            OR (SenderID = @receiverID AND ReceiverID = @senderID)
          `);

      if (existingRequest.recordset.length > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Friend request already exists" });
      }

      // inserting req in db
      await pool
        .request()
        .input("senderID", sql.Int, senderID)
        .input("receiverID", sql.Int, receiverID).query(`
            INSERT INTO FriendRequests (SenderID, ReceiverID)
            VALUES (@senderID, @receiverID)
          `);

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
    const pool = await connectDB();
    await pool
      .request()
      .input("senderID", sql.Int, senderID)
      .input("receiverID", sql.Int, receiverID).query(`
        DELETE FROM FriendRequests 
        WHERE SenderID = @senderID AND ReceiverID = @receiverID
      `);

    res.status(200).json({ success: true, message: "Friend request removed!" });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

requestRoutes.post("/requests", async (req: Request, res: Response) => {
  const { userID } = req.body;

  try {
    const pool = await connectDB();

    const result = await pool.request().input("userID", sql.Int, userID).query(`
        SELECT 
          FR.SenderID,
          U.Username,
          U.Avatar
        FROM FriendRequests FR
        JOIN Users U ON FR.SenderID = U.ID
        WHERE FR.ReceiverID = @userID
      `);

    if (result.recordset.length >= 0) {
      res.status(200).json({ success: true, friendRequests: result.recordset });
    }
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default requestRoutes;
