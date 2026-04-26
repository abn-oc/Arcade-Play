import express, { Request, Response } from "express";
import { dbQuery } from "../config/db";

const gameRoutes = express.Router();

// get all games route
gameRoutes.get("/games", async (req: Request, res: Response) => {
  try {
    const result = await dbQuery(
      'SELECT GameID AS "GameID", GameName AS "GameName", Icon AS "Icon" FROM Games'
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// get game details via id
gameRoutes.get(
  "/games/:id",
  async (req: Request, res: Response): Promise<any> => {
    const gameId: number = parseInt(req.params.id, 10);

    if (isNaN(gameId)) {
      return res.status(400).json({ error: "Invalid game ID" });
    }

    try {
      const result = await dbQuery(
        'SELECT GameID AS "GameID", GameName AS "GameName", GameDesc AS "GameDesc", MinPlayers AS "MinPlayers", MaxPlayers AS "MaxPlayers", Icon AS "Icon" FROM Games WHERE GameID = $1',
        [gameId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Game not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  }
);

export default gameRoutes;
