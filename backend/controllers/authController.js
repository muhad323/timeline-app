const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Password Validation Helper
const isStrongPassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSymbols;
};

// @desc    Register new user
exports.register = async (req, res) => {
    try {
        const { username, password, securityQuestion, securityAnswer } = req.body;

        if (!username || !password || !securityQuestion || !securityAnswer) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and symbols.'
            });
        }

        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({ username, password, securityQuestion, securityAnswer });
        await user.save();

        const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, userId: user._id, username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

// @desc    Login
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, userId: user._id, username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Step 1: Get security question for username
exports.getSecurityQuestion = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ message: 'Username not found' });
        res.json({ securityQuestion: user.securityQuestion });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Step 2: Verify security answer
exports.verifySecurityAnswer = async (req, res) => {
    try {
        const { username, securityAnswer } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.compareSecurityAnswer(securityAnswer);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect security answer' });

        res.json({ message: 'Answer verified' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Step 3: Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { username, securityAnswer, newPassword } = req.body;

        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ message: 'New password does not meet strength requirements.' });
        }

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await user.compareSecurityAnswer(securityAnswer);
        if (!isMatch) return res.status(401).json({ message: 'Security verification failed' });

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
