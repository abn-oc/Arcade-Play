export interface UserRecord {
  ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Passwords?: string;
  Username: string;
  Avatar?: string;
  AuthProvider?: string;
  ProviderUserID?: string;
}

export interface AuthRequestBody {
  firstName?: string;
  lastName?: string;
  email: string;
  password?: string;
  username?: string;
  authProvider?: string;
  providerUserID?: string;
}

export interface JwtPayload {
  id: number;
  email: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
