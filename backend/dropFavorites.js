const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/shopreview')
    .then(async () => {
        console.log('Connected to MongoDB');
        const db = mongoose.connection;
        await db.dropCollection('favorites');
        console.log('Favorites collection dropped');
        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
