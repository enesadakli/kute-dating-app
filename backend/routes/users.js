import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Match from '../models/Match.js';
import { authMiddleware } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${req.params.id}-${Date.now()}${ext}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

const router = express.Router();

// GET /api/users — list users, filtered by current user's preferences
router.get('/', authMiddleware, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const blocked = currentUser.blockedUsers || [];

        const query = { _id: { $nin: [req.user.id, ...blocked] } };

        // Filter by gender preference if set
        if (currentUser.interestedIn && currentUser.interestedIn.length > 0) {
            query.gender = { $in: currentUser.interestedIn };
        }

        const users = await User.find(query).select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/users/register
router.post('/register', async (req, res) => {
    const { name, password, bio, interests, gender, interestedIn, birthDate } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: 'Name and password are required.' });
    }

    try {
        const existing = await User.findOne({ name });
        if (existing) {
            return res.status(409).json({ message: 'Username already taken.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            password: hashedPassword,
            bio: bio || '',
            interests: interests || [],
            gender: gender || 'other',
            interestedIn: interestedIn || [],
            birthDate: birthDate ? new Date(birthDate) : undefined,
        });
        const savedUser = await newUser.save();

        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                _id: savedUser._id,
                name: savedUser.name,
                bio: savedUser.bio,
                interests: savedUser.interests,
                gender: savedUser.gender,
                interestedIn: savedUser.interestedIn,
                photos: savedUser.photos,
            }
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
            user: {
                _id: user._id,
                name: user.name,
                bio: user.bio,
                interests: user.interests,
                gender: user.gender,
                interestedIn: user.interestedIn,
                photos: user.photos,
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/users/block/:userId — block a user (must be before /:id routes)
router.post('/block/:userId', authMiddleware, async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { blockedUsers: req.params.userId } }
        );
        // Remove any matches between the two users
        await Match.deleteMany({
            users: { $all: [req.user.id, req.params.userId] }
        });
        res.json({ message: 'User blocked successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/users/:id/photos — upload a profile photo
router.post('/:id/photos', authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded.' });
        }
        const photoUrl = `/uploads/${req.file.filename}`;
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { $push: { photos: photoUrl } },
            { new: true }
        ).select('-password');
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT /api/users/:id — update profile (bio, interests, gender, interestedIn)
router.put('/:id', authMiddleware, async (req, res) => {
    const { bio, interests, gender, interestedIn } = req.body;
    try {
        const updated = await User.findByIdAndUpdate(
            req.params.id,
            { bio, interests, gender, interestedIn },
            { new: true }
        ).select('-password');
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/users/:id/photos/:photoIndex — remove a photo
router.delete('/:id/photos/:photoIndex', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.photos.splice(parseInt(req.params.photoIndex), 1);
        await user.save();
        res.json(user);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

export default router;
