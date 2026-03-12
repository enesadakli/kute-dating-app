import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

const User = (await import('../models/User.js')).default;

// Remove old demo users to start fresh
await User.deleteMany({ isDemo: true });
console.log('Old demo users removed');

// Download avatar image
const avatarPath = path.join(uploadsDir, 'demo-avatar.jpg');

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            // Follow redirects
            if (res.statusCode === 301 || res.statusCode === 302) {
                file.close();
                fs.unlinkSync(dest);
                return download(res.headers.location, dest).then(resolve).catch(reject);
            }
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(); });
        }).on('error', (err) => {
            fs.unlink(dest, () => {});
            reject(err);
        });
    });
}

try {
    await download('https://randomuser.me/api/portraits/lego/5.jpg', avatarPath);
    console.log('Avatar downloaded');
} catch (e) {
    console.warn('Could not download avatar, continuing without photo:', e.message);
}

const hashedPw = await bcrypt.hash('Demo1234!', 10);

const demoUser = new User({
    name: 'Alex Demo',
    password: hashedPw,
    bio: 'Merhaba! Ben bu uygulamanın test kullanıcısıyım. Her hesaptan beni görebilirsiniz.',
    gender: 'male',
    interestedIn: ['male', 'female', 'other'],
    birthDate: new Date('1997-03-22'),
    isDemo: true,
    photos: fs.existsSync(avatarPath) ? ['/uploads/demo-avatar.jpg'] : [],
});

await demoUser.save();
console.log('Demo user created!');
console.log('  Name:', demoUser.name);
console.log('  ID:  ', demoUser._id.toString());
console.log('  Photos:', demoUser.photos.length ? demoUser.photos[0] : 'none');

await mongoose.disconnect();
console.log('Done.');
