const mysql = require('mysql2/promise'); // Imported promise for async code
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // Allow the process to load environment variables

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function connectToDatabase() {
  try {
    const connection = await pool.getConnection();
    //console.log('Connected to the database');
    return connection;
  } catch (err) {
    console.error('Error connecting to the database: ', err);
    throw err;
  }
}

module.exports = connectToDatabase;
