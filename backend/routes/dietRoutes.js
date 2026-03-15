import express from 'express';
const router = express.Router();
import {
    getDailyDiet,
    createDailyDiet,
    toggleMealCompletion,
    getDietRoutines,
    setDietRoutine,
    updateDietRoutine,
    deleteDietRoutine,
    deleteDailyDiet,
    changeDailyDietRoutine
} from '../controllers/dietController.js';
import { protect } from '../middleware/authMiddleware.js';

// Configuration: Diet Routines (Plans)
router.route('/routines').get(protect, getDietRoutines).post(protect, setDietRoutine);
router.route('/routines/:id').put(protect, updateDietRoutine).delete(protect, deleteDietRoutine);

// Action: Daily Checklists
router.route('/daily').get(protect, getDailyDiet).post(protect, createDailyDiet);
router.route('/daily/:id').delete(protect, deleteDailyDiet);
router.route('/daily/:id/routine').put(protect, changeDailyDietRoutine);
router.route('/daily/:id/meal/:mealIndex').put(protect, toggleMealCompletion);

export default router;
