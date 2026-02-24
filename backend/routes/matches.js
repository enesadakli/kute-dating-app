import express from 'express';
import Match from '../models/Match.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// POST /api/matches/like — user likes someone
router.post('/like', authMiddleware, async (req, res) => {
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
            existingLike.status = 'matched';
            await existingLike.save();
            return res.status(200).json({ matched: true, match: existingLike });
        }

        // No mutual like yet — record the like as pending
        const newLike = new Match({ users: [fromUserId, toUserId], status: 'pending' });
        await newLike.save();

        res.status(201).json({ matched: false, like: newLike });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/matches/nope — user nopes someone
router.post('/nope', authMiddleware, async (req, res) => {
    const { fromUserId, toUserId } = req.body;

    try {
        // Prevent duplicate rejection records
        const existing = await Match.findOne({ users: { $all: [fromUserId, toUserId] } });
        if (existing) {
            return res.status(200).json({ rejected: true, existing: true });
        }

        const rejection = new Match({ users: [fromUserId, toUserId], status: 'rejected' });
        await rejection.save();
        res.status(201).json({ rejected: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/matches/interacted/:userId — IDs already acted on
// Must be before /:userId to avoid Express routing conflict
router.get('/interacted/:userId', authMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;
        const matches = await Match.find({ users: userId });

        const interactedIds = matches.flatMap((match) => {
            const isInitiator = match.users[0].toString() === userId;

            if (match.status === 'matched') {
                return match.users
                    .filter(uid => uid.toString() !== userId)
                    .map(uid => uid.toString());
            }

            if (isInitiator) {
                return match.users
                    .filter(uid => uid.toString() !== userId)
                    .map(uid => uid.toString());
            }

            return [];
        });

        res.json(interactedIds);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/matches/:userId — get all matches for a user
router.get('/:userId', authMiddleware, async (req, res) => {
    try {
        const matches = await Match.find({
            users: req.params.userId,
            status: 'matched',
        }).populate('users', 'name bio photos');

        const result = matches.map((match) => {
            const otherUser = match.users.find(
                (u) => u._id.toString() !== req.params.userId
            );
            return { matchId: match._id, user: otherUser };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE /api/matches/:matchId — unmatch
router.delete('/:matchId', authMiddleware, async (req, res) => {
    try {
        await Match.findByIdAndDelete(req.params.matchId);
        res.json({ message: 'Unmatched successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
