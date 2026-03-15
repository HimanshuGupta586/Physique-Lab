import asyncHandler from 'express-async-handler';
import WorkoutLog from '../models/WorkoutLog.js';
import WorkoutRoutine from '../models/WorkoutRoutine.js';

// @desc    Get workouts
// @route   GET /api/workouts
// @access  Private
export const getWorkouts = asyncHandler(async (req, res) => {
    const workouts = await WorkoutLog.find({ user: req.user.id })
        .populate('routine', 'name splitType')
        .sort({ date: -1 });
    res.status(200).json(workouts);
});

// @desc    Set workout
// @route   POST /api/workouts
// @access  Private
export const setWorkout = asyncHandler(async (req, res) => {
    if (!req.body.name || !req.body.duration) {
        res.status(400);
        throw new Error('Please add a name and duration');
    }

    const workoutLog = await WorkoutLog.create({
        user: req.user.id,
        routine: req.body.routineId || null,
        name: req.body.name,
        date: req.body.date || Date.now(),
        duration: req.body.duration,
        exercises: req.body.exercises || []
    });

    const populatedLog = await WorkoutLog.findById(workoutLog._id).populate('routine', 'name splitType');
    res.status(200).json(populatedLog);
});

// @desc    Update workout
// @route   PUT /api/workouts/:id
// @access  Private
export const updateWorkout = asyncHandler(async (req, res) => {
    const workoutLog = await WorkoutLog.findById(req.params.id);

    if (!workoutLog) {
        res.status(400);
        throw new Error('Workout log not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the workout owner
    if (workoutLog.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedWorkout = await WorkoutLog.findByIdAndUpdate(
        req.params.id,
        req.body,
        { returnDocument: 'after' }
    ).populate('routine', 'name splitType');

    res.status(200).json(updatedWorkout);
});

// @desc    Delete workout
// @route   DELETE /api/workouts/:id
// @access  Private
export const deleteWorkout = asyncHandler(async (req, res) => {
    const workoutLog = await WorkoutLog.findById(req.params.id);

    if (!workoutLog) {
        res.status(400);
        throw new Error('Workout log not found');
    }

    // Check for user
    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Make sure the logged in user matches the workout owner
    if (workoutLog.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await workoutLog.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// ROUTINE CONTROLLERS

// @desc    Get user routines
// @route   GET /api/workouts/routines
// @access  Private
export const getRoutines = asyncHandler(async (req, res) => {
    const routines = await WorkoutRoutine.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(routines);
});

// @desc    Create routine
// @route   POST /api/workouts/routines
// @access  Private
export const setRoutine = asyncHandler(async (req, res) => {
    if (!req.body.name) {
        res.status(400);
        throw new Error('Please add a routine name');
    }

    const routine = await WorkoutRoutine.create({
        user: req.user.id,
        name: req.body.name,
        splitType: req.body.splitType || 'Custom',
        targetMuscles: req.body.targetMuscles || [],
        targetDays: req.body.targetDays || [],
        exercises: req.body.exercises || []
    });

    res.status(200).json(routine);
});

// @desc    Update routine
// @route   PUT /api/workouts/routines/:id
// @access  Private
export const updateRoutine = asyncHandler(async (req, res) => {
    const routine = await WorkoutRoutine.findById(req.params.id);

    if (!routine) {
        res.status(400);
        throw new Error('Routine not found');
    }

    if (routine.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedRoutine = await WorkoutRoutine.findByIdAndUpdate(
        req.params.id,
        req.body,
        { returnDocument: 'after' }
    );

    res.status(200).json(updatedRoutine);
});

// @desc    Delete routine
// @route   DELETE /api/workouts/routines/:id
// @access  Private
export const deleteRoutine = asyncHandler(async (req, res) => {
    const routine = await WorkoutRoutine.findById(req.params.id);

    if (!routine) {
        res.status(400);
        throw new Error('Routine not found');
    }

    if (routine.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await routine.deleteOne();
    res.status(200).json({ id: req.params.id });
});
