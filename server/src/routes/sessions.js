const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth');

// Get study sessions
router.get('/', auth, async (req, res) => {
    try {
        const sessions = await Session.find({ user: req.user.id });
        res.json(sessions);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Log a completed study session
router.post('/', auth, async (req, res) => {
    try {
        const { durationMinutes } = req.body;
        const today = new Date().toISOString().split('T')[0];
        
        const newSession = new Session({
            user: req.user.id,
            durationMinutes: durationMinutes || 25,
            date: today
        });
        const session = await newSession.save();
        res.json(session);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;