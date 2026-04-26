import express, { Request, Response } from "express";
import { dbQuery } from "../config/db";
const router = express.Router();

router.post("/send", async (req: Request, res: Response) => {
  const { userId, content } = req.body;
  try {
    await dbQuery(
      `
          INSERT INTO GlobalChat (senderID, content)
          VALUES ($1, $2)
        `,
      [userId, content]
    );
    res.status(200).json({ success: true, message: "Message sent!" });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/messages", async (req: Request, res: Response) => {
  try {
    const result = await dbQuery(`
      SELECT 
      U.ID AS "SenderID", 
      U.Username AS "Username", 
      U.Avatar AS "Avatar", 
      G.Content AS "Content"
      FROM GlobalChat G 
      LEFT JOIN Users U ON G.SenderID = U.ID
      ORDER BY G.MessageTime
    `);
    res.status(200).json({ success: true, messages: result.rows });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
