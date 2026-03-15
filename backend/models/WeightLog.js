import mongoose from 'mongoose';

const weightLogSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        weight: {
            type: Number,
            required: [true, 'Please add a weight value'],
        },
        date: {
            type: Date,
            default: Date.now,
        },
        notes: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);

const WeightLog = mongoose.model('WeightLog', weightLogSchema);
export default WeightLog;
