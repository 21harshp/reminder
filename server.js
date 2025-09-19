const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// JSON file database
const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_FILE = path.join(__dirname, 'admin.json');
let users = [];
let nextId = 1;
let admins = [];
let sessions = {}; // Simple session storage

// Load data from file
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const parsedData = JSON.parse(data);
            users = parsedData.users || [];
            nextId = parsedData.nextId || 1;
        } else {
            // Create initial data file
            saveData();
        }
    } catch (error) {
        console.error('Error loading data:', error);
        users = [];
        nextId = 1;
    }
}

// Save data to file
function saveData() {
    try {
        const data = {
            users: users,
            nextId: nextId,
            lastUpdated: new Date().toISOString()
        };
        
        // Check if we're in a Vercel environment (read-only filesystem)
        if (process.env.VERCEL) {
            console.log('Vercel environment detected - data not persisted to file');
            return; // Skip file writing in Vercel
        }
        
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving data:', error);
        // Don't throw error in Vercel environment
        if (!process.env.VERCEL) {
            throw error;
        }
    }
}

// Load admin data
function loadAdminData() {
    try {
        if (fs.existsSync(ADMIN_FILE)) {
            const data = fs.readFileSync(ADMIN_FILE, 'utf8');
            const parsedData = JSON.parse(data);
            admins = parsedData.admins || [];
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
        admins = [];
    }
}

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

// Load data on server start
loadData();
loadAdminData();

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

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve the main HTML page (protected)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }
    
    const admin = admins.find(a => a.username === username && a.password === password);
    
    if (!admin) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
    
    const sessionId = generateSessionId();
    
    // Store session only if not in Vercel environment
    if (!process.env.VERCEL) {
        sessions[sessionId] = {
            id: admin.id,
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
            id: admin.id,
            username: admin.username,
            role: admin.role
        }
    });
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
app.get('/api/users', requireAuth, (req, res) => {
    res.json({
        success: true,
        data: users
    });
});

// GET user by ID (protected)
app.get('/api/users/:id', requireAuth, (req, res) => {
    const id = parseInt(req.params.id);
    const user = users.find(u => u.id === id);
    
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
});

// POST create new user (protected)
app.post('/api/users', requireAuth, (req, res) => {
    try {
        const user = req.body;
        
        // Validate user data
        const errors = validateUser(user);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        // Create new user
        const newUser = {
            id: nextId++,
            firstName: user.firstName.trim(),
            lastName: user.lastName.trim(),
            dob: user.dob || null,
            anniversaryDate: user.anniversaryDate || null,
            mobileNumber: user.mobileNumber || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        users.push(newUser);
        saveData(); // Save to file (will be skipped in Vercel)
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user'
        });
    }
});

// PUT update user (protected)
app.put('/api/users/:id', requireAuth, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const user = req.body;
        
        // Validate user data
        const errors = validateUser(user);
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }
        
        // Update user
        users[userIndex] = {
            ...users[userIndex],
            firstName: user.firstName.trim(),
            lastName: user.lastName.trim(),
            dob: user.dob || null,
            anniversaryDate: user.anniversaryDate || null,
            mobileNumber: user.mobileNumber || null,
            updatedAt: new Date().toISOString()
        };
        
        saveData(); // Save to file (will be skipped in Vercel)
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: users[userIndex]
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user'
        });
    }
});

// DELETE user (protected)
app.delete('/api/users/:id', requireAuth, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        users.splice(userIndex, 1);
        saveData(); // Save to file (will be skipped in Vercel)
        
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
