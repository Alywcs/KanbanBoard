const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../db');

//
exports.updateOwnDetails = async function (req, res) {
  const { token, password, email } = req.body;
  if (!token) {
    return res.json({ error: 'No token provided. Please log in.' });
  }
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET); // Verify with JWT secret to validate token signature, if valid and not expired, decode token data

    const userId = decodedToken.username;
    const query = 'SELECT * FROM user WHERE username = ?';

    const connection = await connectToDatabase();
    const result = await connection.query(query, [userId]);

    if (result[0].length === 0) {
      res.json({
        success: false,
        message: 'User not found.',
      });
    } else {
      // Check if the email is already taken by another user
      const existingUserWithEmail = await connection.query(
        'SELECT * FROM user WHERE email = ? AND username != ?',
        [email, userId]
      );

      if (existingUserWithEmail[0].length > 0) {
        res.json({
          success: false,
          existingEmail: true,
          message: 'Email already exists. Please choose a different email.',
        });
      } else {
        let hashedPassword = null;
        if (password !== '') {
          // Hash the password before updating it in the database
          hashedPassword = await bcrypt.hash(password, 10);
        }

        const updatedFields = {
          password: hashedPassword !== null ? hashedPassword : result[0][0].password,
          email: email !== '' || null ? email : result[0][0].email,
        };

        // Update the user in the database
        await connection.execute(
          'UPDATE user SET `password` = ?, `email` = ? WHERE `username` = ?',
          [updatedFields.password, updatedFields.email, userId]
        );
        connection.release();

        res.json({
          success: true,
          message: 'User updated successfully',
        });
      }
    }
  } catch (err) {
    console.error('Error updating user: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};
