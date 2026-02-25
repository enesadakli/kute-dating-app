import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
    photos: [{ type: String }],
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    interestedIn: [{ type: String }],
    birthDate: { type: Date },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }  // [longitude, latitude]
    },
    interests: [{ type: String }],
    ageRange: {
        min: { type: Number, default: 18 },
        max: { type: Number, default: 60 },
    },
    maxDistance: { type: Number, default: 100 }, // km
    frozen: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false }, // always visible to all users
}, { timestamps: true });

UserSchema.index({ location: '2dsphere' });

export default mongoose.models.User || mongoose.model('User', UserSchema);
