import express, { Request, Response } from 'express';
import sql from 'mssql';
import { connectDB } from "../config/db";

const gameRoutes = express.Router();

// Endpoint 1: Get ID, Name, Icon of all games
gameRoutes.get('/games', async (req: Request, res: Response) => {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .query('SELECT GameID, GameName, Icon FROM Games');

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Endpoint 2: Get full details of a game by ID
gameRoutes.get('/games/:id', async (req: Request, res: Response): Promise<any> => {
  const gameId: number = parseInt(req.params.id, 10);
  
  if (isNaN(gameId)) {
    return res.status(400).json({ error: 'Invalid game ID' });
  }

  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('GameID', sql.Int, gameId)
      .query('SELECT * FROM Games WHERE GameID = @GameID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default gameRoutes;
