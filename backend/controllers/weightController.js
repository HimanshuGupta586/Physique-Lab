import asyncHandler from 'express-async-handler';
import WeightLog from '../models/WeightLog.js';

// Helper function to calculate changes
const calculateAnalytics = (weights) => {
    if (!weights || weights.length === 0) return { dailyChange: 0, weeklyChange: 0, monthlyChange: 0 };
    if (weights.length === 1) return { dailyChange: 0, weeklyChange: 0, monthlyChange: 0 };

    const today = new Date();
    const oneDayAgo = new Date(today.getTime() - (24 * 60 * 60 * 1000));
    const oneWeekAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    const oneMonthAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));

    const currentWeight = weights[0].weight;
    const oldestWeight = weights[weights.length - 1].weight;

    // Find closest previous weight to benchmark dates
    // If not found, it means their history spans less than the benchmark, so we fallback to their oldest recorded weight
    const dailyWeight = weights.find(w => new Date(w.date) <= oneDayAgo)?.weight || oldestWeight;
    const weeklyWeight = weights.find(w => new Date(w.date) <= oneWeekAgo)?.weight || oldestWeight;
    const monthlyWeight = weights.find(w => new Date(w.date) <= oneMonthAgo)?.weight || oldestWeight;

    return {
        dailyChange: Number((currentWeight - dailyWeight).toFixed(2)),
        weeklyChange: Number((currentWeight - weeklyWeight).toFixed(2)),
        monthlyChange: Number((currentWeight - monthlyWeight).toFixed(2))
    };
};

// @desc    Get weight logs
// @route   GET /api/weights
// @access  Private
export const getWeights = asyncHandler(async (req, res) => {
    const weights = await WeightLog.find({ user: req.user.id }).sort({ date: -1 });

    const analytics = calculateAnalytics(weights);

    // Return both logs and calculated analytics
    res.status(200).json({ logs: weights, analytics });
});

// @desc    Set weight log
// @route   POST /api/weights
// @access  Private
export const setWeight = asyncHandler(async (req, res) => {
    if (!req.body.weight) {
        res.status(400);
        throw new Error('Please add a weight field');
    }

    const weightLog = await WeightLog.create({
        weight: req.body.weight,
        user: req.user.id,
        date: req.body.date || Date.now(),
        notes: req.body.notes || ''
    });

    // Calculate new analytics after adding
    const weights = await WeightLog.find({ user: req.user.id }).sort({ date: -1 });
    const analytics = calculateAnalytics(weights);

    res.status(200).json({ log: weightLog, analytics });
});

// @desc    Delete weight log
// @route   DELETE /api/weights/:id
// @access  Private
export const deleteWeight = asyncHandler(async (req, res) => {
    const weightLog = await WeightLog.findById(req.params.id);

    if (!weightLog) {
        res.status(400);
        throw new Error('Weight log not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (weightLog.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await weightLog.deleteOne();

    // Calculate new analytics after deleting
    const weights = await WeightLog.find({ user: req.user.id }).sort({ date: -1 });
    const analytics = calculateAnalytics(weights);

    res.status(200).json({ id: req.params.id, analytics });
});

// @desc    Update weight log
// @route   PUT /api/weights/:id
// @access  Private
export const updateWeight = asyncHandler(async (req, res) => {
    const weightLog = await WeightLog.findById(req.params.id);

    if (!weightLog) {
        res.status(400);
        throw new Error('Weight log not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    if (weightLog.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    const updatedLog = await WeightLog.findByIdAndUpdate(
        req.params.id,
        {
            weight: req.body.weight || weightLog.weight,
            date: req.body.date || weightLog.date,
            notes: req.body.notes !== undefined ? req.body.notes : weightLog.notes,
        },
        { returnDocument: 'after' }
    );

    // Calculate new analytics after updating
    const weights = await WeightLog.find({ user: req.user.id }).sort({ date: -1 });
    const analytics = calculateAnalytics(weights);

    res.status(200).json({ log: updatedLog, analytics });
});
