import express, { Request, Response } from 'express';
import sql from 'mssql';
import { connectDB } from '../config/db';

const leaderboardRoutes = express.Router();

// Get leaderboard for a specific game (high to low)
leaderboardRoutes.get('/gameleaderboard/:gameId', async (req: Request, res: Response): Promise<any> => {
    const { gameId } = req.params;
  
    try {
      const pool = await connectDB(); // Ensure the connection is established
      const result = await pool.request()
        .input('GameID', sql.Int, gameId)
        .query(`
          SELECT u.Username, l.Score
          FROM LeaderBoard l
          JOIN Users u ON l.UserID = u.ID
          WHERE l.GameID = @GameID
          ORDER BY l.Score DESC
        `);
          console.log(result.recordset);
      return res.json(result.recordset);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' });
    }
});

// Get score of a user in a specific game
leaderboardRoutes.get('/:userId/:gameId', async (req: Request, res: Response): Promise<any> => {
  const { userId, gameId } = req.params;

  try {
    const pool = await connectDB(); // Ensure the connection is established
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('GameID', sql.Int, gameId)
      .query('SELECT Score FROM LeaderBoard WHERE UserID = @UserID AND GameID = @GameID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Score not found' });
    }

    return res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add or update score for a user in a game
leaderboardRoutes.post('/', async (req: Request, res: Response) => {
  const { userId, gameId, score } = req.body;

  try {
    const pool = await connectDB(); // Ensure the connection is established
    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('GameID', sql.Int, gameId)
      .input('Score', sql.Int, score)
      .query(`
        MERGE LeaderBoard AS target
        USING (SELECT @UserID AS UserID, @GameID AS GameID) AS source
        ON (target.UserID = source.UserID AND target.GameID = source.GameID)
        WHEN MATCHED THEN 
          UPDATE SET Score = @Score
        WHEN NOT MATCHED THEN
          INSERT (UserID, GameID, Score) VALUES (@UserID, @GameID, @Score);
      `);

    res.json({ message: 'Score updated or inserted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default leaderboardRoutes;
