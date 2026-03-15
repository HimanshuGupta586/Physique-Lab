import mongoose from 'mongoose';

const setSchema = mongoose.Schema({
    reps: { type: Number, required: true },
    weight: { type: Number, required: true }, // Weight lifted in this specific set
    completed: { type: Boolean, default: true }
});

const exerciseLogSchema = mongoose.Schema({
    name: { type: String, required: true },
    sets: [setSchema],
});

const workoutLogSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        routine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WorkoutRoutine',
            required: false, // Optional: if they just do an ad-hoc workout
        },
        name: {
            type: String,
            required: [true, 'Please name this workout session'],
        },
        date: {
            type: Date,
            default: Date.now,
        },
        duration: {
            type: Number, // duration in minutes
            required: true,
        },
        exercises: [exerciseLogSchema],
    },
    {
        timestamps: true,
    }
);

const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);
export default WorkoutLog;
