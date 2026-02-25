import express from 'express';
import Message from '../models/Message.js';
import { analyzeChatSentiment } from '../services/aiService.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get messages for a match — also marks all incoming messages as seen
router.get('/:matchId', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({ matchId: req.params.matchId }).populate('sender', 'name');

        // Mark all messages NOT sent by current user as seen
        await Message.updateMany(
            {
                matchId: req.params.matchId,
                sender: { $ne: req.user.id },
                seenBy: { $ne: req.user.id },
            },
            { $addToSet: { seenBy: req.user.id } }
        );

        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Analyze chat
router.post('/:matchId/analyze', async (req, res) => {
    try {
        let formattedMessages;

        // Use messages sent from frontend if available (real-time state)
        const currentUserName = req.body.currentUserName || null;

        if (req.body.messages && req.body.messages.length >= 2) {
            formattedMessages = req.body.messages;
        } else {
            // Fall back to DB
            const dbMessages = await Message.find({ matchId: req.params.matchId })
                .sort({ createdAt: -1 })
                .limit(20)
                .populate('sender', 'name');

            formattedMessages = dbMessages.reverse().map(m => ({
                senderName: m.sender.name,
                content: m.content
            }));
        }

        if (formattedMessages.length < 2) {
            return res.status(400).json({ message: "Not enough messages to analyze." });
        }

        const analysis = await analyzeChatSentiment(formattedMessages, currentUserName);
        res.json(analysis);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
