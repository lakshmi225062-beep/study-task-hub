const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    durationMinutes: { type: Number, required: true },
    date: { type: String, required: true } // YYYY-MM-DD format
});

module.exports = mongoose.model('Session', SessionSchema);