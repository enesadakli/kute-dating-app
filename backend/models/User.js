import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    bio: { type: String, default: '' },
    photos: [{ type: String }],
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }
    },
    interests: [{ type: String }],
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' });

export default mongoose.models.User || mongoose.model('User', UserSchema);
