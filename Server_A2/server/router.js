const express = require('express');
const router = express.Router();
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const userController = require('./controllers/userController');
const plController = require('./controllers/plController');
const pmController = require('./controllers/pmController');

router.get('/', (req, res) => res.send('Successful!'));

// Authentication routes
router.post('/login', authController.login);
router.post('/checkGroup', authController.checkGroup);
router.post('/checkActive', authController.checkActive);

// Admin routes
router.post('/createUser', adminController.createUser);
router.get('/getUsers', adminController.getUsers);
router.get('/getUserGroups', adminController.getUserGroups);
router.post('/updateUser/:username', adminController.updateUser);
router.post('/createGroup', adminController.createGroup);

// User routes
router.post('/updateOwnDetails', userController.updateOwnDetails);
router.get('/getAppData/:App_Acronym', userController.getAppData);
router.get('/getApplications', userController.getApplications);
router.get('/getPlans', userController.getPlans);
router.post('/createTask', userController.createTask);
router.get('/getTasks/:Task_app_Acronym', userController.getTasks);
router.post('/updateTask', userController.updateTask);
router.post('/promoteTask', userController.promoteTask);
router.post('/demoteTask', userController.demoteTask);

// Project Lead routes
router.post('/createApplication', plController.createApplication);
router.post('/updateApplication/:App_Acronym', plController.updateApplication);

// Project Manager routes
router.post('/createPlan', pmController.createPlan);
router.post('/updatePlan/:Plan_MVP_name', pmController.updatePlan);

module.exports = router;
