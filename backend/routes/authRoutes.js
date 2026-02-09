const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    getSecurityQuestion,
    verifyAnswer,
    resetPassword
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/security-question/:username', getSecurityQuestion);
router.post('/verify-answer', verifyAnswer);
router.post('/reset-password', resetPassword);
// router.get('/me', protect, getMe); // middleware needs to be created for protect

module.exports = router;
