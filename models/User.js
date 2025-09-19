const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    dob: {
        type: Date,
        default: null
    },
    anniversaryDate: {
        type: Date,
        default: null
    },
    mobileNumber: {
        type: String,
        default: null,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // This will automatically manage createdAt and updatedAt
});

// Custom validation to ensure at least one date is provided
userSchema.pre('validate', function(next) {
    if (!this.dob && !this.anniversaryDate) {
        const error = new Error('Either DOB or Anniversary Date must be provided');
        error.name = 'ValidationError';
        return next(error);
    }
    next();
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('User', userSchema);
