const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../db');

// Function for Login
exports.login = async function (req, res) {
  const { username, password } = req.body;
  const query = 'SELECT * FROM user WHERE username = ?';

  try {
    const connection = await connectToDatabase();
    const result = await connection.query(query, [username]);
    // Check for no user in database
    if (!result || result[0].length < 1) {
      connection.release();
      res.json({
        success: false,
        message: 'Invalid username/password.',
      });
    }
    // Check for not active users
    else if (result[0].length > 0 && result[0][0].isActive != 1) {
      connection.release();
      res.json({
        success: false,
        notActive: true,
        message: 'User disabled. Please contact your admin to activate your account.',
      });
    }
    // Check for active users, successful login
    else if (result[0].length > 0 && result[0][0].isActive == 1) {
      const user = result[0][0];
      const passwordMatch = bcrypt.compareSync(password, user.password);

      // If input password matches the encoded password in database
      if (passwordMatch) {
        const payload = {
          username: user.username,
        };
        const secretKey = process.env.JWT_SECRET;
        const options = { expiresIn: process.env.JWT_EXPIRY };
        const token = jwt.sign(payload, secretKey, options); // Create token for the user

        req.session.token = token;
        connection.release();
        req.session.save(() => {
          res.json({
            success: true,
            message: 'You have successfully logged in.',
            token: req.session.token,
          });
        });
      }
      // Check for invalid credentials
      else {
        connection.release();
        res.json({
          success: false,
          notActive: false,
          message: 'Invalid username/password',
        });
      }
    }
  } catch (err) {
    console.error('Error while fetching user:', err);
    res.json({
      success: false,
      message: 'Failed to process login.',
    });
  }
};

// Function for user's group
async function Checkgroup(userid, groupname) {
  try {
    const connection = await connectToDatabase();
    const query = 'SELECT * FROM user WHERE username = ? AND `group` LIKE ?';
    const params = [userid, `%.${groupname}.%`];
    const userResults = await connection.query(query, params);

    // Check if the user and group exist in the database
    if (!userResults || userResults[0] < 1) {
      connection.release(); // Close the connection pool
      return false; // Either user or group doesn't exist
    } else {
      connection.release(); // Close the connection pool
      return true;
    }
  } catch (error) {
    console.error('Error checking user group', error);
    return false;
  }
}

// Function for checking whether user is admin
exports.checkGroup = async function (req, res) {
  const { token, group } = req.body; // Get token from session storage
  if (!token) {
    return res.json({ error: 'No token provided. Please log in.' });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET); // Verify with JWT secret to validate token signature, if valid and not expired, decode token data

    const userId = decodedToken.username;
    const userGroup = group;
    // Check if the user is an admin based on their group
    const userRights = await Checkgroup(userId, userGroup);
    if (userRights == false) {
      res.json({
        success: false,
        rights: false,
      });
      return false;
    } else {
      res.json({
        success: true,
        rights: true,
      });
      return true;
    }
  } catch (err) {
    console.error('Error verifying token: ', err);
    return res.json({ error: 'Invalid token. Please provide a valid token.' });
  }
};

exports.checkActive = async function (req, res) {
  const { token } = req.body; // Get token from session storage
  if (!token) {
    return res.json({ error: 'No token provided. Please log in.' });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET); // Verify with JWT secret to validate token signature, if valid and not expired, decode token data

    const userId = decodedToken.username;
    const query = 'SELECT `isActive` FROM user WHERE username = ?';

    const connection = await connectToDatabase();
    const result = await connection.query(query, [userId]);

    if (result[0][0].isActive == 1) {
      connection.release();
      res.json({
        success: true,
      });
      return true;
    } else if (result[0][0].isActive == 0) {
      connection.release();
      res.json({
        success: false,
      });
      return false;
    } else {
      connection.release();
      res.json({
        success: false,
        message: 'User not found.',
      });
      return false;
    }
  } catch (err) {
    console.error('Error fetching user isActive status: ', err);
    res.json({ error: 'Internal Server Error' });
    return false;
  }
};
