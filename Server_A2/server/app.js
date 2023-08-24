const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false, // Set to false to optimize session storage, reduce unnecessary overhead
  })
);

// Import the database connection function
const connectToDatabase = require('./db');

const PORT = process.env.PORT || 8080;

// General routing
app.use('/', require('./router'));

app.listen(PORT, async () => {
  try {
    // Connect to the database
    await connectToDatabase();

    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    console.error('Error connecting to the database: ', err);
  }
});
