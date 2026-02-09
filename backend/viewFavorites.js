const mongoose = require('mongoose');
const Favorite = require('./models/Favorite');

mongoose.connect('mongodb://localhost:27017/shopreview')
    .then(async () => {
        console.log('Connected to MongoDB');
        const favorites = await Favorite.find();
        console.log('Favorites found:', favorites.length);
        favorites.forEach(favorite => {
            console.log('Favorite:', {
                id: favorite._id,
                shopId: favorite.shopId,
                userId: favorite.userId,
                sessionId: favorite.sessionId
            });
        });
        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
