import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['pending', 'matched', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.models.Match || mongoose.model('Match', MatchSchema);
