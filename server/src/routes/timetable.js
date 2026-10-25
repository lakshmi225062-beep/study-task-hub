const express = require('express');
const router = express.Router();
const Timetable = require('../models/Timetable');
const auth = require('../middleware/auth');

// Get timetable entries
router.get('/', auth, async (req, res) => {
    try {
        const entries = await Timetable.find({ user: req.user.id });
        res.json(entries);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Add timetable entry
router.post('/', auth, async (req, res) => {
    try {
        const { day, time, subject, room } = req.body;
        const newEntry = new Timetable({
            day,
            time,
            subject,
            room: room || '',
            user: req.user.id
        });
        const entry = await newEntry.save();
        res.json(entry);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete timetable entry
router.delete('/:id', auth, async (req, res) => {
    try {
        let entry = await Timetable.findById(req.params.id);
        if (!entry) return res.status(404).json({ msg: 'Entry not found' });
        if (entry.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Entry removed' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;