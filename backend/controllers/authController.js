import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// Serialize a user document into the API response shape
const serializeUser = (user, token) => ({
    _id: user.id,
    name: user.name,
    email: user.email,
    maintenanceCalories: user.maintenanceCalories,
    height: user.height,
    currentWeight: user.currentWeight,
    bodyFat: user.bodyFat,
    age: user.age,
    gender: user.gender,
    fitnessGoal: user.fitnessGoal,
    targetWeight: user.targetWeight,
    activityLevel: user.activityLevel,
    createdAt: user.createdAt,
    token: token || generateToken(user._id),
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({ name, email, password });

    if (user) {
        res.status(201).json(serializeUser(user));
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json(serializeUser(user));
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
    res.status(200).json(req.user);
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Scalar string/number fields — update only if explicitly provided
    const fields = [
        'name', 'email',
        'maintenanceCalories', 'height', 'currentWeight',
        'bodyFat', 'age', 'gender', 'fitnessGoal',
        'targetWeight', 'activityLevel'
    ];

    fields.forEach(field => {
        if (req.body[field] !== undefined) {
            user[field] = req.body[field];
        }
    });

    if (req.body.password) {
        user.password = req.body.password;
    }

    const updatedUser = await user.save();
    const token = req.body.password ? generateToken(updatedUser._id) : req.user.token || generateToken(updatedUser._id);

    res.json(serializeUser(updatedUser, token));
});
