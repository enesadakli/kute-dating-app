import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users — list all users (protected)
router.get('/', authMiddleware, async (_req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/users/register
router.post('/register', async (req, res) => {
    const { name, password, bio, interests } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required.' });
    }

    try {
        const existing = await User.findOne({ name });
        if (existing) {
            return res.status(409).json({ message: 'Username already taken.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, password: hashedPassword, bio: bio || '', interests: interests || [] });
        const savedUser = await newUser.save();

        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: { _id: savedUser._id, name: savedUser.name, bio: savedUser.bio, interests: savedUser.interests }
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// POST /api/users/login
router.post('/login', async (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required.' });
    }

    try {
        const user = await User.findOne({ name });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: { _id: user._id, name: user.name, bio: user.bio, interests: user.interests }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PUT /api/users/:id — update profile (protected)
router.put('/:id', authMiddleware, async (req, res) => {
    const { bio, interests } = req.body;
    try {
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { bio, interests },
            { new: true }
        ).select('-password');
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;