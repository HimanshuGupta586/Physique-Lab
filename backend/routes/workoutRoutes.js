import express from 'express';
const router = express.Router();
import {
    getWorkouts,
    setWorkout,
    updateWorkout,
    deleteWorkout,
    getRoutines,
    setRoutine,
    updateRoutine,
    deleteRoutine
} from '../controllers/workoutController.js';
import { protect } from '../middleware/authMiddleware.js';

// Order matters: /routines must come before /:id
router.route('/routines').get(protect, getRoutines).post(protect, setRoutine);
router.route('/routines/:id').put(protect, updateRoutine).delete(protect, deleteRoutine);

router.route('/').get(protect, getWorkouts).post(protect, setWorkout);
router.route('/:id').put(protect, updateWorkout).delete(protect, deleteWorkout);

export default router;
