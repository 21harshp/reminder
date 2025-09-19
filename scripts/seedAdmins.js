const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crud-app';
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected for seeding');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const seedAdmins = async () => {
    try {
        await connectDB();

        // Clear existing admins
        await Admin.deleteMany({});

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
        console.log('Admin data seeded successfully');
        
        // Display created admins
        const createdAdmins = await Admin.find({});
        console.log('Created admins:', createdAdmins.map(admin => ({
            username: admin.username,
            role: admin.role
        })));

    } catch (error) {
        console.error('Error seeding admins:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedAdmins();
