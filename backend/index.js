import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Routes
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import matchRoutes from './routes/matches.js';

// Models
import Message from './models/Message.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/kute-dating-app';

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Register Routes
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/matches', matchRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('Kute Dating App API is running...');
});

// Socket.io Setup for Real-time Chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_match', (matchId) => {
        socket.join(matchId);
        console.log(`User joined match: ${matchId}`);
    });

    socket.on('send_message', async (data) => {
        // data: { matchId, sender, senderName, content }
        io.to(data.matchId).emit('receive_message', data);

        try {
            // Save to DB
            const newMessage = new Message({
                matchId: data.matchId,
                sender: data.sender,
                content: data.content
            });
            await newMessage.save();
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
