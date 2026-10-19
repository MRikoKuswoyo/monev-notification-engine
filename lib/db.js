import mysql from "mysql2/promise";

const g = globalThis;
export const pool =
  g.__monevPool ??
  (g.__monevPool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "monev_maganghub",
    dateStrings: true,
    timezone: "Z",
    waitForConnections: true,
    connectionLimit: 10
  }));
