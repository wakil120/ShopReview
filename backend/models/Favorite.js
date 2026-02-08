const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure a session can only favorite a shop once
favoriteSchema.index({ shopId: 1, sessionId: 1 }, { unique: true });

module.exports = mongoose.models.Favorite || mongoose.model('Favorite', favoriteSchema);
