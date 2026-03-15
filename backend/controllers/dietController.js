import asyncHandler from 'express-async-handler';
import DietLog from '../models/DietLog.js';
import DietRoutine from '../models/DietRoutine.js';

// @desc    Get daily diet checklist by date
// @route   GET /api/diet/daily?date=YYYY-MM-DD
// @access  Private
export const getDailyDiet = asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) {
        res.status(400);
        throw new Error('Please provide a date');
    }

    const dailyLog = await DietLog.findOne({ user: req.user.id, date });
    res.status(200).json(dailyLog); // Returns null if not found, frontend handles empty state
});

// @desc    Create daily diet checklist from routine
// @route   POST /api/diet/daily
// @access  Private
export const createDailyDiet = asyncHandler(async (req, res) => {
    const { date, routineId } = req.body;

    if (!date || !routineId) {
        res.status(400);
        throw new Error('Please provide date and routineId');
    }

    // Check if one already exists for this date
    const existing = await DietLog.findOne({ user: req.user.id, date });
    if (existing) {
        res.status(400);
        throw new Error('A diet log already exists for this date');
    }

    const routine = await DietRoutine.findById(routineId);
    if (!routine) {
        res.status(404);
        throw new Error('Routine not found');
    }

    // Map routine meals to daily checklist meals
    const checklistMeals = routine.meals.map(m => ({
        name: m.name,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        completed: false
    }));

    const dailyLog = await DietLog.create({
        user: req.user.id,
        date,
        routineName: routine.name,
        meals: checklistMeals,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
    });

    res.status(201).json(dailyLog);
});

