require("dotenv").config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const connectionString = process.env.DATABASE_URL;

function requireProductionValue(name, fallback) {
  const value = process.env[name] || fallback;
  const insecureValue = ["postgres", "admin123"].includes(value)
    || value.startsWith("reemplazar-");

  if (isProduction && (!process.env[name] || insecureValue)) {
    throw new Error(`La variable ${name} es obligatoria y debe usar un valor seguro en produccion.`);
  }

  if (isProduction && name.endsWith("PASSWORD") && value.length < 12) {
    throw new Error(`La variable ${name} debe tener al menos 12 caracteres en produccion.`);
  }

  return value;
}

const env = {
  nodeEnv,
  port: process.env.PORT || 3001,
  corsOrigins: requireProductionValue("CORS_ORIGIN", "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  db: {
    connectionString,
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT || 5432),
    database: connectionString ? process.env.PGDATABASE : requireProductionValue("PGDATABASE", "funfull_pos"),
    user: connectionString ? process.env.PGUSER : requireProductionValue("PGUSER", "postgres"),
    password: connectionString ? process.env.PGPASSWORD : requireProductionValue("PGPASSWORD", "postgres"),
    connectionTimeoutMillis: 2000,
  },
  admin: {
    user: requireProductionValue("ADMIN_USER", "admin"),
    password: requireProductionValue("ADMIN_PASSWORD", "admin123"),
  },
};

module.exports = env;
