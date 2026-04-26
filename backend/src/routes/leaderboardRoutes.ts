import express, { Request, Response } from "express";
import { dbQuery } from "../config/db";

const leaderboardRoutes = express.Router();

// get leaderboard for a gameid route
leaderboardRoutes.get(
  "/gameleaderboard/:gameId",
  async (req: Request, res: Response): Promise<any> => {
    const { gameId } = req.params;

    try {
      const result = await dbQuery(
        `
        SELECT u.ID AS "ID", u.Avatar AS "Avatar", u.Username AS "Username", l.Score AS "Score"
        FROM LeaderBoard l
        JOIN Users u ON l.UserID = u.ID
        WHERE l.GameID = $1 AND u.IsDeleted = false
        ORDER BY l.Score DESC
      `,
        [Number(gameId)]
      );
      console.log(result.rows);
      return res.json(result.rows);
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
      const result = await dbQuery(
        `
        SELECT l.Score AS "Score"
        FROM LeaderBoard l
        JOIN Users u ON l.UserID = u.ID
        WHERE l.UserID = $1 AND l.GameID = $2 AND u.IsDeleted = false
      `,
        [Number(userId), Number(gameId)]
      );

      // return 0 if not available
      if (result.rows.length === 0) {
        return res.json({ Score: 0 });
      }

      return res.json(result.rows[0]);
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
    await dbQuery(
      `
      INSERT INTO LeaderBoard (UserID, GameID, Score)
      VALUES ($1, $2, $3)
      ON CONFLICT (UserID, GameID)
      DO UPDATE SET Score = EXCLUDED.Score
      `,
      [userId, gameId, score]
    );

    res.json({ message: "Score updated or inserted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

export default leaderboardRoutes;
