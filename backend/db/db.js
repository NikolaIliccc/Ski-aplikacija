const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  password: "nikola123",
  host: "localhost",
  port: 5432,
  database: "skischool"
});

module.exports = pool;