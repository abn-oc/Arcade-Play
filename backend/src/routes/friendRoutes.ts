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

friendRoutes.post('/list', async (req: Request, res: Response): Promise<any> => {
    const { userId } = req.body;
  
    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
  
    try {
      const pool = await connectDB();
  
      // Get all friendships involving the user
      const friendsResult = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
          SELECT * FROM Friends 
          WHERE UserID = @UserID OR FriendID = @UserID
        `);
  
      const friendIds = friendsResult.recordset.map(row =>
        row.UserID === userId ? row.FriendID : row.UserID
      );
  
      if (friendIds.length === 0) {
        return res.status(200).json([]);
      }
  
      // Fetch usernames of all friend IDs
      const idsList = friendIds.join(','); // create comma-separated list
      const userQuery = await pool.request().query(`
        SELECT ID, Username FROM Users WHERE ID IN (${idsList})
      `);
  
      const friends = userQuery.recordset.map(user => ({
        id: user.ID,
        username: user.Username,
      }));
  
      res.status(200).json(friends);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
});
  
friendRoutes.post('/remove', async (req: Request, res: Response): Promise<any> => {
  const { userId, friendId } = req.body;

  // Basic validation
  if (!userId || !friendId || userId === friendId) {
    return res.status(400).json({ message: 'Invalid user IDs' });
  }

  try {
    const pool = await connectDB();

    // Check if the friendship exists
    const check = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('FriendID', sql.Int, friendId)
      .query('SELECT * FROM Friends WHERE (UserID = @UserID AND FriendID = @FriendID) OR (UserID = @FriendID AND FriendID = @UserID)');

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    // Remove the friendship
    await pool.request()
      .input('UserID', sql.Int, userId)
      .input('FriendID', sql.Int, friendId)
      .query('DELETE FROM Friends WHERE (UserID = @UserID AND FriendID = @FriendID) OR (UserID = @FriendID AND FriendID = @UserID)');

    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});


export default friendRoutes;
