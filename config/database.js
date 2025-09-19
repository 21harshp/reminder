const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crud-app';
        
        console.log('Attempting to connect to MongoDB...');
        console.log('MongoDB URI:', mongoURI ? 'Set' : 'Not set');
        
        const conn = await mongoose.connect(mongoURI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('Database connection error:', {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack
        });
        process.exit(1);
    }
};

module.exports = connectDB;