// @desc    Toggle meal completion status
// @route   PUT /api/diet/daily/:id/meal/:mealIndex
// @access  Private
export const toggleMealCompletion = asyncHandler(async (req, res) => {
    const { id, mealIndex } = req.params;

    const dailyLog = await DietLog.findById(id);

    if (!dailyLog) {
        res.status(404);
        throw new Error('Daily log not found');
    }

    if (dailyLog.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (mealIndex < 0 || mealIndex >= dailyLog.meals.length) {
        res.status(400);
        throw new Error('Invalid meal index');
    }

    // Toggle the boolean
    dailyLog.meals[mealIndex].completed = !dailyLog.meals[mealIndex].completed;

    // Recalculate totals based on completed meals
    let calcCalories = 0, calcProtein = 0, calcCarbs = 0, calcFat = 0;

    dailyLog.meals.forEach(meal => {
        if (meal.completed) {
            calcCalories += meal.calories || 0;
            calcProtein += meal.protein || 0;
            calcCarbs += meal.carbs || 0;
            calcFat += meal.fat || 0;
        }
    });

    dailyLog.totalCalories = calcCalories;
    dailyLog.totalProtein = calcProtein;
    dailyLog.totalCarbs = calcCarbs;
    dailyLog.totalFat = calcFat;

    const updatedLog = await dailyLog.save();

    res.status(200).json(updatedLog);
});

// @desc    Delete daily diet checklist
// @route   DELETE /api/diet/daily/:id
// @access  Private
export const deleteDailyDiet = asyncHandler(async (req, res) => {
    const dailyLog = await DietLog.findById(req.params.id);

    if (!dailyLog) {
        res.status(404);
        throw new Error('Daily log not found');
    }

    if (dailyLog.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    await dailyLog.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// @desc    Change daily diet routine without losing progress
// @route   PUT /api/diet/daily/:id/routine
// @access  Private
export const changeDailyDietRoutine = asyncHandler(async (req, res) => {
    const { routineId } = req.body;
    
    if (!routineId) {
        res.status(400);
        throw new Error('Please provide routineId');
    }

    const dailyLog = await DietLog.findById(req.params.id);
    if (!dailyLog) {
        res.status(404);
        throw new Error('Daily log not found');
    }

    if (dailyLog.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    const routine = await DietRoutine.findById(routineId);
    if (!routine) {
        res.status(404);
        throw new Error('Routine not found');
    }

    // Map over new routine meals, retaining completion status from old meals if they exist
    const oldMeals = dailyLog.meals || [];
    const newChecklistMeals = routine.meals.map(m => {
        // Find if old log had a meal with this exact name that was completed
        const oldMealMatch = oldMeals.find(om => om.name.toLowerCase() === m.name.toLowerCase() && om.completed);
        return {
            name: m.name,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
            completed: !!oldMealMatch // Keep completed if it was checked off
        };
    });

    // Recalculate totals
    let calcCalories = 0, calcProtein = 0, calcCarbs = 0, calcFat = 0;
    newChecklistMeals.forEach(meal => {
        if (meal.completed) {
            calcCalories += meal.calories || 0;
            calcProtein += meal.protein || 0;
            calcCarbs += meal.carbs || 0;
            calcFat += meal.fat || 0;
        }
    });

    dailyLog.routineName = routine.name;
    dailyLog.meals = newChecklistMeals;
    dailyLog.totalCalories = calcCalories;
    dailyLog.totalProtein = calcProtein;
    dailyLog.totalCarbs = calcCarbs;
    dailyLog.totalFat = calcFat;

    const updatedLog = await dailyLog.save();

    res.status(200).json(updatedLog);
});

// ============================================
// ROUTINE ENDPOINTS
// ============================================

// @desc    Get diet routines
// @route   GET /api/diet/routines
// @access  Private
export const getDietRoutines = asyncHandler(async (req, res) => {
    const routines = await DietRoutine.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(routines);
});

// @desc    Create diet routine
// @route   POST /api/diet/routines
// @access  Private
export const setDietRoutine = asyncHandler(async (req, res) => {

    if (!req.body.name) {
        res.status(400);
        throw new Error('Please add a routine name');
    }

    // Auto-calculate targets if meals are provided
    let calcCalories = 0, calcProtein = 0, calcCarbs = 0, calcFat = 0;
    if (req.body.meals && Array.isArray(req.body.meals)) {
        req.body.meals.forEach(m => {
            calcCalories += Number(m.calories) || 0;
            calcProtein += Number(m.protein) || 0;
            calcCarbs += Number(m.carbs) || 0;
            calcFat += Number(m.fat) || 0;
        });
    }

    const dict = await DietRoutine.create({
        name: req.body.name,
        targetCalories: calcCalories || req.body.targetCalories || 0,
        targetProtein: calcProtein || req.body.targetProtein || 0,
        targetCarbs: calcCarbs || req.body.targetCarbs || 0,
        targetFat: calcFat || req.body.targetFat || 0,
        meals: req.body.meals || [],
        user: req.user.id,
    });

    res.status(200).json(dict);
});

// @desc    Update diet routine
// @route   PUT /api/diet/routines/:id
// @access  Private
export const updateDietRoutine = asyncHandler(async (req, res) => {
    const routine = await DietRoutine.findById(req.params.id);

    if (!routine) {
        res.status(400);
        throw new Error('Diet routine not found');
    }

    if (routine.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Auto-calculate targets if meals are updated
    if (req.body.meals && Array.isArray(req.body.meals)) {
        let calcCalories = 0, calcProtein = 0, calcCarbs = 0, calcFat = 0;
        req.body.meals.forEach(m => {
            calcCalories += Number(m.calories) || 0;
            calcProtein += Number(m.protein) || 0;
            calcCarbs += Number(m.carbs) || 0;
            calcFat += Number(m.fat) || 0;
        });
        req.body.targetCalories = calcCalories;
        req.body.targetProtein = calcProtein;
        req.body.targetCarbs = calcCarbs;
        req.body.targetFat = calcFat;
    }

    const updatedRoutine = await DietRoutine.findByIdAndUpdate(req.params.id, req.body, {
        returnDocument: 'after',
    });

    res.status(200).json(updatedRoutine);
});

// @desc    Delete diet routine
// @route   DELETE /api/diet/routines/:id
// @access  Private
export const deleteDietRoutine = asyncHandler(async (req, res) => {
    const routine = await DietRoutine.findById(req.params.id);

    if (!routine) {
        res.status(400);
        throw new Error('Diet routine not found');
    }

    if (routine.user.toString() !== req.user.id) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await routine.deleteOne();

    res.status(200).json({ id: req.params.id });
});
