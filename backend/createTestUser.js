const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/shopreview')
    .then(async () => {
        console.log('Connected to MongoDB');

        // Check if test user exists
        const existingUser = await User.findOne({ email: 'test@example.com' });
        if (existingUser) {
            console.log('Test user already exists');
        } else {
            // Create test user
            const user = new User({
                username: 'testuser',
                email: 'test@example.com',
                password: await bcrypt.hash('test1234', 12)
            });
            await user.save();
            console.log('Test user created successfully');
        }

        process.exit();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
