import * as sql from 'mssql';
import 'dotenv/config';

type SqlConfig = {
  server: string;
  database: string;
  user: string;
  password: string;
  port: number;
  pool: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
  };
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
  };
};

const sqlConfig: SqlConfig = {
  server: process.env.DB_SERVER || '',
  database: process.env.DB_NAME || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASS || '',
  port: 56290,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export default async function connectDB(): Promise<void> {
  try {
    await sql.connect(sqlConfig);
    console.log('Connected to Database');
  } catch (err) {
    console.error('Error:', err);
  }
}
