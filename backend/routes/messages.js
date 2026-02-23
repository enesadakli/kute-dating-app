import express from 'express';
import Message from '../models/Message.js';
import { analyzeChatSentiment } from '../services/aiService.js';

const router = express.Router();

// Get messages for a match
router.get('/:matchId', async (req, res) => {
    try {
        const messages = await Message.find({ matchId: req.params.matchId }).populate('sender', 'name');
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

        const analysis = await analyzeChatSentiment(formattedMessages);
        res.json(analysis);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
