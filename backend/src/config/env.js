require("dotenv").config({ quiet: true });

const env = {
  port: process.env.PORT || 3001,
  db: {
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "funfull_pos",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    connectionTimeoutMillis: 2000,
  },
  admin: {
    user: process.env.ADMIN_USER || "admin",
    password: process.env.ADMIN_PASSWORD || "admin123",
  },
};

module.exports = env;
