const connectToDatabase = require('../db');

// Function for creating new plan
exports.createPlan = async function (req, res) {
  const { Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym, Plan_color } =
    req.body;

  // Check if the plan name already exists
  const query = 'SELECT * FROM plan WHERE Plan_MVP_name = ? AND Plan_app_Acronym = ?';
  try {
    const connection = await connectToDatabase();
    const result = await connection.query(query, [Plan_MVP_name, Plan_app_Acronym]);

    if (result[0].length > 0) {
      connection.release();
      res.json({
        success: false,
        message: 'Plan already exists in the application.',
      });
    } else {
      const updatedPlanStartDate = Plan_startDate !== '' ? Plan_startDate : null;
      const updatedPlanEndDate = Plan_endDate !== '' ? Plan_endDate : null;

      // Insert the new plan into the database
      await connection.execute(
        'INSERT INTO plan (`Plan_MVP_name`, `Plan_startDate`, `Plan_endDate`, `Plan_app_Acronym`, `Plan_color`) VALUES (?, ?, ?, ?, ?)',
        [
          Plan_MVP_name,
          updatedPlanStartDate,
          updatedPlanEndDate,
          Plan_app_Acronym,
          Plan_color,
        ]
      );

      connection.release();
      res.json({ success: true, message: 'Plan created successfully' });
    }
  } catch (err) {
    console.error('Error creating plan: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

// Function for updating plan details
exports.updatePlan = async function (req, res) {
  const { Plan_MVP_name } = req.params;
  const { Plan_startDate, Plan_endDate, Plan_app_Acronym, Plan_color } = req.body;

  const query = 'SELECT * FROM plan WHERE Plan_MVP_name = ? AND Plan_app_Acronym = ?';

  try {
    const connection = await connectToDatabase();
    const result = await connection.query(query, [Plan_MVP_name, Plan_app_Acronym]);

    if (result[0].length === 0) {
      connection.release();
      res.json({
        success: false,
        message: 'Plan not found.',
      });
    } else {
      const updatedFields = {
        Plan_startDate:
          Plan_startDate !== undefined
            ? Plan_startDate || null
            : result[0][0].Plan_startDate,
        Plan_endDate:
          Plan_endDate !== undefined ? Plan_endDate || null : result[0][0].Plan_endDate,
      };

      // Update the plan in the database
      await connection.execute(
        'UPDATE plan SET `Plan_startDate` = ?, `Plan_endDate` = ?, `Plan_color` = ? WHERE `Plan_MVP_name` = ? AND `Plan_app_Acronym` = ?',
        [
          updatedFields.Plan_startDate,
          updatedFields.Plan_endDate,
          Plan_color,
          Plan_MVP_name,
          Plan_app_Acronym,
        ]
      );
      connection.release();

      res.json({
        success: true,
        message: 'Plan updated successfully',
      });
    }
  } catch (err) {
    console.error('Error updating plan: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};
