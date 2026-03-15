import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
    workouts: [],
    routines: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Get user workouts
export const getWorkouts = createAsyncThunk('workouts/getAll', async (_, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('/api/workouts', config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Get user routines
export const getRoutines = createAsyncThunk('workouts/getRoutines', async (_, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('/api/workouts/routines', config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Create new routine
export const createRoutine = createAsyncThunk('workouts/createRoutine', async (routineData, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post('/api/workouts/routines', routineData, config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Create new workout log
export const createWorkout = createAsyncThunk('workouts/create', async (workoutData, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post('/api/workouts', workoutData, config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Update workout log
export const updateWorkout = createAsyncThunk('workouts/update', async ({ id, workoutData }, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(`/api/workouts/${id}`, workoutData, config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Delete workout log
export const deleteWorkout = createAsyncThunk('workouts/delete', async (id, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.delete(`/api/workouts/${id}`, config);
        return response.data; // returns { id }
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Update routine
export const updateRoutine = createAsyncThunk('workouts/updateRoutine', async ({ id, routineData }, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(`/api/workouts/routines/${id}`, routineData, config);
        return response.data;
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Delete routine
export const deleteRoutine = createAsyncThunk('workouts/deleteRoutine', async (id, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.delete(`/api/workouts/routines/${id}`, config);
        return response.data; // returns { id }
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const workoutSlice = createSlice({
    name: 'workout',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getWorkouts.pending, (state) => { state.isLoading = true; })
            .addCase(getWorkouts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.workouts = action.payload;
            })
            .addCase(getWorkouts.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createWorkout.pending, (state) => { state.isLoading = true; })
            .addCase(createWorkout.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.workouts.unshift(action.payload); // Add to top
            })
            .addCase(createWorkout.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getRoutines.pending, (state) => { state.isLoading = true; })
            .addCase(getRoutines.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.routines = action.payload;
            })
            .addCase(getRoutines.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createRoutine.pending, (state) => { state.isLoading = true; })
            .addCase(createRoutine.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.routines.unshift(action.payload);
            })
            .addCase(createRoutine.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateWorkout.pending, (state) => { state.isLoading = true; })
            .addCase(updateWorkout.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.workouts.findIndex(w => w._id === action.payload._id);
                if (index !== -1) {
                    state.workouts[index] = action.payload;
                }
            })
            .addCase(updateWorkout.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteWorkout.pending, (state) => { state.isLoading = true; })
            .addCase(deleteWorkout.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.workouts = state.workouts.filter(w => w._id !== action.payload.id);
            })
            .addCase(deleteWorkout.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateRoutine.pending, (state) => { state.isLoading = true; })
            .addCase(updateRoutine.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.routines.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.routines[index] = action.payload;
                }
            })
            .addCase(updateRoutine.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteRoutine.pending, (state) => { state.isLoading = true; })
            .addCase(deleteRoutine.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.routines = state.routines.filter(r => r._id !== action.payload.id);
            })
            .addCase(deleteRoutine.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = workoutSlice.actions;
export default workoutSlice.reducer;
