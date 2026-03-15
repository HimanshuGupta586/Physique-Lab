import mongoose from 'mongoose';

const workoutRoutineSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: [true, 'Please name your routine (e.g., Push Day)'],
        },
        splitType: {
            type: String, // e.g., 'Push', 'Pull', 'Legs', 'Full Body', 'Cardio'
        },
        targetMuscles: [{
            type: String,
        }],
        targetDays: [{
            type: String,
        }],
        exercises: [
            {
                name: { type: String, required: true },
                targetSets: { type: Number, required: true },
                targetReps: { type: Number, required: true }
            }
        ]
    },
    {
        timestamps: true,
    }
);

const WorkoutRoutine = mongoose.model('WorkoutRoutine', workoutRoutineSchema);
export default WorkoutRoutine;
