const bcrypt = require('bcryptjs');
const connectToDatabase = require('../db');

// Function for creating new user
exports.createUser = async function (req, res) {
  const { username, password, email, isActive, group } = req.body;
  const query = 'SELECT * FROM user WHERE username = ?';

  try {
    const connection = await connectToDatabase();
    const result = await connection.query(query, [username]);

    // Check if the user already exist
    if (result[0].length > 0) {
      connection.release();
      res.json({
        success: false,
        message: 'User already existed.',
      });
    } else {
      // Hash the password before storing it in the database
      const hashedPassword = await bcrypt.hash(password, 10);

      // Check if any group is selected, else empty group array will be set to null
      const formattedGroup =
        group !== undefined && group.length > 0 ? group.join(',') : null;

      // Check if emailed is provided, else set to null
      const updatedEmail = email !== '' ? email : null;

      //Check if isActive is set to true
      const updatedIsActive = isActive == true ? 1 : 0;

      // Add and save the user to the database
      await connection.execute(
        'INSERT INTO user (`username`, `password`, `email`, `group`, `isActive`) VALUES (?, ?, ?, ?, ?)',
        [username, hashedPassword, updatedEmail, formattedGroup, updatedIsActive] // Assuming isActive is set to 1 (active) by default
      );
      connection.release();

      res.json({ success: true, message: 'User registered successfully' });
    }
  } catch (err) {
    console.error('Error registering user: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

// Function for getting all user data
exports.getUsers = async function (req, res) {
  const query = 'SELECT * FROM user';

  try {
    const connection = await connectToDatabase();
    if (connection) {
      const result = await connection.query(query);
      connection.release();

      // Send the list of users as the response
      res.json(result[0]);
    } else {
      connection.release();
      res.json({ error: 'Failed' });
    }
  } catch (err) {
    console.error('Error fetching users: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

// Function for getting all groups
exports.getUserGroups = async function (req, res) {
  const query = 'SELECT * FROM `group`';

  try {
    const connection = await connectToDatabase();
    if (connection) {
      const result = await connection.query(query);
      connection.release();

      // Send the list of groups as the response
      res.json(result[0]);
    } else {
      connection.release();
      res.json({ error: 'Failed' });
    }
  } catch (err) {
    console.error('Error fetching groups: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

// Function for updating user details
exports.updateUser = async function (req, res) {
  const { username } = req.params;
  const { password, email, group, isActive } = req.body;

  const query = 'SELECT * FROM user WHERE username = ?';

  try {
    const connection = await connectToDatabase();
    const result = await connection.query(query, [username]);

    if (result[0].length === 0) {
      connection.release();
      res.json({
        success: false,
        message: 'User not found.',
      });
    } else {
      // Check if the email is already taken by another user
      const existingUserWithEmail = await connection.query(
        'SELECT * FROM user WHERE email = ? AND username != ?',
        [email, username]
      );

      if (existingUserWithEmail[0].length > 0) {
        connection.release();
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
          email: email !== undefined ? email || null : result[0][0].email,
          group:
            group !== undefined
              ? group.length > 0
                ? group.join(',')
                : null
              : result[0][0].group,
          isActive: isActive == true ? 1 : 0,
        };

        // Update the user in the database
        await connection.execute(
          'UPDATE user SET `password` = ?, `email` = ?, `group` = ?, `isActive` = ? WHERE `username` = ?',
          [
            updatedFields.password,
            updatedFields.email,
            updatedFields.group,
            updatedFields.isActive,
            username,
          ]
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

exports.createGroup = async function (req, res) {
  const { groupName } = req.body;

  // Check if the groupName already exists in the database
  const query = 'SELECT * FROM `group` WHERE group_name = ?';

  try {
    const connection = await connectToDatabase();
    const result = await connection.query(query, [groupName]);

    if (result[0].length > 0) {
      connection.release();
      // Group name already exists
      res.json({
        success: false,
        message: 'Group already exists',
      });
    } else {
      // Insert the new group into the database
      await connection.execute('INSERT INTO `group` (group_name) VALUES (?)', [
        groupName,
      ]);
      connection.release();
      res.json({
        success: true,
        message: 'Group created successfully',
      });
    }
  } catch (err) {
    console.error('Error creating group: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};
