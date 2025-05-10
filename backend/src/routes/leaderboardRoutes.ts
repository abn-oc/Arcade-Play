import express, { Request, Response } from "express";
import sql from "mssql";
import { connectDB } from "../config/db";

const leaderboardRoutes = express.Router();

// get leaderboard for a gameid route
leaderboardRoutes.get(
  "/gameleaderboard/:gameId",
  async (req: Request, res: Response): Promise<any> => {
    const { gameId } = req.params;

    try {
      const pool = await connectDB();
      const result = await pool.request().input("GameID", sql.Int, gameId)
        .query(`
        SELECT u.ID, u.Avatar, u.Username, l.Score
        FROM LeaderBoard l
        JOIN Users u ON l.UserID = u.ID
        WHERE l.GameID = @GameID AND u.IsDeleted = 0
        ORDER BY l.Score DESC
      `);
      console.log(result.recordset);
      return res.json(result.recordset);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  }
);

// get score of userid in gameid route
leaderboardRoutes.get(
  "/:userId/:gameId",
  async (req: Request, res: Response): Promise<any> => {
    const { userId, gameId } = req.params;

    try {
      const pool = await connectDB();
      const result = await pool
        .request()
        .input("UserID", sql.Int, userId)
        .input("GameID", sql.Int, gameId).query(`
        SELECT l.Score
        FROM LeaderBoard l
        JOIN Users u ON l.UserID = u.ID
        WHERE l.UserID = @UserID AND l.GameID = @GameID AND u.IsDeleted = 0
      `);

      // return 0 if not available
      if (result.recordset.length === 0) {
        return res.json({ Score: 0 });
      }

      return res.json(result.recordset[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    }
  }
);

// add or update score of userid in gameid route
leaderboardRoutes.post("/", async (req: Request, res: Response) => {
  const { userId, gameId, score } = req.body;

  try {
    //
    const pool = await connectDB();
    await pool
      .request()
      .input("UserID", sql.Int, userId)
      .input("GameID", sql.Int, gameId)
      .input("Score", sql.Int, score).query(`
        MERGE LeaderBoard AS target
        USING (SELECT @UserID AS UserID, @GameID AS GameID) AS source
        ON (target.UserID = source.UserID AND target.GameID = source.GameID)
        WHEN MATCHED THEN 
          UPDATE SET Score = @Score
        WHEN NOT MATCHED THEN
          INSERT (UserID, GameID, Score) VALUES (@UserID, @GameID, @Score);
      `);

    res.json({ message: "Score updated or inserted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default leaderboardRoutes;
