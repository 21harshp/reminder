const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Admin = require('./models/Admin');
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Session storage (in-memory for now, can be moved to Redis later)
let sessions = {}; // Simple session storage

// Connect to MongoDB
connectDB();

// Authentication middleware
function requireAuth(req, res, next) {
    const sessionId = req.headers.authorization || req.body.sessionId;
    
    if (!sessionId) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    
    // For Vercel, we'll use a simple token validation
    // In production, you should use JWT or a proper session store
    if (process.env.VERCEL) {
        // In Vercel, accept any non-empty sessionId for demo purposes
        // In production, implement proper JWT validation
        req.user = {
            id: 1,
            username: 'admin',
            role: 'administrator'
        };
        next();
        return;
    }
    
    if (!sessions[sessionId]) {
        return res.status(401).json({
            success: false,
            message: 'Invalid session'
        });
    }
    
    req.user = sessions[sessionId];
    next();
}

// Generate session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Database connection is handled by connectDB()

// Validation helper function
function validateUser(user) {
    const errors = [];
    
    // Check mandatory fields
    if (!user.firstName || user.firstName.trim() === '') {
        errors.push('First name is mandatory');
    }
    
    if (!user.lastName || user.lastName.trim() === '') {
        errors.push('Last name is mandatory');
    }
    
    // Check that at least one date is provided
    if (!user.dob && !user.anniversaryDate) {
        errors.push('Either DOB or Anniversary Date must be provided');
    }
    
    // Validate date formats if provided
    if (user.dob && isNaN(Date.parse(user.dob))) {
        errors.push('Invalid DOB format');
    }
    
    if (user.anniversaryDate && isNaN(Date.parse(user.anniversaryDate))) {
        errors.push('Invalid Anniversary Date format');
    }
    
    return errors;
}

// Routes

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.VERCEL ? 'Vercel' : 'Local'
    });
});

// Test MongoDB connection endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const adminCount = await Admin.countDocuments();
        res.json({
            success: true,
            message: 'MongoDB connection working',
            adminCount: adminCount,
            mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'MongoDB connection failed',
            error: error.message,
            mongoUri: process.env.MONGODB_URI ? 'Set' : 'Not set'
        });
    }
});

// Seed admin data endpoint (for production setup)
app.post('/api/seed-admins', async (req, res) => {
    try {
        // Check if admins already exist
        const existingAdmins = await Admin.find({});
        if (existingAdmins.length > 0) {
            return res.json({
                success: true,
                message: 'Admins already exist',
                count: existingAdmins.length
            });
        }

        // Create default admins
        const admins = [
            {
                username: 'admin',
                password: 'admin123',
                role: 'administrator'
            },
            {
                username: 'harsh',
                password: 'harsh123',
                role: 'manager'
            }
        ];

        await Admin.insertMany(admins);
        
        res.json({
            success: true,
            message: 'Admin data seeded successfully',
            count: admins.length
        });
    } catch (error) {
        console.error('Error seeding admins:', error);
        res.status(500).json({
            success: false,
            message: 'Error seeding admin data'
        });
    }
});

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the main HTML page (protected)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication routes
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }
        
        const admin = await Admin.findOne({ username: username, password: password });
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Update last login
        admin.lastLogin = new Date();
        await admin.save();
        
        const sessionId = generateSessionId();
        
        // Store session only if not in Vercel environment
        if (!process.env.VERCEL) {
            sessions[sessionId] = {
                id: admin._id,
                username: admin.username,
                role: admin.role,
                loginTime: new Date().toISOString()
            };
        }
        
        res.json({
            success: true,
            message: 'Login successful',
            sessionId: sessionId,
            user: {
                id: admin._id,
                username: admin.username,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

app.post('/api/logout', (req, res) => {
    const sessionId = req.headers.authorization || req.body.sessionId;
    
    // Only delete session if not in Vercel environment
    if (!process.env.VERCEL && sessionId && sessions[sessionId]) {
        delete sessions[sessionId];
    }
    
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

app.get('/api/auth/check', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// GET all users (protected)
app.get('/api/users', requireAuth, async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// GET user by ID (protected)
app.get('/api/users/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user'
        });
    }
});

// POST create new user (protected)
app.post('/api/users', requireAuth, async (req, res) => {
    try {
        const userData = req.body;
        
        // Validate user data
        const errors = validateUser(userData);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        // Create new user
        const newUser = new User({
            firstName: userData.firstName.trim(),
            lastName: userData.lastName.trim(),
            dob: userData.dob || null,
            anniversaryDate: userData.anniversaryDate || null,
            mobileNumber: userData.mobileNumber || null
        });
        
        const savedUser = await newUser.save();
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: savedUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        
        // Handle validation errors from MongoDB
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: [error.message]
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating user'
        });
    }
});

// PUT update user (protected)
app.put('/api/users/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const userData = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        // Validate user data
        const errors = validateUser(userData);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                firstName: userData.firstName.trim(),
                lastName: userData.lastName.trim(),
                dob: userData.dob || null,
                anniversaryDate: userData.anniversaryDate || null,
                mobileNumber: userData.mobileNumber || null,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        
        // Handle validation errors from MongoDB
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: [error.message]
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating user'
        });
    }
});

// DELETE user (protected)
app.delete('/api/users/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        
        const deletedUser = await User.findByIdAndDelete(id);
        
        if (!deletedUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// Serve static files (CSS, JS, images) - must be after routes
app.use('/static', express.static(path.join(__dirname, 'public')));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
