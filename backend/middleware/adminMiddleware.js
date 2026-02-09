const adminMiddleware = async (req, res, next) => {
    try {
        // Check if user is authenticated and is admin
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = adminMiddleware;
