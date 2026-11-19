import mysql from "mysql2";
import env from "./env.js";

const poolConfig = {
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  port: env.db.port,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit,
  queueLimit: 0
};

if (env.db.ssl) {
  poolConfig.ssl = env.db.ssl;
}

const pool = mysql.createPool(poolConfig);

export default pool.promise();