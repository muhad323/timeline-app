const express = require('express');
const router = express.Router();
const {
    register,
    login,
    resetPassword,
    getSecurityQuestion,
    verifySecurityAnswer
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/security-question/:username', getSecurityQuestion);
router.post('/verify-answer', verifySecurityAnswer);
router.post('/reset-password', resetPassword);

module.exports = router;
