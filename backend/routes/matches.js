import express from 'express';
import Match from '../models/Match.js';
import User from '../models/User.js';

const router = express.Router();

// POST /api/matches/like  — user likes someone
// Body: { fromUserId, toUserId }
// If the other person already liked you → creates a match
router.post('/like', async (req, res) => {
    const { fromUserId, toUserId } = req.body;

    if (!fromUserId || !toUserId) {
        return res.status(400).json({ message: 'fromUserId and toUserId are required.' });
    }

    try {
        // Check if the target user already liked the sender → mutual match
        const existingLike = await Match.findOne({
            users: { $all: [toUserId, fromUserId] },
            status: 'pending',
        });

        if (existingLike) {
            // It's a match!
            existingLike.status = 'matched';
            await existingLike.save();
            return res.status(200).json({ matched: true, match: existingLike });
        }

        // No mutual like yet — record the like as pending
        const newLike = new Match({
            users: [fromUserId, toUserId],
            status: 'pending',
        });
        await newLike.save();

        res.status(201).json({ matched: false, like: newLike });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/matches/nope  — user nopes someone (just records rejection)
// Body: { fromUserId, toUserId }
router.post('/nope', async (req, res) => {
    const { fromUserId, toUserId } = req.body;

    try {
        const rejection = new Match({
            users: [fromUserId, toUserId],
            status: 'rejected',
        });
        await rejection.save();
        res.status(201).json({ rejected: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/matches/:userId  — get all matched users for a user
router.get('/:userId', async (req, res) => {
    try {
        const matches = await Match.find({
            users: req.params.userId,
            status: 'matched',
        }).populate('users', 'name bio');

        // Return the other user in each match (not the current user)
        const result = matches.map((match) => {
            const otherUser = match.users.find(
                (u) => u._id.toString() !== req.params.userId
            );
            return {
                matchId: match._id,
                user: otherUser,
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
