const express = require('express');
const router = express.Router();
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const userController = require('./controllers/userController');

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

module.exports = router;
