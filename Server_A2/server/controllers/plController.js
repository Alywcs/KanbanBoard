const connectToDatabase = require('../db');

// Function for creating new application
exports.createApplication = async function (req, res) {
  const {
    App_Acronym,
    App_Rnumber,
    App_Description,
    App_startDate,
    App_endDate,
    App_permit_create,
    App_permit_Open,
    App_permit_toDoList,
    App_permit_Doing,
    App_permit_Done,
  } = req.body;

  // Check if the application acronym already exists
  const query = 'SELECT * FROM application WHERE App_Acronym = ?';
  try {
    const connection = await connectToDatabase();
    const result = await connection.query(query, [App_Acronym]);

    if (result[0].length > 0) {
      connection.release();
      res.json({
        success: false,
        message: 'Application already exists.',
      });
    } else {
      const updatedAppStartDate = App_startDate !== '' ? App_startDate : null;
      const updatedAppEndDate = App_endDate !== '' ? App_endDate : null;
      const updatedPermitCreate = App_permit_create.length > 0 ? App_permit_create : null;
      const updatedPermitOpen = App_permit_Open.length > 0 ? App_permit_Open : null;
      const updatedPermitToDo =
        App_permit_toDoList.length > 0 ? App_permit_toDoList : null;
      const updatedPermitDoing = App_permit_Doing.length > 0 ? App_permit_Doing : null;
      const updatedPermitDone = App_permit_Done.length > 0 ? App_permit_Done : null;

      // Insert the new application into the database
      await connection.execute(
        'INSERT INTO application (`App_Acronym`, `App_Rnumber`, `App_Description`, `App_startDate`, `App_endDate`, `App_permit_create`, `App_permit_Open`, `App_permit_toDoList`, `App_permit_Doing`, `App_permit_Done`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          App_Acronym,
          App_Rnumber,
          App_Description,
          updatedAppStartDate,
          updatedAppEndDate,
          updatedPermitCreate,
          updatedPermitOpen,
          updatedPermitToDo,
          updatedPermitDoing,
          updatedPermitDone,
        ]
      );

      connection.release();
      res.json({ success: true, message: 'Application created successfully' });
    }
  } catch (err) {
    console.error('Error creating application: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};

// Function for updating application details
exports.updateApplication = async function (req, res) {
  const { App_Acronym } = req.params;
  const {
    App_Rnumber,
    App_Description,
    App_startDate,
    App_endDate,
    App_permit_create,
    App_permit_Open,
    App_permit_toDoList,
    App_permit_Doing,
    App_permit_Done,
  } = req.body;

  const query = 'SELECT * FROM application WHERE App_Acronym = ?';

  try {
    const connection = await connectToDatabase();
    const result = await connection.query(query, [App_Acronym]);

    if (result[0].length === 0) {
      connection.release();
      res.json({
        success: false,
        message: 'Application not found.',
      });
    } else {
      const updatedFields = {
        App_Description:
          App_Description !== undefined
            ? App_Description || null
            : result[0][0].App_Description,
        App_startDate:
          App_startDate !== undefined
            ? App_startDate || null
            : result[0][0].App_startDate,
        App_endDate:
          App_endDate !== undefined ? App_endDate || null : result[0][0].App_endDate,
        App_permit_create:
          App_permit_create !== undefined
            ? App_permit_create || null
            : result[0][0].App_permit_create,
        App_permit_Open:
          App_permit_Open !== undefined
            ? App_permit_Open || null
            : result[0][0].App_permit_Open,
        App_permit_toDoList:
          App_permit_toDoList !== undefined
            ? App_permit_toDoList || null
            : result[0][0].App_permit_toDoList,
        App_permit_Doing:
          App_permit_Doing !== undefined
            ? App_permit_Doing || null
            : result[0][0].App_permit_Doing,
        App_permit_Done:
          App_permit_Done !== undefined
            ? App_permit_Done || null
            : result[0][0].App_permit_Done,
      };

      // Update the application in the database
      await connection.execute(
        'UPDATE application SET `App_Rnumber` = ?, `App_Description` = ?, `App_startDate` = ?, `App_endDate` = ?, `App_permit_create` = ?, `App_permit_Open` = ?, `App_permit_toDoList` = ?, `App_permit_Doing` = ?, `App_permit_Done` = ? WHERE `App_Acronym` = ?',
        [
          App_Rnumber,
          updatedFields.App_Description,
          updatedFields.App_startDate,
          updatedFields.App_endDate,
          updatedFields.App_permit_create,
          updatedFields.App_permit_Open,
          updatedFields.App_permit_toDoList,
          updatedFields.App_permit_Doing,
          updatedFields.App_permit_Done,
          App_Acronym,
        ]
      );
      connection.release();

      res.json({
        success: true,
        message: 'Application updated successfully',
      });
    }
  } catch (err) {
    console.error('Error updating application: ', err);
    res.json({ error: 'Internal Server Error' });
  }
};
