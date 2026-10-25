const mongoose = require('mongoose');

const TimetableSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: String, required: true }, // 'Monday', 'Tuesday', etc.
    time: { type: String, required: true }, // e.g., '09:00 AM'
    subject: { type: String, required: true },
    room: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timetable', TimetableSchema);