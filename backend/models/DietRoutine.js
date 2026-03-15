import mongoose from 'mongoose';

const dietRoutineSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        name: {
            type: String,
            required: [true, 'Please add a routine name'],
        },
        targetCalories: {
            type: Number,
            required: [true, 'Please add target calories'],
            default: 0
        },
        targetProtein: {
            type: Number,
            required: [true, 'Please add target protein in grams'],
            default: 0
        },
        targetCarbs: {
            type: Number,
            required: [true, 'Please add target carbs in grams'],
            default: 0
        },
        targetFat: {
            type: Number,
            required: [true, 'Please add target fat in grams'],
            default: 0
        },
        meals: [
            {
                name: { type: String, required: true },
                calories: { type: Number, default: 0 },
                protein: { type: Number, default: 0 },
                carbs: { type: Number, default: 0 },
                fat: { type: Number, default: 0 }
            }
        ]
    },
    {
        timestamps: true,
    }
);

const DietRoutine = mongoose.model('DietRoutine', dietRoutineSchema);
export default DietRoutine;
