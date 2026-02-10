const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    client: {
        type: String,
        required: true,
        trim: true
    },
    scale: {
        type: String,
        required: true,
        trim: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'archived'],
        default: 'active'
    },
    tasks: [{
        id: String,
        name: String,
        status: {
            type: String,
            enum: ['completed', 'in-progress', 'upcoming'],
            default: 'upcoming'
        },
        markedDays: [Number],
        color: String,
        notes: String,
        deadline: Number
    }],
    milestones: [{
        id: String,
        label: String,
        day: Number,
        type: {
            type: String,
            enum: ['delivery', 'inspection', 'progress', 'completion']
        }
    }],
    holidays: [Number],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Project', projectSchema);
