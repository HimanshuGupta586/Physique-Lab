import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Please add a name'],
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
        },
        maintenanceCalories: {
            type: Number,
            default: 0,
        },
        // Body Metrics
        height: { type: Number, default: null },       // cm
        currentWeight: { type: Number, default: null }, // kg
        bodyFat: { type: Number, default: null },       // %
        age: { type: Number, default: null },
        gender: { type: String, enum: ['male', 'female', 'other', null], default: null },
        // Fitness Goals
        fitnessGoal: { type: String, enum: ['cut', 'bulk', 'maintain', 'recomp', null], default: null },
        targetWeight: { type: Number, default: null },  // kg
        activityLevel: { type: String, default: '1.2' },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
