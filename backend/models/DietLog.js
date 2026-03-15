import mongoose from 'mongoose';

const dailyDietSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        date: {
            type: String, // Format YYYY-MM-DD
            required: true,
        },
        routineName: {
            type: String,
            default: 'Custom Load'
        },
        meals: [
            {
                name: { type: String, required: true },
                calories: { type: Number, default: 0 },
                protein: { type: Number, default: 0 },
                carbs: { type: Number, default: 0 },
                fat: { type: Number, default: 0 },
                completed: { type: Boolean, default: false }
            }
        ],
        totalCalories: { type: Number, default: 0 },
        totalProtein: { type: Number, default: 0 },
        totalCarbs: { type: Number, default: 0 },
        totalFat: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

// Ensure only one log exists per user per date
dailyDietSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('DietLog', dailyDietSchema);
