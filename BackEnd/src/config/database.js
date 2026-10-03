import mysql from "mysql2";
import env from "./env.js";

const pool = mysql.createPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  port: env.db.port,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0
});

export default pool.promise();