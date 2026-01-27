const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    id: String, // Keep the client-side UUID if needed, but we'll also have _id
    name: String,
    status: {
        type: String,
        enum: ["completed", "in-progress", "upcoming"],
        default: "upcoming"
    },
    markedDays: [Number],
    color: String,
    notes: String,
    deadline: Number
});

const milestoneSchema = new mongoose.Schema({
    id: String,
    label: String,
    day: Number,
    type: {
        type: String,
        enum: ["delivery", "inspection", "progress", "completion"],
        default: "progress"
    }
});

const projectSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, "Project Name is required"],
        trim: true
    },
    client: {
        type: String,
        required: [true, "Client Name is required"],
        trim: true
    },
    scale: {
        type: String,
        default: "1:50"
    },
    startDate: {
        type: Date,
        required: [true, "Start Date is required"]
    },
    tasks: [taskSchema],
    milestones: [milestoneSchema],
    holidays: [Number]
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
