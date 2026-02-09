const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register new user
exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email.toLowerCase() === email.toLowerCase()
                    ? 'Email already exists'
                    : 'Username already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const user = new User({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: hashedPassword
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Return user without password
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            token
        };

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );

        // Return user without password
        const userResponse = {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            token
        };

        res.json({
            message: 'Login successful',
            user: userResponse
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Get current user (protected route)
exports.getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const { username, email } = req.body;
        const updates = {};

        if (username) {
            updates.username = username.toLowerCase();
        }

        if (email) {
            updates.email = email.toLowerCase();
        }

        // Check if username/email already exists
        if (username || email) {
            const existingUser = await User.findOne({
                $or: [
                    ...(username ? [{ username: username.toLowerCase(), _id: { $ne: req.user.id } }] : []),
                    ...(email ? [{ email: email.toLowerCase(), _id: { $ne: req.user.id } }] : [])
                ]
            });

            if (existingUser) {
                return res.status(400).json({
                    message: existingUser.email.toLowerCase() === email?.toLowerCase()
                        ? 'Email already exists'
                        : 'Username already exists'
                });
            }
        }

        // Update user
        const user = await User.findByIdAndUpdate(
            req.user.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            message: 'Profile updated successfully',
            user
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout user
exports.logout = async (req, res) => {
    try {
        // In a real application, you would invalidate the token here
        // For now, we'll just send a success response
        res.json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
