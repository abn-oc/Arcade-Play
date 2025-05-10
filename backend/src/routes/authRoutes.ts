import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sql from "mssql";
import { connectDB } from "../config/db";
import { UserRecord, AuthRequestBody } from "../types/authTypes";
import { error } from "console";

const authRoutes = express.Router();

// secret key for jwt tokens
const SECRET_KEY = "BNZ!G|:17HD$,:1S@e6!CMFU!4)b)x";
// user gets signed out automatically from his browser in this much time if innactive
const TOKEN_EXPIRY = "1d";

// sign up route
authRoutes.post(
  "/signup",
  async (req: Request, res: Response): Promise<any> => {
    const {
      firstName,
      lastName,
      email,
      password,
      username,
      authProvider,
      providerUserID,
    }: AuthRequestBody = req.body;

    if (
      !email ||
      (!password && authProvider === "email") ||
      !username ||
      !firstName ||
      !lastName ||
      !providerUserID ||
      !authProvider
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const pool = await connectDB();

      // checking if username is unique
      const checkUsername = await pool
        .request()
        .input("Username", sql.NVarChar(50), username)
        .query(
          "SELECT COUNT(*) AS count FROM Users WHERE Username = @Username"
        );

      if (checkUsername.recordset[0].count > 0) {
        return res.status(409).json({ error: "Username already taken" });
      }

      // hashing password if email/password signup is done
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

      // preparing query variables
      const request = pool
        .request()
        .input("FirstName", sql.NVarChar(50), firstName)
        .input("LastName", sql.VarChar(50), lastName)
        .input("Email", sql.NVarChar(100), email)
        .input("Passwords", sql.NVarChar(255), hashedPassword || "")
        .input("Username", sql.NVarChar(50), username);

      if (authProvider !== "email") {
        request
          .input("AuthProvider", sql.NVarChar(50), authProvider)
          .input("ProviderUserID", sql.NVarChar(255), providerUserID);
      } else {
        request
          .input("AuthProvider", sql.NVarChar(50), "email")
          .input("ProviderUserID", sql.NVarChar(255), email);
      }

      // query
      await request.query(`
      INSERT INTO Users (FirstName, LastName, Email, Passwords, Username, AuthProvider, ProviderUserID) 
      VALUES (@FirstName, @LastName, @Email, @Passwords, @Username, @AuthProvider, @ProviderUserID)
    `);

      // success
      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      // error
      console.error("Signup error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// sign in
authRoutes.post(
  "/signin",
  async (req: Request, res: Response): Promise<any> => {
    const { email, password, authProvider, providerUserID }: AuthRequestBody =
      req.body;

    if (!email || (!password && !authProvider)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const pool = await connectDB();

      // making query
      let userQuery = `SELECT * FROM Users WHERE Email = @Email AND IsDeleted = 0 AND AuthProvider = @AuthProvider AND ProviderUserID = @ProviderUserID`;
      let request = pool
        .request()
        .input("Email", sql.NVarChar(100), email)
        .input("AuthProvider", sql.NVarChar(50), authProvider)
        .input("ProviderUserID", sql.NVarChar(255), providerUserID);

      // running query and seeing if its not returning 0 results
      const user = await request.query(userQuery);
      if (user.recordset.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // storing user from result in a variable
      const userRecord: UserRecord = user.recordset[0];

      // check if password is valid if user signed in through email/password
      if (authProvider === "email" && password && userRecord.Passwords) {
        const isValid = await bcrypt.compare(password, userRecord.Passwords);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
      }

      // make token
      const token = jwt.sign(
        { id: userRecord.ID, email: userRecord.Email },
        SECRET_KEY,
        { expiresIn: TOKEN_EXPIRY }
      );

      // send token to client
      res.json({ token });
    } catch (err) {
      console.error("Signin error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// to veritfy jwt token
function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): any {
  // getting token string
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied, token missing" });
  }

  // if decoded token string has id, moving on, otherwise throwing error
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }

    if (decoded && typeof decoded === "object" && "id" in decoded) {
      req.user = {
        id: decoded.id as number,
        email: decoded.email as string,
      };

      //verified, go ahead
      next();
    } else {
      return res.status(403).json({ error: "Invalid token payload" });
    }
  });
}

// profile route
authRoutes.get(
  "/profile",
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const userId = req.user.id;

      const pool = await connectDB();
      const user = await pool
        .request()
        .input("ID", sql.Int, userId)
        .query(
          "SELECT ID, FirstName, LastName, Email, Username, Avatar, AuthProvider, GamesPlayed, Bio FROM Users WHERE ID = @ID"
        );

      if (user.recordset.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user.recordset[0]);
    } catch (err) {
      console.error("Profile error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// edit username route
authRoutes.patch(
  "/edit-username",
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    const { newUsername } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!newUsername) {
      return res.status(400).json({ error: "New username is required" });
    }

    try {
      const pool = await connectDB();

      // Check if new username already exists
      const usernameCheck = await pool
        .request()
        .input("Username", sql.NVarChar(50), newUsername)
        .query(
          "SELECT COUNT(*) AS count FROM Users WHERE Username = @Username"
        );

      if (usernameCheck.recordset[0].count > 0) {
        return res.status(409).json({ error: "Username already taken" });
      }

      // query to update username
      await pool
        .request()
        .input("ID", sql.Int, req.user.id)
        .input("Username", sql.NVarChar(50), newUsername)
        .query("UPDATE Users SET Username = @Username WHERE ID = @ID");

      res.json({ message: "Username updated successfully" });
    } catch (err) {
      console.error("Edit username error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// change password route
authRoutes.patch(
  "/change-password",
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    const { originalPassword, newPassword } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!originalPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Both original and new passwords are required" });
    }

    try {
      const pool = await connectDB();
      const userQuery = await pool
        .request()
        .input("ID", sql.Int, req.user.id)
        .query("SELECT Passwords FROM Users WHERE ID = @ID");

      const user = userQuery.recordset[0];

      if (!user.Passwords) {
        return res
          .status(404)
          .json({ error: "Only email/password accounts can change passwords" });
      }

      const isMatch = await bcrypt.compare(originalPassword, user.Passwords);
      if (!isMatch) {
        return res
          .status(401)
          .json({ error: "Original password is incorrect" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      await pool
        .request()
        .input("ID", sql.Int, req.user.id)
        .input("NewPassword", sql.NVarChar(255), hashedNewPassword)
        .query("UPDATE Users SET Passwords = @NewPassword WHERE ID = @ID");

      res.json({ message: "Password updated successfully" });
    } catch (err) {
      console.error("Change password error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// delete account route
authRoutes.delete(
  "/delete-account",
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const pool = await connectDB();

      // timestamp to UN-UNIQUE the UNIQUE attributes
      const timestamp = Date.now().toString();

      await pool
        .request()
        .input("ID", sql.Int, req.user.id)
        .input("Email", sql.VarChar(100), timestamp)
        .input("Username", sql.NVarChar(50), timestamp)
        .input("ProviderUserID", sql.NVarChar(255), timestamp).query(`
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
  }
);

// increase games played route
authRoutes.post(
  "/increase-games-played",
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const pool = await connectDB();

      // getting current games played
      const result = await pool.request().input("ID", sql.Int, req.user.id)
        .query(`
          SELECT GamesPlayed FROM Users
          WHERE ID = @ID AND IsDeleted = 0
        `);

      if (result.recordset.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentGamesPlayed = result.recordset[0].GamesPlayed;

      // update it with + 1
      await pool
        .request()
        .input("ID", sql.Int, req.user.id)
        .input("NewCount", sql.Int, currentGamesPlayed + 1).query(`
          UPDATE Users
          SET GamesPlayed = @NewCount
          WHERE ID = @ID AND IsDeleted = 0
        `);

      res.json({ message: "GamesPlayed incremented successfully" });
    } catch (err) {
      console.error("Increase GamesPlayed error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// edit bio route
authRoutes.patch(
  "/edit-bio",
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    const { newBio } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!newBio) {
      return res.status(400).json({ error: "New bio is required" });
    }

    try {
      const pool = await connectDB();

      // checking if user isnt deleted
      const userQuery = await pool
        .request()
        .input("ID", sql.Int, req.user.id)
        .query("SELECT IsDeleted FROM Users WHERE ID = @ID");

      const user = userQuery.recordset[0];

      if (user.IsDeleted === 1) {
        return res
          .status(400)
          .json({ error: "User account is deleted, cannot update bio" });
      }

      // updating bio query
      await pool
        .request()
        .input("ID", sql.Int, req.user?.id)
        .input("Bio", sql.NVarChar(255), newBio)
        .query("UPDATE Users SET Bio = @Bio WHERE ID = @ID");

      res.json({ message: "Bio updated successfully" });
    } catch (err) {
      console.error("Edit bio error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// change avatar route
authRoutes.patch(
  "/change-avatar",
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { avatarNumber } = req.body;

    if (avatarNumber === undefined || avatarNumber === null) {
      return res.status(400).json({ error: "Avatar number is required" });
    }

    if (avatarNumber < 0 || avatarNumber > 3) {
      return res.status(400).json({ error: "Valid Avatar number is required" });
    }

    try {
      const pool = await connectDB();

      // checking if user isnt deleted
      const userQuery = await pool
        .request()
        .input("ID", sql.Int, req.user?.id)
        .query("SELECT IsDeleted FROM Users WHERE ID = @ID");

      const user = userQuery.recordset[0];

      if (user.IsDeleted === 1) {
        return res
          .status(400)
          .json({ error: "User account is deleted, cannot update avatar" });
      }

      // updating avatar query
      await pool
        .request()
        .input("ID", sql.Int, req.user?.id)
        .input("AvatarNumber", sql.Int, avatarNumber)
        .query("UPDATE Users SET Avatar = @AvatarNumber WHERE ID = @ID");

      res.json({ message: "Avatar updated successfully" });
    } catch (err) {
      console.error("Change avatar error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default authRoutes;
