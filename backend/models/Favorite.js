const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    sessionId: {
        type: String,
        required: false,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure a user or session can only favorite a shop once
favoriteSchema.index({ shopId: 1, userId: 1 }, { unique: true, sparse: true });
favoriteSchema.index({ shopId: 1, sessionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);
