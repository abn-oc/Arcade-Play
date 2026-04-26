import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { dbQuery } from "../config/db";
import { AuthRequestBody } from "../types/authTypes";

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
      // checking if username is unique
      const checkUsername = await dbQuery(
        "SELECT COUNT(*) AS count FROM Users WHERE Username = $1",
        [username]
      );

      if (Number(checkUsername.rows[0].count) > 0) {
        return res.status(409).json({ error: "Username already taken" });
      }

      // hashing password if email/password signup is done
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

      const authProviderValue = authProvider !== "email" ? authProvider : "email";
      const providerUserIDValue =
        authProvider !== "email" ? providerUserID : email;

      // query
      await dbQuery(
        `
      INSERT INTO Users (FirstName, LastName, Email, Passwords, Username, AuthProvider, ProviderUserID) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
        [
          firstName,
          lastName,
          email,
          hashedPassword || "",
          username,
          authProviderValue,
          providerUserIDValue,
        ]
      );

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
      // running query and seeing if its not returning 0 results
      const user = await dbQuery(
        "SELECT * FROM Users WHERE Email = $1 AND IsDeleted = false AND AuthProvider = $2 AND ProviderUserID = $3",
        [email, authProvider, providerUserID]
      );
      if (user.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // storing user from result in a variable
      const userRecord: any = user.rows[0];

      // check if password is valid if user signed in through email/password
      if (authProvider === "email" && password && userRecord.passwords) {
        const isValid = await bcrypt.compare(password, userRecord.passwords);
        if (!isValid) {
          return res.status(401).json({ error: "Invalid credentials" });
        }
      }

      // make token
      const token = jwt.sign(
        { id: userRecord.id, email: userRecord.email },
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

      const user = await dbQuery(
        'SELECT ID AS "ID", FirstName AS "FirstName", LastName AS "LastName", Email AS "Email", Username AS "Username", Avatar AS "Avatar", AuthProvider AS "AuthProvider", GamesPlayed AS "GamesPlayed", Bio AS "Bio" FROM Users WHERE ID = $1',
        [userId]
      );

      if (user.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(user.rows[0]);
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
      // Check if new username already exists
      const usernameCheck = await dbQuery(
        "SELECT COUNT(*) AS count FROM Users WHERE Username = $1",
        [newUsername]
      );

      if (Number(usernameCheck.rows[0].count) > 0) {
        return res.status(409).json({ error: "Username already taken" });
      }

      // query to update username
      await dbQuery("UPDATE Users SET Username = $1 WHERE ID = $2", [
        newUsername,
        req.user.id,
      ]);

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
      const userQuery = await dbQuery(
        "SELECT Passwords FROM Users WHERE ID = $1",
        [req.user.id]
      );

      const user = userQuery.rows[0];

      if (!user.passwords) {
        return res
          .status(404)
          .json({ error: "Only email/password accounts can change passwords" });
      }

      const isMatch = await bcrypt.compare(originalPassword, user.passwords);
      if (!isMatch) {
        return res
          .status(401)
          .json({ error: "Original password is incorrect" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      await dbQuery("UPDATE Users SET Passwords = $1 WHERE ID = $2", [
        hashedNewPassword,
        req.user.id,
      ]);

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
      // timestamp to UN-UNIQUE the UNIQUE attributes
      const timestamp = Date.now().toString();

      await dbQuery(
        `
        UPDATE Users
        SET IsDeleted = true,
            Email = $1,
            Username = $2,
            ProviderUserID = $3
        WHERE ID = $4
      `,
        [timestamp, timestamp, timestamp, req.user.id]
      );

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
      // getting current games played
      const result = await dbQuery(
        `
          SELECT GamesPlayed FROM Users
          WHERE ID = $1 AND IsDeleted = false
        `,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentGamesPlayed = result.rows[0].gamesplayed;

      // update it with + 1
      await dbQuery(
        `
          UPDATE Users
          SET GamesPlayed = $1
          WHERE ID = $2 AND IsDeleted = false
        `,
        [currentGamesPlayed + 1, req.user.id]
      );

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
      // checking if user isnt deleted
      const userQuery = await dbQuery("SELECT IsDeleted FROM Users WHERE ID = $1", [
        req.user.id,
      ]);

      const user = userQuery.rows[0];

      if (user.isdeleted === true) {
        return res
          .status(400)
          .json({ error: "User account is deleted, cannot update bio" });
      }

      // updating bio query
      await dbQuery("UPDATE Users SET Bio = $1 WHERE ID = $2", [
        newBio,
        req.user?.id,
      ]);

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

    const { avatarBlob } = req.body;

    if (!avatarBlob || typeof avatarBlob !== "string") {
      return res.status(400).json({ error: "Avatar blob is required" });
    }

    if (!avatarBlob.startsWith("data:image/")) {
      return res.status(400).json({ error: "Valid image blob is required" });
    }

    try {
      // checking if user isnt deleted
      const userQuery = await dbQuery("SELECT IsDeleted FROM Users WHERE ID = $1", [
        req.user?.id,
      ]);

      const user = userQuery.rows[0];

      if (user.isdeleted === true) {
        return res
          .status(400)
          .json({ error: "User account is deleted, cannot update avatar" });
      }

      // updating avatar query
      await dbQuery("UPDATE Users SET Avatar = $1 WHERE ID = $2", [
        avatarBlob,
        req.user?.id,
      ]);

      res.json({ message: "Avatar updated successfully" });
    } catch (err) {
      console.error("Change avatar error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default authRoutes;
