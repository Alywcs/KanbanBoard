const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectToDatabase = require('../db');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAILER_HOST,
  port: process.env.MAILER_PORT,
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASSWORD,
  },
});

// Update own profile details
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

// Function for getting all user data
exports.getAppData = async function (req, res) {
  const { App_Acronym } = req.params;
  const query = 'SELECT * FROM application WHERE App_Acronym = ?';

  try {
    const connection = await connectToDatabase();
    const result = await connection.query(query, [App_Acronym]);
    connection.release();

    // Send the list of users as the response
    if (result[0].length === 0) {
      connection.release();
      res.json({
        success: false,
        message: 'No permits found for the application.',
      });
    } else {
      const data = result[0][0];
      connection.release();
      res.json({
        success: true,
        create: data.App_permit_create,
        open: data.App_permit_Open,
        toDo: data.App_permit_toDoList,
        doing: data.App_permit_Doing,
        done: data.App_permit_Done,
      });
    }
  } catch (err) {
    console.error('Error fetching users: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

exports.getApplications = async function (req, res) {
  const query = 'SELECT * FROM application';

  try {
    const connection = await connectToDatabase();
    if (connection) {
      const result = await connection.query(query);
      connection.release();

      // Send the list of applications as the response
      res.json(result[0]);
    } else {
      connection.release();
      res.json({ error: 'Failed' });
    }
  } catch (err) {
    console.error('Error fetching applications: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

exports.getPlans = async function (req, res) {
  const query = 'SELECT * FROM plan';

  try {
    const connection = await connectToDatabase();
    if (connection) {
      const result = await connection.query(query);
      connection.release();

      // Send the list of plans as the response
      res.json(result[0]);
    } else {
      connection.release();
      res.json({ error: 'Failed' });
    }
  } catch (err) {
    console.error('Error fetching plans: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

// Function for finding RNumber in application
async function CheckAndUpdateRNumber(App_Acronym) {
  try {
    const connection = await connectToDatabase();
    const query = 'SELECT * FROM application WHERE App_Acronym = ? ';
    const rNumberResults = await connection.query(query, [App_Acronym]);

    // Check if the application acronym exists in the database
    if (!rNumberResults || rNumberResults[0].length < 1) {
      connection.release(); // Close the connection pool
      return null; // Application doesn't exist
    } else {
      const appRNumber = rNumberResults[0][0].App_Rnumber + 1;
      await connection.execute(
        'UPDATE application SET `App_Rnumber` = ? WHERE App_Acronym = ? ',
        [appRNumber, App_Acronym]
      );
      connection.release(); // Close the connection pool
      return appRNumber;
    }
  } catch (error) {
    console.error('Error checking application rNumber', error);
    return null;
  }
}

// Function for creating new task
exports.createTask = async function (req, res) {
  const { Task_name, Task_plan, Task_description, Task_state, Task_app_Acronym, token } =
    req.body;

  if (!token) {
    return res.json({ error: 'No token provided. Please log in.' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.username;
    const queryCheckUser = 'SELECT * FROM user WHERE username = ?';

    const connection = await connectToDatabase();
    const result = await connection.query(queryCheckUser, [userId]);

    if (result[0].length === 0) {
      res.json({
        success: false,
        message: 'User not found.',
      });
    } else {
      const appRNumber = await CheckAndUpdateRNumber(Task_app_Acronym);

      if (appRNumber === null) {
        return res.json({
          success: false,
          message: 'Application not found.',
        });
      }
      // else {
      //   const checkDupQuery = 'SELECT * FROM task WHERE Task_name = ?';
      //   const dupResult = await connection.query(checkDupQuery, [Task_name]);
      // if (dupResult[0].length > 0) {
      //   return res.json({
      //     success: false,
      //     message: 'Task name already exists.',
      //   });
      // }
      else {
        // Generate the Task_id using the App_Acronym and App_Rnumber
        const Task_id = `${Task_app_Acronym}_${appRNumber}`;
        const createDate_Task = new Date();
        const sgtOptions = {
          timeZone: 'Asia/Singapore',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        };
        const sgtDateTimeString = createDate_Task.toLocaleString('en-US', sgtOptions);
        const updatedFields = {
          Task_creator: userId,
          Task_owner: userId,
          Task_createDate: sgtDateTimeString,
        };

        const auditTrail = [
          {
            Date: sgtDateTimeString,
            Activity: `Task "${Task_name}" was created${
              Task_plan ? ` and added to plan "${Task_plan}".` : '.'
            }`,
            'Task owner': userId,
            State: `Added to "${Task_state}" state`,
          },
        ];

        // Insert the new task into the database
        await connection.execute(
          'INSERT INTO task (`Task_name`, `Task_description`, `Task_notes`, `Task_id`, `Task_plan`, `Task_app_Acronym`, `Task_state`, `Task_creator`, `Task_owner`, `Task_createDate`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            Task_name,
            Task_description,
            JSON.stringify({ notes: auditTrail }),
            Task_id,
            Task_plan,
            Task_app_Acronym,
            Task_state,
            updatedFields.Task_creator,
            updatedFields.Task_owner,
            updatedFields.Task_createDate,
          ]
        );
        connection.release();
        res.json({ success: true, message: 'Task created successfully' });
      }
      //}
    }
  } catch (err) {
    console.error('Error creating task: ', err);
    res.json({ success: false, message: 'Internal Server error' });
  }
};

exports.getTasks = async function (req, res) {
  const { Task_app_Acronym } = req.params;
  const query = 'SELECT * FROM task WHERE Task_app_Acronym = ?';

  try {
    const connection = await connectToDatabase();
    if (connection) {
      const result = await connection.query(query, [Task_app_Acronym]);
      connection.release();
      const tasksWithPlanDetails = await Promise.all(
        result[0].map(async (task) => {
          const Task_Plan_Data = await CheckPlan(task.Task_plan, task.Task_app_Acronym);
          if (Task_Plan_Data) {
            const Task_Plan_color = Task_Plan_Data.Plan_color;
            const Task_Plan_startDate = Task_Plan_Data.Plan_startDate;
            const Task_Plan_endDate = Task_Plan_Data.Plan_endDate;
            return { ...task, Task_Plan_color, Task_Plan_startDate, Task_Plan_endDate };
          } else {
            return task; // Return the task as is, without plan details
          }
        })
      );
      // Send the list of tasks as the response
      res.json(tasksWithPlanDetails);
    } else {
      connection.release();
      res.json({ error: 'Failed' });
    }
  } catch (err) {
    console.error('Error fetching tasks: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

async function CheckPlan(Task_Plan, Task_app_Acronym) {
  try {
    const connection = await connectToDatabase();
    const query = 'SELECT * FROM plan WHERE Plan_MVP_name = ? AND Plan_app_Acronym = ?';
    const taskPlanResults = await connection.query(query, [Task_Plan, Task_app_Acronym]);

    // Check if the application acronym exists in the database
    if (!taskPlanResults || taskPlanResults[0].length < 1) {
      connection.release(); // Close the connection pool
      return null; // plan doesn't exist
    } else {
      const taskPlanData = taskPlanResults[0][0];

      connection.release(); // Close the connection pool
      return taskPlanData;
    }
  } catch (error) {
    console.error('Error checking color code', error);
    return null;
  }
}

// Function for updating task
exports.updateTask = async function (req, res) {
  const {
    Task_id,
    Task_name,
    Task_plan,
    Task_notes,
    Task_state,
    token, // This will be the owner
  } = req.body;

  if (!token) {
    return res.json({ error: 'No token provided. Please log in.' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.username;
    const queryCheckUser = 'SELECT * FROM user WHERE username = ?';

    const connection = await connectToDatabase();
    const result = await connection.query(queryCheckUser, [userId]);

    if (result[0].length === 0) {
      res.json({
        success: false,
        message: 'User not found.',
      });
    } else {
      const queryCheckPrev = 'SELECT * FROM task WHERE Task_name = ? AND Task_id = ?';
      const existingTask = await connection.query(queryCheckPrev, [Task_name, Task_id]);

      const currentDateTime = new Date();
      const sgtOptions = {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      const sgtDateTimeString = currentDateTime.toLocaleString('en-US', sgtOptions);

      const noNoteNoPlan = 'No notes added.';
      const noNoteYesPlan =
        existingTask[0][0].Task_plan === ''
          ? `Added to plan "${Task_plan}".`
          : existingTask[0][0].Task_Plan === Task_plan
          ? `Remain in plan "${Task_plan}.`
          : `Changed to plan "${Task_plan}".`;
      const yesNoteNoPlan = `Added notes "${Task_notes}"`;
      const yesNoteYesPlan = `Added notes "${Task_notes}" and ${
        existingTask[0][0].Task_plan === ''
          ? `added to plan "${Task_plan}".`
          : existingTask[0][0].Task_Plan === Task_plan
          ? `remain in plan "${Task_plan}.`
          : `changed to plan "${Task_plan}".`
      }`;

      const auditTrail = {
        Date: sgtDateTimeString,
        Activity:
          Task_notes === '' && Task_plan === ''
            ? noNoteNoPlan
            : Task_notes === '' && Task_plan !== ''
            ? noNoteYesPlan
            : Task_notes !== '' && Task_plan === ''
            ? yesNoteNoPlan
            : yesNoteYesPlan,
        'Task owner': userId,
        State: `Remained in "${Task_state}" state`,
      };

      const parsedExistingNotes = JSON.parse(existingTask[0][0].Task_notes);
      const updatedNotes = [...parsedExistingNotes.notes, auditTrail];
      const updatedFields = {
        Task_owner: userId,
        Task_notes: JSON.stringify({ notes: updatedNotes }),
      };

      // Update the task
      await connection.execute(
        'UPDATE task SET `Task_notes` = ?, `Task_plan` = ?, `Task_state` = ?, `Task_owner` = ? WHERE `Task_name` = ? AND `Task_id` = ?',
        [
          updatedFields.Task_notes,
          Task_plan,
          Task_state,
          updatedFields.Task_owner,
          Task_name,
          Task_id,
        ]
      );
      connection.release();
      res.json({ success: true, message: 'Task updated successfully' });
    }
  } catch (err) {
    console.error('Error updating task: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

// Function for promoting task
exports.promoteTask = async function (req, res) {
  const {
    Task_name,
    Task_id,
    Task_plan,
    Task_notes,
    Task_state,
    token, // This will be the owner
  } = req.body;

  if (!token) {
    return res.json({ error: 'No token provided. Please log in.' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.username;
    const queryCheckUser = 'SELECT * FROM user WHERE username = ?';

    const connection = await connectToDatabase();
    const result = await connection.query(queryCheckUser, [userId]);

    if (result[0].length === 0) {
      res.json({
        success: false,
        message: 'User not found.',
      });
    } else {
      const stateTransitions = {
        Open: 'To Do',
        'To Do': 'Doing',
        Doing: 'Done',
        Done: 'Closed',
      };

      const queryCheckPrev = 'SELECT * FROM task WHERE Task_name = ? AND Task_id = ?';
      const existingTask = await connection.query(queryCheckPrev, [Task_name, Task_id]);

      const currentDateTime = new Date();
      const sgtOptions = {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      const sgtDateTimeString = currentDateTime.toLocaleString('en-US', sgtOptions);

      const noNoteNoPlan = 'No notes added.';
      const noNoteYesPlan =
        existingTask[0][0].Task_plan === ''
          ? `Added to plan "${Task_plan}".`
          : existingTask[0][0].Task_Plan === Task_plan
          ? `Remain in plan "${Task_plan}.`
          : `Changed to plan "${Task_plan}".`;
      const yesNoteNoPlan = `Added notes "${Task_notes}"`;
      const yesNoteYesPlan = `Added notes "${Task_notes}" and ${
        existingTask[0][0].Task_plan === ''
          ? `added to plan "${Task_plan}".`
          : existingTask[0][0].Task_Plan === Task_plan
          ? `remain in plan "${Task_plan}.`
          : `changed to plan "${Task_plan}".`
      }`;

      const auditTrail = {
        Date: sgtDateTimeString,
        Activity:
          Task_notes === '' && Task_plan === ''
            ? noNoteNoPlan
            : Task_notes === '' && Task_plan !== ''
            ? noNoteYesPlan
            : Task_notes !== '' && Task_plan === ''
            ? yesNoteNoPlan
            : yesNoteYesPlan,
        'Task owner': userId,
        State: `Promoted from "${Task_state}" state to "${stateTransitions[Task_state]}"`,
      };

      const parsedExistingNotes = JSON.parse(existingTask[0][0].Task_notes);
      const updatedNotes = [...parsedExistingNotes.notes, auditTrail];

      const updatedFields = {
        Task_owner: userId,
        Task_notes: JSON.stringify({ notes: updatedNotes }),
        Task_next_state: stateTransitions[Task_state],
      };

      // Update the task
      await connection.execute(
        'UPDATE task SET `Task_notes` = ?, `Task_plan` = ?, `Task_state` = ?, `Task_owner` = ? WHERE `Task_name` = ? AND `Task_id` = ?',
        [
          updatedFields.Task_notes,
          Task_plan,
          updatedFields.Task_next_state,
          updatedFields.Task_owner,
          Task_name,
          Task_id,
        ]
      );

      if (updatedFields.Task_next_state === 'Done') {
        const queryCheckDonePermitGroup =
          'SELECT `App_permit_Done` FROM application WHERE App_Acronym = ?';
        const appDonePermitGroup = await connection.query(queryCheckDonePermitGroup, [
          existingTask[0][0].Task_app_Acronym,
        ]);
        const queryCheckGroupAgainstDonePermit =
          'SELECT `email` FROM user WHERE `group` LIKE ? AND isActive = 1';
        const emailOfDonePermit = await connection.query(
          queryCheckGroupAgainstDonePermit,
          [`%.${appDonePermitGroup[0][0].App_permit_Done}.%`]
        );

        // Sending the email notification
        emailOfDonePermit[0].forEach(async (row) => {
          if (row.email) {
            const mailOptions = {
              from: process.env.MAILER_FROM,
              to: row.email,
              subject: 'Requesting Inspection on Task',
              text: `The task "${Task_name}" has been promoted to Done in "${existingTask[0][0].Task_app_Acronym}" application, please inspect.`,
            };

            try {
              await transporter.sendMail(mailOptions);
              console.log(`Email sent to ${row.email}`);
            } catch (error) {
              console.error(`Error sending email to ${row.email}:`, error);
            }
          }
        });
      }
      connection.release();
      res.json({ success: true, message: 'Task promoted successfully' });
    }
  } catch (err) {
    console.error('Error creating task: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

// Function for demoting task
exports.demoteTask = async function (req, res) {
  const {
    Task_name,
    Task_id,
    Task_plan,
    Task_notes,
    Task_state,
    token, // This will be the owner
  } = req.body;

  if (!token) {
    return res.json({ error: 'No token provided. Please log in.' });
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.username;
    const queryCheckUser = 'SELECT * FROM user WHERE username = ?';

    const connection = await connectToDatabase();
    const result = await connection.query(queryCheckUser, [userId]);

    if (result[0].length === 0) {
      res.json({
        success: false,
        message: 'User not found.',
      });
    } else {
      const stateTransitions = {
        Doing: 'To Do',
        Done: 'Doing',
      };

      const queryCheckPrev = 'SELECT * FROM task WHERE Task_name = ? AND Task_id = ?';
      const existingTask = await connection.query(queryCheckPrev, [Task_name, Task_id]);

      const currentDateTime = new Date();
      const sgtOptions = {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      const sgtDateTimeString = currentDateTime.toLocaleString('en-US', sgtOptions);

      const noNoteNoPlan = 'No notes added.';
      const noNoteYesPlan =
        existingTask[0][0].Task_plan === ''
          ? `Added to plan "${Task_plan}".`
          : existingTask[0][0].Task_Plan === Task_plan
          ? `Remain in plan "${Task_plan}.`
          : `Changed to plan "${Task_plan}".`;
      const yesNoteNoPlan = `Added notes "${Task_notes}"`;
      const yesNoteYesPlan = `Added notes "${Task_notes}" and ${
        existingTask[0][0].Task_plan === ''
          ? `added to plan "${Task_plan}".`
          : existingTask[0][0].Task_Plan === Task_plan
          ? `remain in plan "${Task_plan}.`
          : `changed to plan "${Task_plan}".`
      }`;

      const auditTrail = {
        Date: sgtDateTimeString,
        Activity:
          Task_notes === '' && Task_plan === ''
            ? noNoteNoPlan
            : Task_notes === '' && Task_plan !== ''
            ? noNoteYesPlan
            : Task_notes !== '' && Task_plan === ''
            ? yesNoteNoPlan
            : yesNoteYesPlan,
        'Task owner': userId,
        State: `Demoted from "${Task_state}" state to "${stateTransitions[Task_state]}"`,
      };

      const parsedExistingNotes = JSON.parse(existingTask[0][0].Task_notes);
      const updatedNotes = [...parsedExistingNotes.notes, auditTrail];

      const updatedFields = {
        Task_owner: userId,
        Task_notes: JSON.stringify({ notes: updatedNotes }),
        Task_next_state: stateTransitions[Task_state],
      };
      // Update the task
      await connection.execute(
        'UPDATE task SET `Task_notes` = ?, `Task_plan` = ?, `Task_state` = ?, `Task_owner` = ? WHERE `Task_name` = ? AND `Task_id` = ?',
        [
          updatedFields.Task_notes,
          Task_plan,
          updatedFields.Task_next_state,
          updatedFields.Task_owner,
          Task_name,
          Task_id,
        ]
      );
      connection.release();
      res.json({ success: true, message: 'Task demoted successfully' });
    }
  } catch (err) {
    console.error('Error creating task: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};
