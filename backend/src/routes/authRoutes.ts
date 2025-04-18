import 'dotenv/config';
import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sql from "mssql";
import { connectDB } from "../config/db";
import { UserRecord, AuthRequestBody, JwtPayload } from "../types/authTypes";

const authRoutes = express.Router();

// const SECRET_KEY = process.env.JWT_KEY || 'fallback_key';
// const TOKEN_EXPIRY = process.env.JWT_EXP || '1h';

const SECRET_KEY = "BNZ!G|:17HD$,:1S@e6!CMFU!4)b)x";
const TOKEN_EXPIRY = "1d"

// Signup
authRoutes.get("/test", (req, res) => {
  console.log(SECRET_KEY);
  console.log(typeof SECRET_KEY);
  console.log(TOKEN_EXPIRY);
})

authRoutes.post("/signup", async (req: Request, res: Response): Promise<any> => {
  const { firstName, lastName, email, password, username, authProvider, providerUserID }: AuthRequestBody = req.body;
  if (!email || (!password && !authProvider) || !username) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const pool = await connectDB();

    const checkUsername = await pool.request()
      .input("Username", sql.NVarChar(50), username)
      .query("SELECT COUNT(*) AS count FROM Users WHERE Username = @Username");

    if (checkUsername.recordset[0].count > 0) {
      return res.status(409).json({ error: "Username already taken" });
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    const request = pool.request()
      .input("FirstName", sql.NVarChar(50), firstName || "")
      .input("LastName", sql.VarChar(50), lastName || "")
      .input("Email", sql.NVarChar(100), email)
      .input("Passwords", sql.NVarChar(255), hashedPassword || "")
      .input("Username", sql.NVarChar(50), username);

    if (authProvider && providerUserID) {
      request.input("AuthProvider", sql.NVarChar(50), authProvider)
             .input("ProviderUserID", sql.NVarChar(255), providerUserID);
    } else {
      request.input("AuthProvider", sql.NVarChar(50), "email")
             .input("ProviderUserID", sql.NVarChar(255), email);
    }

    await request.query(`
      INSERT INTO Users (FirstName, LastName, Email, Passwords, Username, AuthProvider, ProviderUserID) 
      VALUES (@FirstName, @LastName, @Email, @Passwords, @Username, @AuthProvider, @ProviderUserID)
    `);

    //query to insert into leaderboard for all games that this user has 0 score

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Signin
authRoutes.post("/signin", async (req: Request, res: Response): Promise<any> => {
  const { email, password, authProvider, providerUserID }: AuthRequestBody = req.body;
  if (!email || (!password && !authProvider)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const pool = await connectDB();
    let userQuery = "SELECT * FROM Users WHERE Email = @Email AND IsDeleted = 0";
    let request = pool.request().input("Email", sql.NVarChar(100), email);

    if (authProvider && providerUserID) {
      userQuery += " AND AuthProvider = @AuthProvider AND ProviderUserID = @ProviderUserID";
      request.input("AuthProvider", sql.NVarChar(50), authProvider)
             .input("ProviderUserID", sql.NVarChar(255), providerUserID);
    }

    const user = await request.query(userQuery);
    if (user.recordset.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const userRecord: UserRecord = user.recordset[0];

    if (!authProvider && password) {
      const validPassword = userRecord.Passwords && (await bcrypt.compare(password, userRecord.Passwords));
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
    }

    const token = jwt.sign({ id: userRecord.ID, email: userRecord.Email } , SECRET_KEY , { expiresIn: TOKEN_EXPIRY });
    res.json({ token });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Middleware to verify JWT
function authenticateToken(req: Request, res: Response, next: NextFunction): any {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  
  if (!token) {
    return res.status(401).json({ error: "Access denied, token missing" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    
    if (decoded && typeof decoded === 'object' && 'id' in decoded) {
      req.user = {
        id: decoded.id as number,
        email: decoded.email as string
      };
      next();
    } else {
      return res.status(403).json({ error: "Invalid token payload" });
    }
  });
}

// Protected route example
authRoutes.get("/profile", authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const userId = req.user.id;
    
    const pool = await connectDB();
    const user = await pool.request()
      .input("ID", sql.Int, userId)
      .query("SELECT ID, FirstName, LastName, Email, Username, Avatar, AuthProvider, GamesPlayed FROM Users WHERE ID = @ID");
    
    if (user.recordset.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(user.recordset[0]);
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Edit Username
authRoutes.patch("/edit-username", authenticateToken, async (req: Request, res: Response): Promise<any> => {
  const { newUsername } = req.body;
  if (!newUsername) {
    return res.status(400).json({ error: "New username is required" });
  }

  try {
    const pool = await connectDB();

    // Check if new username already exists
    const usernameCheck = await pool.request()
      .input("Username", sql.NVarChar(50), newUsername)
      .query("SELECT COUNT(*) AS count FROM Users WHERE Username = @Username");

    if (usernameCheck.recordset[0].count > 0) {
      return res.status(409).json({ error: "Username already taken" });
    }

    // Update username
    await pool.request()
      .input("ID", sql.Int, req.user?.id)
      .input("Username", sql.NVarChar(50), newUsername)
      .query("UPDATE Users SET Username = @Username WHERE ID = @ID");

    res.json({ message: "Username updated successfully" });
  } catch (err) {
    console.error("Edit username error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Change Password
authRoutes.patch("/change-password", authenticateToken, async (req: Request, res: Response): Promise<any> => {
  const { originalPassword, newPassword } = req.body;
  if (!originalPassword || !newPassword) {
    return res.status(400).json({ error: "Both original and new passwords are required" });
  }

  try {
    const pool = await connectDB();
    const userQuery = await pool.request()
      .input("ID", sql.Int, req.user?.id)
      .query("SELECT Passwords FROM Users WHERE ID = @ID");

    const user = userQuery.recordset[0];

    if (!user || !user.Passwords) {
      return res.status(404).json({ error: "User not found or password not set" });
    }

    const isMatch = await bcrypt.compare(originalPassword, user.Passwords);
    if (!isMatch) {
      return res.status(401).json({ error: "Original password is incorrect" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await pool.request()
      .input("ID", sql.Int, req.user?.id)
      .input("NewPassword", sql.NVarChar(255), hashedNewPassword)
      .query("UPDATE Users SET Passwords = @NewPassword WHERE ID = @ID");

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Account (Soft delete)
authRoutes.delete("/delete-account", authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    const pool = await connectDB();

    // Soft delete the user
    const timestamp = Date.now().toString();

    await pool.request()
      .input("ID", sql.Int, req.user?.id)
      .input("Email", sql.VarChar(100), timestamp)
      .input("Username", sql.NVarChar(50), timestamp)
      .input("ProviderUserID", sql.NVarChar(255), timestamp)
      .query(`
        UPDATE Users
        SET IsDeleted = 1,
            Email = @Email,
            Username = @Username,
            ProviderUserID = @ProviderUserID
        WHERE ID = @ID
      `);

    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Increase GamesPlayed by 1
authRoutes.post("/increase-games-played", authenticateToken, async (req: Request, res: Response): Promise<any> => {
  try {
    console.log("YOU CALLED TS")
    const pool = await connectDB();
    console.log("im using ts for increasing gaem " + req.user?.id);
    await pool.request()
      .input("ID", sql.Int, req.user?.id)
      .query(`
        UPDATE Users
        SET GamesPlayed = ISNULL(GamesPlayed, 0) + 1
        WHERE ID = @ID AND IsDeleted = 0
      `);

    res.json({ message: "GamesPlayed incremented successfully" });
  } catch (err) {
    console.error("Increase GamesPlayed error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default authRoutes;
