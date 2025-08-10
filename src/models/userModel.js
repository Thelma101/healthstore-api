const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        maxlength: [50, 'First name cannot exceed 50 characters'],
        validate: {
            validator: (v) => /^[a-zA-Z\s-']+$/.test(v),
            message: 'First name contains invalid characters'
        }
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        maxlength: [50, 'Last name cannot exceed 50 characters'],
        validate: {
            validator: (v) => /^[a-zA-Z\s-']+$/.test(v),
            message: 'Last name contains invalid characters'
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email'],
        index: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false,
        validate: {
            validator: (v) => /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(v),
            message: 'Password must contain at least one uppercase, one lowercase, and one number'
        }
    },
    // passwordConfirm: {
    //     type: String,
    //     required: [true, 'Please confirm your password'],
    //     validate: {
    //         validator: function (el) {
    //             return el === this.password;
    //         },
    //         message: 'Passwords do not match'
    //     },
    //     select: false
    // },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: (v) => /^\+?[\d\s-()]{10,15}$/.test(v),
            message: 'Please enter a valid phone number (10-15 digits)'
        }
    },
    address: {
        street: { type: String, trim: true, maxlength: 100 },
        city: { type: String, trim: true, maxlength: 50 },
        state: { type: String, trim: true, maxlength: 50 },
        country: { type: String, default: 'Nigeria', trim: true },
        coordinates: { type: [Number], index: '2dsphere' }
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'pharmacist'],
        default: 'user'
    },
    profileImage: { type: String, default: 'default.jpg' },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, select: false },
    passwordChangedAt: Date, // Added for password change tracking
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    emailVerificationToken: String,
    emailVerificationExpire: Date
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


// userSchema.methods.generateAuthToken = function() {
//   const token = jwt.sign(
//     { id: this._id, email: this.email, role: this.role },
//     { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
//   );
//   return token;
// };

// Password handling middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    this.passwordChangedAt = Date.now() - 1000; // 1 second in past to ensure token created after
    next();
});

// Query middleware to filter inactive users
userSchema.pre(/^find/, function (next) {
    this.find({ isActive: { $ne: false } });
    next();
});

// Instance methods
userSchema.methods = {
    verifyPassword: async function (candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    },

    changedPasswordAfter: function (JWTTimestamp) {
        if (this.passwordChangedAt) {
            return JWTTimestamp < parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        }
        return false;
    },

    createPasswordResetToken: function () {
        const resetToken = crypto.randomBytes(32).toString('hex');

        this.resetPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

        return resetToken;
    },

    createEmailVerificationToken: function () {
        const verificationToken = crypto.randomBytes(32).toString('hex');

        this.emailVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');

        this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;

        return verificationToken; // Return the raw token, not the hashed one
    }
};

// Virtual
userSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Error handling
userSchema.post('save', function (error, doc, next) {
    if (error.name === 'MongoServerError' && error.code === 11000) {
        next(new Error('Email address is already registered'));
    } else {
        next(error);
    }
});




module.exports = mongoose.model('User', userSchema);