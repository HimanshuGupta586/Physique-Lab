import express from 'express';
const router = express.Router();
import {
    getWeights,
    setWeight,
    deleteWeight,
    updateWeight,
} from '../controllers/weightController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getWeights).post(protect, setWeight);
router.route('/:id').delete(protect, deleteWeight).put(protect, updateWeight);

export default router;
