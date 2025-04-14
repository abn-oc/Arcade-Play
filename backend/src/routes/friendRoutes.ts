import express, { Request, Response } from 'express';
import sql from 'mssql';
import { connectDB } from '../config/db';

const friendRoutes = express.Router();

// POST /api/friends/add - Add a friend
friendRoutes.post('/add', async (req: Request, res: Response): Promise<any> => {
  const { userId, friendId } = req.body;

  // Basic validation
  if (!userId || !friendId || userId === friendId) {
    return res.status(400).json({ message: 'Invalid user IDs' });
  }

  try {
    const pool = await connectDB();

    // Check if friendship already exists
    const check = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('FriendID', sql.Int, friendId)
      .query('SELECT * FROM Friends WHERE UserID = @UserID AND FriendID = @FriendID');

    if (check.recordset.length > 0) {
      return res.status(409).json({ message: 'Users are already friends' });
    }

    // Insert the friendship
    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('FriendID', sql.Int, friendId)
      .query('INSERT INTO Friends (UserID, FriendID) VALUES (@UserID, @FriendID)');

    res.status(201).json({ message: 'Friend added successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default friendRoutes;
