import express, { Request, Response } from "express";
import sql from "mssql";
import { connectDB } from "../config/db";
const router = express.Router();

// Example: Get all global chat messages
// POST /send - Save a new message
router.post("/send", async (req: Request, res: Response) => {
  const { userId, content } = req.body;
  try {
    const pool = await connectDB();
    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("content", sql.NVarChar(sql.MAX), content).query(`
          INSERT INTO GlobalChat (senderID, content)
          VALUES (@userId, @content)
        `);
    res.status(200).json({ success: true, message: "Message sent!" });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /messages - Fetch latest 15 messages with avatar and username
router.get("/messages", async (req: Request, res: Response) => {
  try {
    const pool = await connectDB();
    const result = await pool.request().query(`
      SELECT 
      U.ID AS SenderID, 
      U.Username, 
      U.Avatar, 
      G.Content
      FROM GlobalChat G 
      LEFT JOIN Users U ON G.SenderID = U.ID
      ORDER BY G.MessageTime
    `);
    res.status(200).json({ success: true, messages: result.recordset });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
