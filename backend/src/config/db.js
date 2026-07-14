const { Pool } = require("pg");
const env = require("./env");

const pool = new Pool(env.db);

function query(text, params = []) {
  return pool.query(text, params);
}

module.exports = { pool, query };
