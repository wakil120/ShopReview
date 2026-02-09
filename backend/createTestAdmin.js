const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopreview', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Create admin user
const createAdminUser = async () => {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 12);

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'admin'
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        console.log('Email: admin@example.com');
        console.log('Password: admin123');
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

// Run the script
const run = async () => {
    await connectDB();
    await createAdminUser();
    await mongoose.disconnect();
};

run();
