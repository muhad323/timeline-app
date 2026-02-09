const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
// router.get('/me', protect, getMe); // middleware needs to be created for protect

module.exports = router;
