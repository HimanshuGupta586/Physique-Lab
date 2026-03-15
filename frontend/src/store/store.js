import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import weightReducer from './weightSlice';
import workoutReducer from './workoutSlice';
import dietReducer from './dietSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        weight: weightReducer,
        workout: workoutReducer,
        diet: dietReducer,
    },
});
