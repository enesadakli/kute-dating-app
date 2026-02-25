import express from 'express';
import Match from '../models/Match.js';
import Message from '../models/Message.js';
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

        // Never filter out demo users — they should always appear in discovery
        const User = (await import('../models/User.js')).default;
        const demoUsers = await User.find({ isDemo: true }).select('_id');
        const demoIds = new Set(demoUsers.map(u => u._id.toString()));
        const filtered = interactedIds.filter(id => !demoIds.has(id));

        res.json(filtered);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET /api/matches/:userId — get all matches for a user, with last message, sorted by recency
router.get('/:userId', authMiddleware, async (req, res) => {
    try {
        const userId = req.params.userId;

        const matches = await Match.find({
            users: userId,
            status: 'matched',
        }).populate('users', 'name bio photos');

        const result = await Promise.all(matches.map(async (match) => {
            const otherUser = match.users.find(u => u._id.toString() !== userId);

            const lastMsg = await Message.findOne({ matchId: match._id })
                .sort({ createdAt: -1 })
                .populate('sender', '_id');

            let lastMessage = null;
            if (lastMsg) {
                const isFromMe = lastMsg.sender._id.toString() === userId;
                const seenBy = lastMsg.seenBy || [];
                const seen = isFromMe
                    ? seenBy.some(id => id.toString() === otherUser._id.toString())
                    : seenBy.some(id => id.toString() === userId);

                lastMessage = {
                    content: lastMsg.content,
                    createdAt: lastMsg.createdAt,
                    isFromMe,
                    seen,
                };
            }

            return { matchId: match._id, user: otherUser, lastMessage };
        }));

        // Sort by most recent message (or match creation date if no messages)
        result.sort((a, b) => {
            const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt) : new Date(0);
            const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt) : new Date(0);
            return bTime - aTime;
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
