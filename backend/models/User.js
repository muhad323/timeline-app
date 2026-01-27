const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    securityQuestion: {
        type: String,
        required: true,
    },
    securityAnswer: {
        type: String,
        required: true,
    },
    resetPasswordCode: String,
    resetPasswordExpires: Date
}, { timestamps: true });

// Hash password and security answer before saving
userSchema.pre('save', async function () {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.isModified('securityAnswer')) {
        const salt = await bcrypt.genSalt(10);
        this.securityAnswer = await bcrypt.hash(this.securityAnswer.toLowerCase().trim(), salt);
    }
});

// Compare security answer method
userSchema.methods.compareSecurityAnswer = async function (candidateAnswer) {
    return await bcrypt.compare(candidateAnswer.toLowerCase().trim(), this.securityAnswer);
};

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
